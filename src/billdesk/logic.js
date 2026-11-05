// Bill Desk rules that need no store: reconciliation (BD-2, BD-10), the duplicate key (BD-11),
// which DCs are taken (BD-9) and the status words. Pure functions over plain records, shared by the store's sample
// data, the flow actions and the screens.

export const STATUS = {
  to_connect: 'Draft',
  draft: 'With clerk',
  with_head: 'With head',
  returned_to_clerk: 'Returned to clerk',
  checked: 'Checked',
  with_finance: 'With Finance',
  returned_by_finance: 'Returned by Finance',
  sent_for_approval: 'Sent for approval',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected'
}
// an invoice's stage as every pill shows it, in the tables, Payments, the details header, the stage rail and Data
// Explorer (Sourav, 3 Nov: "match all the status pills, from the table and the details page"): status → [label, tone]
export const STAGE = {
  to_connect: ['Draft', 'quiet'],
  draft: ['Draft', 'quiet'],
  returned_to_clerk: ['Correction Needed', 'warn'],
  with_head: ['Under Review', 'quiet'],
  returned_by_finance: ['Returned by Finance', 'warn'],
  checked: ['In Verification', 'info'],
  with_finance: ['In Verification', 'info'],
  sent_for_approval: ['Awaiting Approval', 'check'],
  approved: ['Payment Pending', 'ok'],
  paid: ['Paid', 'ok'],
  rejected: ['Rejected', 'bad']
}
export const stageLabel = status => STAGE[status]?.[0] || status
export const OUTCOME = { approved: 'Approved', rejected: 'Rejected', deferred: 'Deferred' }
export const DISC = { more: 'Billed more than received', less: 'Billed less than received', not_received: 'On the bill, not received', arith: 'Bill doesn’t add up' }
export const RESOLUTION = { pay_received: 'Pay as received', accept_billed: 'Accept as billed' }

