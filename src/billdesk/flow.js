// Bill Desk actions. Each one checks the invoice is in a state that allows it (refuses otherwise), changes the
// record, and appends one event to its trail (BD-15: { at, by, role, action, from, to, note }; never edited).
import { commit, getState } from './store'
import { me } from './roles'
import { matchOf, saveBlocks, checkBlocks, dupOf, normNo, linesFrom, dcGrnMap, lineTakenMap, grnState, dcsForLines, dcLocked } from './logic'
import { antzRead, AI_READ_MS } from './antzAi'
import { sampleRate } from './sample'
import { kindLabel } from './ui/docStore'

// local wall-clock time (2 Nov: toISOString() is UTC, and the trail reads its times as local)
const now = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const pad = (n, w) => String(n).padStart(w, '0')
const who = () => { const r = me(); return { by: r.person, role: r.value } }
const ev = (action, from, to, note) => ({ at: now(), ...who(), action, from: from || null, to: to || null, ...(note ? { note } : {}) })

const find = (w, id) => {
  const inv = w.invoices.find(i => i.id === id)
  if (!inv) throw new Error('This invoice no longer exists')

  return inv
}
const allow = (inv, states, what) => {
  if (!states.includes(inv.status)) throw new Error(`Can’t ${what} an invoice that is ${inv.status.replace(/_/g, ' ')}`)
}
const move = (inv, to, action, note) => {
  inv.trail.push(ev(action, inv.status, to, note))
  inv.status = to
}
const rematch = inv => {
  const m = matchOf(inv)
  inv.match = m.match
  inv.discrepancies = m.discrepancies
}

// ---------- selectors ----------
// a DC is taken by the GRN that holds it, a GRN line by the invoice that bills it (BD-72)
export const takenDcs = s => dcGrnMap(s.grns)
export const takenLines = s => lineTakenMap(s.invoices)
export const freeDcs = s => {
  const t = takenDcs(s)

  return s.dcs.filter(d => !t[d.dcNumber])
}
export const invoiceOf = (s, id) => s.invoices.find(i => i.id === id)

