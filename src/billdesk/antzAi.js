// Antz AI, simulated for the lite (Sourav, 1 Nov). The clerk gives the invoice number and the paper; "Antz AI" reads the
// rest in the background. Here the reading is drawn from the DCs, deterministically: the vendor (by the invoice number's
// prefix, else the vendor with most open DCs), the DC numbers printed on the bill (that vendor's two latest open DCs),
// and the bill's lines with the vendor's rates. One line is billed a little over what was received, one is marked as a
// low-confidence read, and one line names an item from another of the vendor's DCs and is left for the clerk to pair.
// The invoice waits in Invoiced › To connect until readyAt; the real service replaces antzRead and the timer.
// From Naveen's ParseState (2 Nov): each line carries a confidence and, when the AI couldn't pair it, its candidate
// items with a score; the totals printed on the bill are read too, so the connect page can say "Totals match" or not;
// a read can fail ("Couldn't read this invoice"), and Try again sends it back.
import { computedOf, r2, lineTakenMap, lineKey, grnState } from './logic'

export const AI_READ_MS = 8000
export const isReading = inv => inv?.status === 'to_connect' && Date.now() < (inv.ai?.readyAt || 0)
export const isFailed = inv => inv?.status === 'to_connect' && !!inv.ai?.failed && !isReading(inv)
export const SURE = 0.8
// totals: what the bill prints against what its lines (as now corrected) add up to
export const totalsOf = (printed, lines) => {
  if (!printed?.total) return 'unverified'
  const got = computedOf({ lines: lines.filter(l => !l.notOnBill) }).total

  return Math.abs(got - printed.total) < 1 ? 'match' : 'mismatch'
}
export const TOTALS = { match: 'Totals match', mismatch: 'Totals do not match', unverified: 'Totals not verified' }
const prefixOf = dc => String(dc).toUpperCase().split(/[-/]/)[0]
const shortName = n => String(n || '').split(/\s+/).map((w, i) => (i ? w.slice(0, 4) : w)).join(' ').toUpperCase()

// clean: every line read surely and paired, nothing to check (a sample of the Read status, 2 Nov)
// BD-72 (5 Nov): bills are read against GRNs. The vendor is the one whose open GRN (lines still to bill) has a challan
// with the invoice number's prefix, else the vendor with most open GRNs; the bill's lines are that vendor's latest open
// GRN's free lines, and the DCs printed on the bill are that GRN's latest two (grnHint names the GRN)
export const antzRead = (base, invoices, { invoiceNo, vendorId: hint, clean = false }, rateOf, grns = []) => {
  const taken = lineTakenMap(invoices)
  const byVendor = {}
  grns.filter(g => grnState(g, taken) !== 'fully').forEach(g => { (byVendor[g.vendorId] = byVendor[g.vendorId] || []).push(g) })
  const head = prefixOf(invoiceNo)
  const vendors = Object.keys(byVendor)
  // a vendor the clerk already picked is taken as given
  const vendorId = (hint && byVendor[hint] && hint) || vendors.find(v => byVendor[v].some(g => g.dcNumbers.some(dc => prefixOf(dc) === head))) || vendors.sort((a, b) => byVendor[b].length - byVendor[a].length)[0]
  const open = (byVendor[vendorId] || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  const g = open[0]
  const dcsOf = x => x.dcNumbers.map(dc => base.dcsBy[dc]).filter(Boolean).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const hints = g ? dcsOf(g).slice(0, 2) : []
  const item = id => base.items.find(i => i.id === id)
  const paperLines = []
  const free = g ? g.lines.filter(l => !taken[lineKey(g.id, l.itemId)]) : []
  const lines = free.map((l, k) => {
    const [rate, gstPct] = rateOf(item(l.itemId), l.unitId)

    // the paper's own line; line 3 is a poor read: its rate loses a digit (45.00 read as 4.50)
    const paper = { billName: (item(l.itemId)?.name || l.itemId).toUpperCase(), itemId: l.itemId, guessItemId: l.itemId, unitId: l.unitId, billedQty: k === 1 ? r2(l.receivedQty + 5) : l.receivedQty, rate, gstPct }
    paperLines.push(paper)

    return k === 2 && !clean ? { ...paper, rate: r2(rate / 10), confidence: 0.64, unsure: ['billedQty', 'rate'] } : { ...paper, confidence: [0.98, 0.96, 0.97, 0.99][k % 4], unsure: [] }
  })
  // one line names an item the AI couldn't pair: shortened, with the GRN item it most likely is as a candidate
  if (lines.length > 1 && !clean) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = { ...last, billName: shortName(item(last.guessItemId)?.name), itemId: null, confidence: 0.93, candidates: [{ itemId: last.guessItemId, score: 0.72 }], unsure: [] }
  }
  const latest = hints.map(d => d.receivedAt).sort().at(-1)
  const c = computedOf({ lines: paperLines })

  return { vendorId, grnHint: g?.id || null, dcHints: hints.map(d => d.dcNumber), lines, paperLines, printed: { taxable: c.taxable, gst: c.gst, total: c.total }, invoiceDate: latest ? latest.slice(0, 10) : '' }
}