export const r2 = n => Math.round((Number(n) || 0) * 100) / 100
// whole rupees stay whole; anything with paise shows both digits (₹73,426.50, never ₹73,426.5)
export const inr = n => { const v = Math.round((Number(n) || 0) * 100) / 100; return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}` }
export const isNum = v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v))
const DAY = 86400000
export const dayOf = iso => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`) : null)
export const fmtDay = iso => (iso ? dayOf(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—')
export const fmtAt = iso => (iso ? `${fmtDay(iso)}, ${new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}` : '—')
export const daysSince = (iso, now = new Date()) => (iso ? Math.floor((dayOf(now.toISOString()) - dayOf(iso)) / DAY) : 0)
export const todayIso = () => new Date().toISOString().slice(0, 10)

// BD-11: vendor + invoice number without spaces, hyphens, slashes or dots, in capitals; the date doesn't matter
export const normNo = s => String(s || '').toUpperCase().replace(/[\s\-/.]/g, '')
export const dupOf = (inv, invoices) => {
  const key = normNo(inv.invoiceNo)
  if (!key) return null
  // an invoice number already recorded blocks, whichever vendor it is under (Sourav, 2 Nov: "if the same invoice number
  // is present don't allow to proceed"; replaces BD-38's vendor + number)

  return invoices.find(o => o.id !== inv.id && normNo(o.invoiceNo) === key) || null
}

// BD-9: a DC is taken while any invoice lists it (a deleted draft is gone, so its DCs are free again)
export const takenMap = invoices => {
  const m = {}
  invoices.forEach(i => i.dcNumbers.forEach(dc => { m[dc] = i.id }))

  return m
}

// BD-72 (5 Nov): n challans → 1 GRN → 1 or n invoices. The clerk groups one vendor's challans into a GRN; a GRN line is
// one item, its received quantity added up across the GRN's challans; each line goes on exactly one invoice. A DC is
// taken while a GRN holds it; a GRN line while an invoice holds it (deleting the invoice frees the line).
export const dcGrnMap = grns => {
  const m = {}
  ;(grns || []).forEach(g => g.dcNumbers.forEach(dc => { m[dc] = g.id }))

  return m
}
export const lineKey = (grnId, itemId) => `${grnId}:${itemId}`
export const lineTakenMap = invoices => {
  const m = {}
  invoices.forEach(i => { if (i.grnId) i.lines.forEach(l => { if (l.itemId && !l.extra) m[lineKey(i.grnId, l.itemId)] = i.id }) })

  return m
}
// To Bill (no line on an invoice) · Partly Billed · Fully Billed, worked out from the invoices, never stored
export const GRN_STATE = { to_bill: ['To Bill', 'quiet'], partly: ['Partly Billed', 'check'], fully: ['Fully Billed', 'ok'] }
export const grnBilled = (g, taken) => g.lines.filter(l => taken[lineKey(g.id, l.itemId)]).length
export const grnState = (g, taken) => { const n = grnBilled(g, taken); return n === 0 ? 'to_bill' : n < g.lines.length ? 'partly' : 'fully' }
// a challan whose items are already billed on this GRN can't leave it, and a challan whose items are can't join it:
// either would change the received quantity of a line on an invoice
export const billedItems = (g, taken) => new Set(g.lines.filter(l => taken[lineKey(g.id, l.itemId)]).map(l => l.itemId))
export const dcLocked = (g, d, taken) => { const b = billedItems(g, taken); return !!d && d.lines.some(l => l.receivedQty > 0 && b.has(l.itemId)) }
export const grnInvoiceIds = (g, taken) => [...new Set(g.lines.map(l => taken[lineKey(g.id, l.itemId)]).filter(Boolean))]
// the challans an invoice's lines came from (Invoice details, the signed-DC check, the Excel): the GRN's challans that
// carry one of its items
export const dcsForLines = (g, lines, dcsBy) => g.dcNumbers.filter(dc => (dcsBy[dc]?.lines || []).some(l => lines.some(x => x.itemId === l.itemId)))

// lines start from what was received: one line per item across the chosen DCs, billed = received until the clerk
// enters what the bill says (BD-2)
export const linesFrom = dcs => {
  const by = {}
  dcs.forEach(d => d.lines.forEach(l => {
    const k = l.itemId
    if (!by[k]) by[k] = { itemId: l.itemId, unitId: l.unitId, receivedQty: 0, billedQty: 0, rate: '', gstPct: '' }
    by[k].receivedQty = r2(by[k].receivedQty + l.receivedQty)
    by[k].billedQty = by[k].receivedQty
  }))

  return Object.values(by)
}

// GST % left empty counts as no GST
export const lineCalc = l => {
  const taxable = r2((Number(l.billedQty) || 0) * (Number(l.rate) || 0))

  return { taxable, gst: r2((taxable * (Number(l.gstPct) || 0)) / 100) }
}
export const computedOf = inv => {
  let taxable = 0, gst = 0, asReceived = 0
  inv.lines.forEach(l => {
    const c = lineCalc(l)
    taxable += c.taxable
    gst += c.gst
    const recTax = (l.extra ? 0 : Number(l.receivedQty) || 0) * (Number(l.rate) || 0)
    asReceived += recTax * (1 + (Number(l.gstPct) || 0) / 100)
  })

  return { taxable: r2(taxable), gst: r2(gst), total: r2(taxable + gst), asReceived: r2(asReceived) }
}

// BD-2: billed quantity against what was received (BD-32 removed the printed-total check)
export const matchOf = inv => {
  const out = []
  inv.lines.forEach(l => {
    const b = Number(l.billedQty) || 0, r = Number(l.receivedQty) || 0
    if (b > r) out.push({ kind: 'more', itemId: l.itemId, received: r, billed: b })
    else if (b < r) out.push({ kind: 'less', itemId: l.itemId, received: r, billed: b })
  })
  const c = computedOf(inv)

  return { match: out.length ? 'discrepancy' : 'matched', discrepancies: out, computed: c }
}

// the paper that came with the invoice, counted by kind: '1 vendor bill · 2 delivery challans'
export const docsSummary = docs => { const n = (docs || []).length; return n ? `${n} document${n === 1 ? '' : 's'}` : 'No documents' }

// what stops the clerk saving the invoice (Add invoice form)
export const saveBlocks = (inv, invoices, taken) => {
  const b = []
  if (!inv.vendorId) b.push('Pick the vendor')
  if (!inv.grnId) b.push('Pick the GRN')
  else if (!inv.lines.length) b.push('Tick at least one item')
  if (!inv.invoiceNo?.trim()) b.push('Enter the invoice number')
  if (!inv.invoiceDate) b.push('Enter the invoice date')
  if (inv.lines.some(l => !l.itemId)) b.push('Pick the GRN item for every line')
  // rate and GST are optional (Sourav, 2 Nov: "don't make rate, gst mandatory"); a line without a rate adds nothing to the total
  if (!(inv.docs || []).length) b.push('Attach the invoice')
  if (dupOf(inv, invoices)) b.push(`Invoice ${inv.invoiceNo} is already recorded`)
  // taken: lineTakenMap; a GRN line is on one invoice only
  const clash = inv.grnId ? inv.lines.filter(l => l.itemId && !l.extra && taken[lineKey(inv.grnId, l.itemId)] && taken[lineKey(inv.grnId, l.itemId)] !== inv.id) : []
  if (clash.length) b.push(`${clash.length === 1 ? 'An item' : `${clash.length} items`} on this invoice ${clash.length === 1 ? 'is' : 'are'} already on another invoice`)

  return b
}

// what still blocks the head from marking it checked
export const checkBlocks = (inv, dcsBy) => {
  const b = []
  if (inv.dcNumbers.some(dc => dcsBy[dc] && !dcsBy[dc].signedDc) && !inv.signedDcAck) b.push('Accept the DC without a signed copy')

  return b
}