// ---------- GRN (BD-72, 5 Nov) ----------
// Make GRN: the clerk ticks one vendor's challans on Challans › To Group. Lines are the challans' items, each with its
// received quantity added up across the challans. Its challans can change, or the GRN be deleted, only while no line is
// on an invoice. Later a GRN can come from another system (source, extRef); invoices bill against it the same way.
const findGrn = (w, id) => {
  const g = (w.grns || []).find(x => x.id === id)
  if (!g) throw new Error('This GRN no longer exists')

  return g
}
const grnOpen = (w, g, what) => {
  if (grnState(g, lineTakenMap(w.invoices)) !== 'to_bill') throw new Error(`Can’t ${what} ${g.id}: it has invoices. Delete them first`)
}
// an item received at nothing is not a line to bill
const grnLines = (base, dcNumbers) => linesFrom(dcNumbers.map(dc => base.dcsBy[dc])).filter(l => l.receivedQty > 0).map(({ itemId, unitId, receivedQty }) => ({ itemId, unitId, receivedQty }))
export const makeGrn = dcNumbers => commit((w, base) => {
  if (!dcNumbers.length) throw new Error('Tick the challans to group')
  const dcs = dcNumbers.map(dc => base.dcsBy[dc])
  if (dcs.some(d => !d)) throw new Error('A challan is no longer in Diet & Kitchen')
  if (new Set(dcs.map(d => d.vendorId)).size > 1) throw new Error('A GRN holds one vendor’s challans')
  w.grns = w.grns || []
  const held = dcGrnMap(w.grns)
  const clash = dcNumbers.filter(dc => held[dc])
  if (clash.length) throw new Error(`${clash.join(', ')} ${clash.length === 1 ? 'is' : 'are'} already on a GRN`)
  w.seq.grn = (w.seq.grn || 0) + 1
  const g = { id: `GRN-26-${pad(w.seq.grn, 4)}`, source: 'bill_desk', vendorId: dcs[0].vendorId, dcNumbers: [...dcNumbers].sort(), lines: grnLines(base, dcNumbers), createdAt: now(), createdBy: me().person, trail: [] }
  g.trail.push(ev('GRN made', null, null, g.dcNumbers.join(', ')))
  w.grns.push(g)

  return g.id
})
// a challan leaves a GRN while none of its items is on an invoice (5 Nov: "ability to remove DC's from one grn"); the
// last one leaving deletes the GRN
export const removeFromGrn = (id, dc) => commit((w, base) => {
  const g = findGrn(w, id)
  if (!g.dcNumbers.includes(dc)) throw new Error(`${dc} is not on ${g.id}`)
  if (dcLocked(g, base.dcsBy[dc], lineTakenMap(w.invoices))) throw new Error(`${dc} has items already on an invoice`)
  if (g.dcNumbers.length === 1) { w.grns = w.grns.filter(x => x.id !== id); return 'deleted' }
  g.dcNumbers = g.dcNumbers.filter(x => x !== dc)
  g.lines = grnLines(base, g.dcNumbers)
  g.trail.push(ev('Challan removed', null, null, dc))

  return 'removed'
})
// more of the vendor's challans to group join a GRN, unless one carries an item already billed on it
export const addToGrn = (id, dcNumbers) => commit((w, base) => {
  const g = findGrn(w, id)
  if (!dcNumbers.length) throw new Error('Tick the challans to add')
  const held = dcGrnMap(w.grns), lt = lineTakenMap(w.invoices)
  dcNumbers.forEach(dc => {
    const d = base.dcsBy[dc]
    if (!d) throw new Error(`${dc} is no longer in Diet & Kitchen`)
    if (d.vendorId !== g.vendorId) throw new Error('A GRN holds one vendor’s challans')
    if (held[dc]) throw new Error(`${dc} is already on ${held[dc]}`)
    if (dcLocked(g, d, lt)) throw new Error(`${dc} has an item already billed on ${g.id}`)
  })
  g.dcNumbers = [...g.dcNumbers, ...dcNumbers].sort()
  g.lines = grnLines(base, g.dcNumbers)
  g.trail.push(ev(dcNumbers.length === 1 ? 'Challan added' : 'Challans added', null, null, dcNumbers.join(', ')))
})
// a GRN goes while no invoice bills it; its challans go back to To Group
export const deleteGrn = id => commit(w => {
  const g = findGrn(w, id)
  grnOpen(w, g, 'delete')
  w.grns = w.grns.filter(x => x.id !== id)
})

// ---------- clerk ----------
// Add invoice / edit (one form, BD-21): vendor → its DCs (free, or freed by deleting the discrepancy invoice holding
// them) → the DCs' items, billed qty, cost and GST → saved. Saving keeps it with the clerk under On invoice, as
// Matched or With discrepancies; only matched ones are sent to the head.
const CLERK_OPEN = ['draft', 'returned_to_clerk']
const CLERK_EDIT = [...CLERK_OPEN, 'to_connect']

