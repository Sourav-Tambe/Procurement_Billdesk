// Sample work for the prototype (BD-16): eleven invoices over Naveen's real DCs, one or more in every state, with
// their handovers, approval batches and trails, so each role's tabs have rows on first open. Rates are sample rates
// by item type (DCs carry none); each bill scan is an SVG drawn from the invoice itself.
import { linesFrom, matchOf, computedOf, r2, dcsForLines } from './logic'
import { antzRead } from './antzAi'

const CLERK = 'Mark Ellis', HEAD = 'Daniel Brooks', FIN = 'Rachel Morgan'
// [rate per unit, GST %] by item type, and for units that are packs or bags
const RATE = { 't-fruit': [85, 0], 't-veg': [42, 0], 't-leafy': [28, 0], 't-meat': [410, 0], 't-poultry': [230, 0], 't-fish': [260, 0], 't-feeder': [48, 12], 't-hay': [32, 0], 't-browse': [120, 0], 't-pellet': [3400, 5], 't-grain': [58, 5], 't-oil': [62, 5], 't-nuts': [145, 5], 't-supp': [2.4, 18], 't-milk': [56, 0], 't-egg': [190, 0] }
const UNIT_RATE = { 'u-bale': [640, 0], 'u-bag10': [2450, 5], 'u-bag20': [3900, 5], 'u-bag25': [3150, 5], 'u-gm': null }
const rateOf = (item, unitId) => (UNIT_RATE[unitId] || RATE[item?.typeId] || [50, 5])
export const sampleRate = rateOf
// the usual GST % for an item: the Add invoice form fills it and the clerk types over it if the bill differs
export const gstDefault = (item, unitId) => rateOf(item, unitId)[1]

