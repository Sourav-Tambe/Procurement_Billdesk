// Which invoices each role's menu item shows, and the menu counts. Lists and counts read the same filters, so a
// count never disagrees with its list.
import { dcGrnMap, lineTakenMap, grnState } from './logic'

export const exceptionsOf = (s, inv) => {
  const x = []
  if (inv.match === 'discrepancy') x.push(inv.resolution ? 'resolved' : 'discrepancy')
  if (inv.dcNumbers.some(dc => s.dcsBy[dc] && !s.dcsBy[dc].signedDc)) x.push(inv.signedDcAck ? 'signed_ack' : 'signed_missing')
  if (inv.trail.some(e => e.to === 'returned_to_clerk' || e.to === 'returned_by_finance')) x.push('returned_before')

  return x
}
const OPEN_EXC = ['discrepancy', 'signed_missing']
// the head's queue: open exceptions first, then what was returned before, then the rest, oldest first
export const headOrder = s => (a, b) => {
  const w = inv => { const x = exceptionsOf(s, inv); return x.some(e => OPEN_EXC.includes(e)) ? 0 : x.includes('returned_before') ? 1 : 2 }

  return w(a) - w(b) || (a.trail[0]?.at || '').localeCompare(b.trail[0]?.at || '')
}

export const LISTS = {
  head: {
    'to-check': inv => inv.status === 'with_head',
    checked: inv => inv.status === 'checked',
    returned: inv => inv.status === 'returned_by_finance'
  },
}

export const countsOf = (s, role) => {
  const n = f => s.invoices.filter(f).length
  // Finance's badge: invoices to verify
  if (role === 'finance') return { finance: n(i => ['with_finance', 'checked'].includes(i.status)) }
  const t = dcGrnMap(s.grns), lt = lineTakenMap(s.invoices)
  const pending = n(i => i.status === 'to_connect'), fix = n(i => i.status === 'returned_to_clerk')
  // the clerk's work: challans to group, GRNs with lines to bill, invoices pending match, those sent back; the head's:
  // invoices under review
  if (role === 'clerk') return { challans: s.dcs.filter(d => !t[d.dcNumber]).length, grns: (s.grns || []).filter(g => grnState(g, lt) !== 'fully').length, invoices: pending + fix }

  return { invoices: n(i => ['with_head', 'returned_by_finance'].includes(i.status)) }
}