// Send to Antz AI (1 Nov): the clerk gives the invoice number and the paper; the AI reads the rest in the background and
// the invoice waits in Invoiced › To connect for the clerk to connect DCs and match items
export const sendToAi = f => commit((w, base) => {
  const no = (f.invoiceNo || '').trim()
  if (!no) throw new Error('Enter the invoice number')
  if (!(f.docs || []).length) throw new Error('Attach the invoice')
  const { paperLines, ...ai } = antzRead(base, w.invoices, { invoiceNo: no, vendorId: f.vendorId }, sampleRate, w.grns) // eslint-disable-line no-unused-vars
  // a number already recorded blocks, whichever vendor (2 Nov)
  const dup = w.invoices.find(i => normNo(i.invoiceNo) === normNo(no))
  if (dup) throw new Error(`Invoice ${no} is already recorded as ${dup.id}`)
  w.seq.inv += 1
  const inv = { id: `BD-26-${pad(w.seq.inv, 4)}`, status: 'to_connect', vendorId: ai.vendorId, dcNumbers: [], invoiceNo: no, invoiceDate: f.invoiceDate || ai.invoiceDate, lines: [], docs: f.docs, printed: {}, approvalIds: [], outcomes: [], trail: [], match: 'matched', discrepancies: [], ai: { ...ai, readyAt: Date.now() + AI_READ_MS, sentAt: now() } }
  inv.trail.push(ev('Sent to Antz AI', null, 'to_connect', no))
  w.invoices.push(inv)

  return inv.id
})
// Try again on a read that failed (Naveen's "DC failed" · Try again): the paper goes back to the AI
export const retryAi = id => commit((w, base) => {
  const inv = find(w, id)
  allow(inv, ['to_connect'], 'resend')
  const { paperLines, ...ai } = antzRead(base, w.invoices.filter(i => i.id !== id), { invoiceNo: inv.invoiceNo, vendorId: inv.vendorId }, sampleRate, w.grns) // eslint-disable-line no-unused-vars
  inv.vendorId = ai.vendorId
  inv.invoiceDate = inv.invoiceDate || ai.invoiceDate
  inv.ai = { ...ai, readyAt: Date.now() + AI_READ_MS, sentAt: now() }
  inv.trail.push(ev('Sent to Antz AI again', null, null, inv.invoiceNo))
})
// Add invoice against a GRN (BD-72): the ticked GRN lines are this invoice's; the challans it names are the GRN's
// challans that carry those items
export const saveInvoiceForm = f => commit((w, base) => {
  const g = f.grnId ? findGrn(w, f.grnId) : null
  if (g && g.vendorId !== f.vendorId) throw new Error('The GRN is another vendor’s')
  let inv = f.id ? find(w, f.id) : null
  if (inv) allow(inv, CLERK_EDIT, 'edit')
  const dcNumbers = g ? dcsForLines(g, f.lines, base.dcsBy) : []
  const draft = { ...(inv || { id: null, approvalIds: [], outcomes: [], trail: [], status: 'draft' }), vendorId: f.vendorId, grnId: f.grnId || null, dcNumbers, invoiceNo: f.invoiceNo.trim(), invoiceDate: f.invoiceDate, lines: f.lines, docs: f.docs || [], printed: f.printed || {} }
  const blocks = saveBlocks(draft, w.invoices, lineTakenMap(w.invoices))
  if (blocks.length) throw new Error(blocks[0])
  const before = inv ? inv.docs || [] : []
  if (!inv) {
    w.seq.inv += 1
    inv = { ...draft, id: `BD-26-${pad(w.seq.inv, 4)}` }
    w.invoices.push(inv)
    inv.trail.push(ev('Invoice added', null, 'draft', `${inv.invoiceNo} · ${inv.grnId}`))
  } else {
    const wasAi = inv.status === 'to_connect'
    Object.assign(inv, draft)
    if (wasAi) { inv.status = 'draft'; inv.trail.push(ev('GRN connected', 'to_connect', 'draft', inv.grnId)) } else inv.trail.push(ev('Invoice edited', null, null, inv.grnId))
  }
  const added = inv.docs.filter(d => !before.some(b => b.id === d.id)), removed = before.filter(b => !inv.docs.some(d => d.id === b.id))
  if (added.length) inv.trail.push(ev(`Attached ${added.length === 1 ? 'a document' : `${added.length} documents`}`, null, null, added.map(d => `${kindLabel(d.kind)}: ${d.name}`).join(', ')))
  if (removed.length) inv.trail.push(ev(`Removed ${removed.length === 1 ? 'a document' : `${removed.length} documents`}`, null, null, removed.map(d => `${kindLabel(d.kind)}: ${d.name}`).join(', ')))
  rematch(inv)
  // saving sends it to the head, matched or with discrepancies; the clerk does not choose what to send (Sourav, 2 Nov)
  if (inv.status === 'draft' || inv.status === 'returned_to_clerk') move(inv, 'with_head', inv.trail.some(e => e.to === 'with_head') ? 'Sent to the head again' : 'Sent to the head')

  return inv.id
})