// Rebuilt for the clerk (Sourav, 31 Oct): every tab has rows, invoice dates follow the DCs, and each discrepancy kind
// appears once. end: the state the sample stops in; bill: billed qty by item; extra: an item on the bill that was not
// received; printedOff: how far the printed total is from the lines. Only matched invoices go past the clerk (BD-21).
const SPECS = [
  // --- with the clerk: matched, ready to send (Invoiced › Matched) ---
  { dcs: ['SLA/2610/3781', 'SLA/2610/3783'], no: 'SLA/INV/3783', date: '2026-10-06', end: 'draft' },
  { dcs: ['ND-988', 'ND-997'], no: 'ND/2026/1091', date: '2026-10-09', end: 'draft' },
  { dcs: ['CFF/406', 'CFF/414'], no: 'CFF-INV-890', date: '2026-10-07', end: 'draft' },
  { dcs: ['AFM-3383', 'AFM-3385'], no: 'AFM-26-0427', date: '2026-10-08', end: 'draft' },
  { dcs: ['GVF-3284'], no: 'GVF/2610/044', date: '2026-10-05', end: 'draft' },
  // --- sent once, returned by the head with what to fix ---
  { dcs: ['BVS-2098', 'BVS-2107'], no: 'BVS/7781', date: '2026-10-08', end: 'returned_to_clerk', note: 'The bill copy is cut off at the GSTIN. Ask Bharat Vet for a clear scan.' },
  // --- with the clerk, with discrepancies (Invoiced › With discrepancies): billed more, billed less, an item not
  //     received, and a printed total that does not add up ---
  { dcs: ['MGT-3707', 'MGT-3713'], no: 'MGT/26/571', date: '2026-10-13', end: 'draft', bill: { 'pi-GRC-0041': 160, 'pi-GRC-0046': 70 } },
  { dcs: ['DFL/26/2560', 'DFL/26/2568'], no: 'DFL/INV/26/0917', date: '2026-10-14', end: 'draft', bill: { 'pi-FED-0018': 20 } },
  { dcs: ['HFT/425'], no: 'HFT-1040', date: '2026-10-14', end: 'draft', bill: { 'pi-FED-0011': 18 } },
  // --- BD-72 (5 Nov): GRNs billed by more than one invoice. grn: the GRN's challans; items: the GRN lines this invoice
  //     bills. Sri Lakshmi's GRN is partly billed (3 of 5), Annapurna's too (3 of 5, apples billed over); Kaveri's GRN is
  //     fully billed by two invoices ---
  { grn: ['SLA/2610/3797', 'SLA/2610/3805', 'SLA/2610/3809'], items: ['pi-FV-0201', 'pi-FV-0207', 'pi-FV-0112'], no: 'SLA/INV/3797', date: '2026-10-13', end: 'with_head' },
  { grn: ['AFM-3406', 'AFM-3410'], items: ['pi-FV-0121', 'pi-FV-0118', 'pi-FV-0105'], no: 'AFM-26-0440', date: '2026-10-14', end: 'draft', bill: { 'pi-FV-0105': 65 } },
  { grn: ['KMS-2283', 'KMS-2284', 'KMS-2286'], items: ['pi-NV-0031', 'pi-NV-0035'], no: 'KMS/INV/1201', date: '2026-10-15', end: 'checked' },
  { grn: ['KMS-2283', 'KMS-2284', 'KMS-2286'], items: ['pi-NV-0032', 'pi-NV-0033'], no: 'KMS/INV/1202', date: '2026-10-16', end: 'with_head' },
  // --- with the head ---
  { dcs: ['AFM-3393', 'AFM-3401'], no: 'AFM-26-0433', date: '2026-10-11', end: 'with_head' },
  { dcs: ['ND-1002', 'ND-1005'], no: 'ND/2026/1099', date: '2026-10-10', end: 'with_head' },
  { dcs: ['HFT/421', 'HFT/423'], no: 'HFT-1031', date: '2026-10-12', end: 'with_head' },
  // --- checked by the head, waiting for a handover ---
  { dcs: ['MGT-3694', 'MGT-3702'], no: 'MGT/26/559', date: '2026-10-10', end: 'checked' },
  { dcs: ['SLA/2610/3791', 'SLA/2610/3793'], no: 'SLA/INV/3793', date: '2026-10-07', end: 'checked' },
  // --- with Finance: one handover not yet marked received, one received ---
  { dcs: ['CFF/399', 'CFF/404'], no: 'CFF-INV-882', date: '2026-10-04', end: 'with_finance', ho: 3 },
  { dcs: ['ND-973', 'ND-974', 'ND-979', 'ND-984'], no: 'ND/2026/1077', date: '2026-10-06', end: 'with_finance', ho: 2 },
  // --- sent for payment approval ---
  { dcs: ['AFM-3366', 'AFM-3369', 'AFM-3374'], no: 'AFM-26-0412', date: '2026-10-03', end: 'sent_for_approval', ho: 2, pa: 2 },
  { dcs: ['MPF/2729'], no: 'MPF-B-2729', date: '2026-10-13', end: 'sent_for_approval', ho: 2, pa: 2 },
  // --- decided: approved, rejected, deferred ---
  { dcs: ['KMS-2268', 'KMS-2270'], no: 'KMS/INV/1184', date: '2026-10-09', end: 'approved', ho: 1, pa: 1 },
  { dcs: ['BVS-2119'], no: 'BVS/7788', date: '2026-10-08', end: 'approved', ho: 1, pa: 1 },
  { dcs: ['GVF-3298'], no: 'GVF/2610/048', date: '2026-10-10', end: 'approved', ho: 1, pa: 1 },
  { dcs: ['MPF/2727'], no: 'MPF-B-2727', date: '2026-10-13', end: 'rejected', ho: 1, pa: 1, reason: 'Vendor bank details not verified' },
  { dcs: ['SLA/2610/3779'], no: 'SLA/INV/3779', date: '2026-10-05', end: 'deferred', ho: 1, pa: 1, reason: 'Hold till the November budget release' }
]
// GRNs the clerk has made and not billed yet (GRNs › To Bill); the Antz AI samples read against these
const TO_BILL = [[['GVF-3287', 'GVF-3294'], '2026-10-16T10:05'], [['MGT-3720'], '2026-10-16T10:20'], [['KMS-2281', 'KMS-2287'], '2026-10-16T10:40']]
const HANDOVERS = {
  1: { at: '2026-10-17T11:20', note: 'First batch of October', receivedAt: '2026-10-17T15:05' },
  2: { at: '2026-10-21T10:40', note: '', receivedAt: '2026-10-21T16:30' },
  3: { at: '2026-10-28T12:10', note: '', receivedAt: null }
}
const APPROVALS = {
  1: { at: '2026-10-20T10:00', sentTo: 'Payment approval committee', ref: 'PAC/26/10/07', note: '', decidedAt: '2026-10-24T17:15' },
  2: { at: '2026-10-27T09:45', sentTo: 'Payment approval committee', ref: 'PAC/26/10/11', note: '' }
}
const pad = (n, w) => String(n).padStart(w, '0')
// local wall-clock time, kept local (2 Nov: toISOString() is UTC, which moved every sample time back 5½ hours)
const plus = (iso, h) => { const d = new Date(new Date(iso).getTime() + h * 3600000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const ev = (at, by, role, action, from, to, note) => ({ at, by, role, action, from: from || null, to: to || null, ...(note ? { note } : {}) })

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
// a photo too dark and blurred to read
const blurSvg = () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="620" height="800" viewBox="0 0 620 800"><defs><filter id="b"><feGaussianBlur stdDeviation="6"/></filter></defs><rect width="620" height="800" fill="#2A2724"/><g filter="url(#b)" fill="#57524B"><rect x="60" y="60" width="300" height="26"/><rect x="420" y="60" width="140" height="22"/>' + Array.from({ length: 12 }, (_, i) => `<rect x="60" y="${200 + i * 34}" width="${220 + ((i * 53) % 200)}" height="14"/><rect x="460" y="${200 + i * 34}" width="100" height="14"/>`).join('') + '<rect x="380" y="660" width="180" height="24"/></g></svg>')}`
// a plain tax-invoice page drawn from the invoice, as the vendor's paper would look
export const billSvg = (inv, base) => {
  const v = base.vendors.find(x => x.id === inv.vendorId)
  const name = id => base.items.find(i => i.id === id)?.name || id
  const unit = id => base.units.find(u => u.id === id)?.symbol || ''
  const c = computedOf(inv), rows = inv.lines
  const H = 330 + rows.length * 26
  const money = n => r2(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const row = (l, i) => {
    const t = r2(l.billedQty * l.rate), y = 228 + i * 26

    return `<text x="40" y="${y}">${esc(name(l.itemId))}</text><text x="370" y="${y}" text-anchor="end">${l.billedQty} ${esc(unit(l.unitId))}</text><text x="450" y="${y}" text-anchor="end">${money(l.rate)}</text><text x="500" y="${y}" text-anchor="end">${l.gstPct}%</text><text x="580" y="${y}" text-anchor="end">${money(t)}</text>`
  }
  const yT = 240 + rows.length * 26
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="${H}" viewBox="0 0 620 ${H}" font-family="Courier New, monospace" font-size="13" fill="#222"><rect width="620" height="${H}" fill="#FBFAF6"/><text x="40" y="50" font-size="20" font-weight="bold">${esc(v?.name || '')}</text><text x="40" y="72">${esc(v?.address || '')}</text><text x="40" y="92">GSTIN ${esc(v?.gstin || '—')}</text><text x="580" y="50" text-anchor="end" font-size="16" font-weight="bold">TAX INVOICE</text><text x="580" y="72" text-anchor="end">No. ${esc(inv.invoiceNo)}</text><text x="580" y="92" text-anchor="end">Date ${esc(inv.invoiceDate)}</text><text x="40" y="128">Bill to: Antz Zoo · Stores and Kitchens</text><text x="40" y="148">Against DC: ${esc(inv.dcNumbers.join(', '))}</text><line x1="40" y1="192" x2="580" y2="192" stroke="#222"/><text x="40" y="208" font-weight="bold">Item</text><text x="370" y="208" text-anchor="end" font-weight="bold">Qty</text><text x="450" y="208" text-anchor="end" font-weight="bold">Rate</text><text x="500" y="208" text-anchor="end" font-weight="bold">GST</text><text x="580" y="208" text-anchor="end" font-weight="bold">Amount</text>${rows.map(row).join('')}<line x1="40" y1="${yT - 14}" x2="580" y2="${yT - 14}" stroke="#222"/><text x="450" y="${yT + 6}" text-anchor="end">Taxable</text><text x="580" y="${yT + 6}" text-anchor="end">${money(c.taxable)}</text><text x="450" y="${yT + 28}" text-anchor="end">GST</text><text x="580" y="${yT + 28}" text-anchor="end">${money(c.gst)}</text><text x="450" y="${yT + 52}" text-anchor="end" font-weight="bold">Total</text><text x="580" y="${yT + 52}" text-anchor="end" font-weight="bold">${money(c.total)}</text><text x="40" y="${H - 30}" font-size="11" fill="#666">Sample bill · Bill Desk prototype</text></svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// the vendor's delivery challan as it came with the bill: the lines as challaned, and the store's seal when the
// signed copy exists in Diet & Kitchen
export const challanSvg = (dc, base) => {
  const v = base.vendors.find(x => x.id === dc.vendorId)
  const name = id => base.items.find(i => i.id === id)?.name || id
  const unit = id => base.units.find(u => u.id === id)?.symbol || ''
  const H = Math.max(270 + dc.lines.length * 26, 780) // at least a page's proportion, so a short challan still reads as a page
  const rows = dc.lines.map((l, i) => `<text x="40" y="${200 + i * 26}">${esc(name(l.itemId))}</text><text x="560" y="${200 + i * 26}" text-anchor="end">${l.challanQty} ${esc(unit(l.unitId))}</text>`).join('')
  const seal = dc.signedDc ? `<g transform="rotate(-12 470 ${H - 70})" fill="none" stroke="#2E6FB7" stroke-width="2.5"><circle cx="470" cy="${H - 70}" r="46"/><circle cx="470" cy="${H - 70}" r="38"/><text x="470" y="${H - 74}" text-anchor="middle" fill="#2E6FB7" stroke="none" font-size="12" font-weight="bold">RECEIVED</text><text x="470" y="${H - 58}" text-anchor="middle" fill="#2E6FB7" stroke="none" font-size="10">${esc(dc.receivedAt.slice(0, 10))}</text></g>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${H}" viewBox="0 0 600 ${H}" font-family="Courier New, monospace" font-size="13" fill="#222"><rect width="600" height="${H}" fill="#F4F1E8"/><text x="40" y="48" font-size="18" font-weight="bold">${esc(v?.name || '')}</text><text x="560" y="48" text-anchor="end" font-size="15" font-weight="bold">DELIVERY CHALLAN</text><text x="40" y="72">${esc(v?.address || '')}</text><text x="560" y="96" text-anchor="end">DC No. ${esc(dc.dcNumber)}</text><text x="560" y="116" text-anchor="end">Date ${esc(dc.receivedAt.slice(0, 10))}</text><text x="40" y="116">To: Antz Zoo · Stores and Kitchens</text><line x1="40" y1="160" x2="560" y2="160" stroke="#222"/><text x="40" y="178" font-weight="bold">Item</text><text x="560" y="178" text-anchor="end" font-weight="bold">Qty</text>${rows}<text x="40" y="${H - 40}">Received by ____________</text>${seal}<text x="40" y="${H - 14}" font-size="11" fill="#666">Sample challan · Bill Desk prototype</text></svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const sampleWork = base => {
  const invoices = [], handovers = {}, approvals = {}
  // every sample invoice bills a GRN (BD-72): one GRN per challan set, made the morning of its first invoice
  const grns = [], grnBy = {}
  const grnFor = (dcList, at) => {
    const k = dcList.join('|')
    if (grnBy[k]) return grnBy[k]
    const dcNumbers = [...dcList].sort()
    const g = { id: `GRN-26-${pad(grns.length + 1, 4)}`, sample: true, source: 'bill_desk', vendorId: base.dcsBy[dcList[0]].vendorId, dcNumbers,
      lines: linesFrom(dcList.map(dc => base.dcsBy[dc])).filter(l => l.receivedQty > 0).map(({ itemId, unitId, receivedQty }) => ({ itemId, unitId, receivedQty })), createdAt: at, createdBy: CLERK,
      trail: [ev(at, CLERK, 'clerk', 'GRN made', null, null, dcNumbers.join(', '))] }
    grns.push(g)
    grnBy[k] = g

    return g
  }
  SPECS.forEach((s, i) => {
    const id = `BD-26-${pad(i + 1, 4)}`
    const g = grnFor(s.grn || s.dcs, `${s.date}T08:30`)
    const lines = g.lines.filter(l => !s.items || s.items.includes(l.itemId)).map(l => {
      const [rate, gstPct] = rateOf(base.items.find(x => x.id === l.itemId), l.unitId)

      return { ...l, billedQty: s.bill?.[l.itemId] ?? l.receivedQty, rate, gstPct }
    })
    ;(s.extra || []).forEach(x => { const [rate, gstPct] = rateOf(base.items.find(i => i.id === x.itemId), x.unitId); lines.push({ ...x, receivedQty: 0, extra: true, rate, gstPct }) })
    const dcNumbers = dcsForLines(g, lines, base.dcsBy)
    const dcs = dcNumbers.map(dc => base.dcsBy[dc])
    const inv = { id, sample: true, vendorId: g.vendorId, grnId: g.id, dcNumbers, invoiceNo: s.no, invoiceDate: s.date, lines, approvalIds: [], outcomes: [], trail: [] }
    inv.printed = (({ taxable, gst, total }) => ({ taxable, gst, total }))(computedOf(inv))
    Object.entries(s.printedOff || {}).forEach(([k, off]) => { inv.printed[k] = r2(inv.printed[k] + off) })
    // the set that came with the invoice: the bill and a copy of each challan
    const docAt = `${s.date}T10:00`
    inv.docs = [
      { id: `sample-bill-${id}`, kind: 'bill', name: `${s.no.replace(/\//g, '-')}.svg`, type: 'image/svg+xml', at: docAt, by: CLERK, url: billSvg(inv, base) },
      ...dcs.map(d => ({ id: `sample-dc-${id}-${d.dcNumber.replace(/\//g, '-')}`, kind: 'challan', name: `${d.dcNumber.replace(/\//g, '-')}.svg`, type: 'image/svg+xml', at: docAt, by: CLERK, url: challanSvg(d, base) }))
    ]
    const m = matchOf(inv)
    inv.match = m.match
    inv.discrepancies = m.discrepancies
    const signedMissing = dcs.some(d => !d.signedDc)

    // the trail, step by step, up to where this sample stops
    let at = plus(`${s.date}T09:00`, 30), st = 'draft'
    const step = (by, role, action, to, note, h = 20) => { at = plus(at, h); inv.trail.push(ev(at, by, role, action, st, to, note)); st = to }
    inv.trail.push(ev(at, CLERK, 'clerk', 'Invoice added', null, 'draft', `${s.no} · ${g.id}`))
    inv.trail.push(ev(at, CLERK, 'clerk', `Attached ${inv.docs.length} documents`, null, null, inv.docs.map(d => d.name).join(', ')))
    // saved is sent (2 Nov): a sample that stopped at "draft" is now with the head
    step(CLERK, 'clerk', 'Sent to the head', 'with_head', null, 2)
    if (s.end === 'with_head' || s.end === 'draft') { inv.status = st; invoices.push(inv); return }
    if (s.end === 'returned_to_clerk') { step(HEAD, 'head', 'Returned to clerk', 'returned_to_clerk', s.note); inv.status = st; invoices.push(inv); return }
    if (s.resolution) { inv.resolution = { ...s.resolution, by: HEAD, at: plus(at, 18) }; inv.trail.push(ev(plus(at, 18), HEAD, 'head', `Discrepancy resolved · ${s.resolution.kind === 'pay_received' ? 'Pay as received' : 'Accept as billed'}`, null, null, s.resolution.note)) }
    if (signedMissing) { inv.signedDcAck = { by: HEAD, at: plus(at, 18) }; inv.trail.push(ev(plus(at, 18), HEAD, 'head', 'Accepted without signed DC', null, null)) }
    step(HEAD, 'head', 'Reviewed', 'checked', null, 19)
    if (s.end === 'checked') { inv.status = st; invoices.push(inv); return }

    const hoId = `HO-26-${pad(s.ho, 3)}`, H = HANDOVERS[s.ho]
    handovers[hoId] = handovers[hoId] || { id: hoId, sample: true, invoiceIds: [], note: H.note, sentBy: HEAD, sentAt: H.at, receivedBy: H.receivedAt ? FIN : null, receivedAt: H.receivedAt }
    handovers[hoId].invoiceIds.push(id)
    inv.handoverId = hoId
    at = H.at
    inv.trail.push(ev(at, HEAD, 'head', `Sent to Finance · ${hoId}`, st, 'with_finance', H.note || null))
    st = 'with_finance'
    if (H.receivedAt) inv.trail.push(ev(H.receivedAt, FIN, 'finance', `Received by Finance · ${hoId}`, null, null))
    if (s.end === 'with_finance') { inv.status = st; invoices.push(inv); return }

    const paId = `PA-26-${pad(s.pa, 3)}`, A = APPROVALS[s.pa]
    approvals[paId] = approvals[paId] || { id: paId, sample: true, invoiceIds: [], sentTo: A.sentTo, ref: A.ref, sentAt: A.at, note: A.note, sentBy: FIN }
    approvals[paId].invoiceIds.push(id)
    inv.approvalIds.push(paId)
    inv.trail.push(ev(A.at, FIN, 'finance', `Sent for payment approval · ${paId}`, 'with_finance', 'sent_for_approval', `${A.sentTo} · ref ${A.ref}`))
    if (s.end === 'sent_for_approval') { inv.status = 'sent_for_approval'; invoices.push(inv); return }

    const kind = s.end === 'deferred' ? 'deferred' : s.end
    inv.outcomes.push({ kind, approvalId: paId, reason: s.reason || null, by: FIN, at: A.decidedAt })
    inv.status = kind === 'deferred' ? 'with_finance' : kind
    inv.trail.push(ev(A.decidedAt, FIN, 'finance', `Outcome · ${kind[0].toUpperCase()}${kind.slice(1)} (${paId})`, 'sent_for_approval', inv.status, s.reason || null))
    invoices.push(inv)
  })

  TO_BILL.forEach(([dcList, at]) => grnFor(dcList, at))

  // two invoices sent to Antz AI (1 Nov): one read and waiting in To connect, one still being read for a short while
  let seq = SPECS.length
  // one row in each parsing status (2 Nov): Needs check, two Read, Reading; Failed is added below
  ;[['GVF/2610/061', 0], ['AFM/INV/0412', 0, true, '2026-11-01T09:40'], ['MGT/2611/118', 0, true, '2026-11-02T08:15'], ['KMS/INV/1190', 25000]].forEach(([no, wait, clean, at]) => {
    const ai = antzRead(base, invoices, { invoiceNo: no, clean }, rateOf, grns)
    seq += 1
    const id = `BD-26-${pad(seq, 4)}`
    const paper = { vendorId: ai.vendorId, invoiceNo: no, invoiceDate: ai.invoiceDate, dcNumbers: ai.dcHints, lines: ai.paperLines }
    invoices.push({ id, sample: true, status: 'to_connect', vendorId: ai.vendorId, dcNumbers: [], invoiceNo: no, invoiceDate: ai.invoiceDate, lines: [], printed: {}, approvalIds: [], outcomes: [], match: 'matched', discrepancies: [],
      docs: [{ id: `sample-bill-${id}`, kind: 'bill', name: `${no.replace(/\//g, '-')}.svg`, type: 'image/svg+xml', at: '2026-10-31T10:30', by: CLERK, url: billSvg(paper, base) }],
      // a read in progress was sent just now; one that finished was sent on the 31st
      ai: { ...ai, paperLines: undefined, readyAt: wait ? Date.now() + wait : 0, sentAt: wait ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : at || '2026-10-31T10:30' },
      trail: [ev(at || '2026-10-31T10:30', CLERK, 'clerk', 'Sent to Antz AI', null, 'to_connect', no)] })
  })
  // and one the AI couldn't read (a dark, blurred photo): Try again, or enter it by hand (2 Nov)
  seq += 1
  const fid = `BD-26-${pad(seq, 4)}`, fno = 'SAI/1022'
  invoices.push({ id: fid, sample: true, status: 'to_connect', vendorId: '', dcNumbers: [], invoiceNo: fno, invoiceDate: '', lines: [], printed: {}, approvalIds: [], outcomes: [], match: 'matched', discrepancies: [],
    docs: [{ id: `sample-bill-${fid}`, kind: 'bill', name: 'IMG_20261031_1114.svg', type: 'image/svg+xml', at: '2026-10-31T11:14', by: CLERK, url: blurSvg() }],
    ai: { failed: true, error: 'The photo is too dark to read', lines: [], dcHints: [], readyAt: 0, sentAt: '2026-10-31T11:14' },
    trail: [ev('2026-10-31T11:14', CLERK, 'clerk', 'Sent to Antz AI', null, 'to_connect', fno), ev('2026-10-31T11:15', 'Antz AI', 'clerk', 'Antz AI couldn’t read this invoice', null, null, 'The photo is too dark to read')] })

  return { v: 10, grns, invoices, handovers: Object.values(handovers), approvals: Object.values(approvals), seq: { inv: seq, ho: 3, pa: 2, grn: grns.length } }
}