// delete an invoice still with the clerk; its GRN lines are free to bill again (BD-72). Used when a corrected invoice
// replaces one with discrepancies (BD-22).
export const deleteInvoice = id => commit(w => {
  const inv = find(w, id)
  allow(inv, CLERK_EDIT, 'delete')
  w.invoices = w.invoices.filter(i => i.id !== id)
})

// ---------- head ----------
const HEAD_OPEN = ['with_head', 'returned_by_finance']
export const returnToClerk = (id, note) => commit(w => {
  const inv = find(w, id)
  allow(inv, HEAD_OPEN, 'return')
  if (!note?.trim()) throw new Error('Say what the clerk should fix')
  delete inv.signedDcAck
  move(inv, 'returned_to_clerk', 'Returned to clerk', note.trim())
})
export const ackSignedDc = id => commit((w, base) => {
  const inv = find(w, id)
  allow(inv, HEAD_OPEN, 'accept')
  const missing = inv.dcNumbers.filter(dc => !base.dcsBy[dc]?.signedDc)
  inv.signedDcAck = { by: me().person, at: now() }
  inv.trail.push(ev('Accepted without signed DC', null, null, missing.join(', ')))
})
export const markChecked = ids => commit((w, base) => {
  ids.forEach(id => {
    const inv = find(w, id)
    allow(inv, HEAD_OPEN, 'check')
    const b = checkBlocks(inv, base.dcsBy)
    if (dupOf(inv, w.invoices)) b.push(`Invoice ${inv.invoiceNo} is already recorded for this vendor`)
    if (b.length) throw new Error(`${inv.id}: ${b[0]}`)
    move(inv, 'checked', 'Marked checked')
  })
})
export const handOver = (ids, note) => commit(w => {
  if (!ids.length) throw new Error('Tick the invoices to send')
  const list = ids.map(id => find(w, id))
  list.forEach(inv => allow(inv, ['checked'], 'send'))
  w.seq.ho += 1
  const ho = { id: `HO-26-${pad(w.seq.ho, 3)}`, invoiceIds: ids, note: note?.trim() || '', sentBy: me().person, sentAt: now(), receivedBy: null, receivedAt: null }
  w.handovers.push(ho)
  list.forEach(inv => { inv.handoverId = ho.id; move(inv, 'with_finance', `Sent to Finance · ${ho.id}`, ho.note) })

  return ho.id
})

// The head's Approve (2 Nov): checked and sent to Finance in one step, so it lands in Finance's From Bill Desk. Just
// Approve or Send back (Sourav: "remove these states, its just approve or send back"); quantity differences travel with
// the invoice. A challan without a signed copy is accepted without it here (BD-3). Takes one id or several: the head
// can tick invoices on Under Review and mark them reviewed together (3 Nov), sent to Finance as one handover.
export const approveToFinance = (idOrIds, { note } = {}) => {
  const ids = [].concat(idOrIds)
  if (!ids.length) throw new Error('Tick the invoices to mark as reviewed')
  commit((w, base) => ids.forEach(id => {
    const inv = find(w, id)
    allow(inv, HEAD_OPEN, 'approve')
    if (dupOf(inv, w.invoices)) throw new Error(`Invoice ${inv.invoiceNo} is already recorded`)
    rematch(inv)
    const missing = inv.dcNumbers.filter(dc => base.dcsBy[dc] && !base.dcsBy[dc].signedDc)
    if (missing.length && !inv.signedDcAck) {
      inv.signedDcAck = { by: me().person, at: now() }
      inv.trail.push(ev('Accepted without signed DC', null, null, missing.join(', ')))
    }
    const n = (inv.discrepancies || []).filter(d => d.itemId).length
    // the head marks it reviewed, not approved (2 Nov: "head clicks Reviewed"); approval is the approver's, later
    move(inv, 'checked', n ? `Reviewed with ${n} ${n === 1 ? 'item' : 'items'} differing` : 'Reviewed', note?.trim())
  }))

  return handOver(ids)
}

// ---------- Finance ----------
export const receiveHandover = hoId => commit(w => {
  const ho = w.handovers.find(h => h.id === hoId)
  if (!ho) throw new Error('No such handover')
  if (ho.receivedAt) throw new Error(`${hoId} is already received`)
  ho.receivedBy = me().person
  ho.receivedAt = now()
  ho.invoiceIds.forEach(id => { const inv = w.invoices.find(i => i.id === id); if (inv) inv.trail.push(ev(`Received by Finance · ${hoId}`, null, null)) })
})
// Finance (2 Nov): To Verify (with Finance; 'checked' is an older sample state that never got its handover) →
// Awaiting Approval (in a batch) → Payment Pending (approved) → Closed (paid or rejected). No "mark received" step:
// a review hands the invoice over by itself. Outcomes are Approved or Rejected only (Deferred dropped).
const TO_VERIFY = ['with_finance', 'checked']
export const returnByFinance = (id, reason) => commit(w => {
  const inv = find(w, id)
  allow(inv, TO_VERIFY, 'return')
  if (!reason?.trim()) throw new Error('Say why it goes back')
  move(inv, 'returned_by_finance', 'Returned by Finance', reason.trim())
})
export const sendForApproval = (ids, { sentTo, ref, date, note }) => commit(w => {
  if (!ids.length) throw new Error('Tick the invoices to send')
  if (!sentTo?.trim()) throw new Error('Say who it was sent to')
  const list = ids.map(id => find(w, id))
  list.forEach(inv => allow(inv, TO_VERIFY, 'send'))
  w.seq.pa += 1
  const pa = { id: `PA-26-${pad(w.seq.pa, 3)}`, invoiceIds: ids, sentTo: sentTo.trim(), ref: ref?.trim() || '', sentAt: date ? `${date}T${now().slice(11)}` : now(), note: note?.trim() || '', sentBy: me().person }
  w.approvals.push(pa)
  list.forEach(inv => { inv.approvalIds = [...(inv.approvalIds || []), pa.id]; move(inv, 'sent_for_approval', `Sent for payment approval · ${pa.id}`, `${pa.sentTo}${pa.ref ? ` · ref ${pa.ref}` : ''}`) })

  return pa.id
})
// the approver's decision, recorded by Finance: Approved (then Payment Pending) or Rejected with a reason (BD-8 open)
export const recordOutcome = (ids, { kind, reason }) => commit(w => {
  if (!['approved', 'rejected'].includes(kind)) throw new Error('Pick Approved or Rejected')
  if (kind === 'rejected' && !reason?.trim()) throw new Error('Say why it was rejected')
  ids.forEach(id => {
    const inv = find(w, id)
    allow(inv, ['sent_for_approval'], 'record a decision for')
    const paId = inv.approvalIds[inv.approvalIds.length - 1]
    inv.outcomes = [...(inv.outcomes || []), { kind, approvalId: paId, reason: reason?.trim() || null, by: me().person, at: now() }]
    move(inv, kind, `${kind === 'approved' ? 'Approved' : 'Rejected'} · ${paId}`, reason?.trim())
  })
})
// paid: Finance records the payment reference (UTR) and date
export const markPaid = (ids, { utr, date }) => commit(w => {
  if (!ids.length) throw new Error('Tick the invoices paid')
  if (!utr?.trim()) throw new Error('Enter the payment reference (UTR)')
  ids.forEach(id => {
    const inv = find(w, id)
    allow(inv, ['approved'], 'mark paid')
    inv.payment = { utr: utr.trim(), date: date || now().slice(0, 10), by: me().person, at: now() }
    move(inv, 'paid', 'Paid', `UTR ${inv.payment.utr} · ${inv.payment.date.split('-').reverse().join('-')}`)
  })
})

export const stateNow = getState
