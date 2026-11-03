// Sidebar menu for the role Bill Desk is viewed as, with each item's to-do count. The clerk and the head get two items,
// Challans and Invoices (ia.js), each a page with tabs; Finance sees those too, then Payments and the Data Explorer.
import { getState } from './store'
import { getRole } from './roles'
import { countsOf } from './views'
import { IA, FINANCE, usesIa, firstTab, inPayments } from './ia'

const billDeskNavigation = () => {
  const role = getRole()
  let counts = {}
  try {
    counts = countsOf(getState(), role)
  } catch {}
  const badge = n => (n ? { badgeContent: String(n) } : {})

  // each item stays lit on every page it owns (2 Nov, "some times the navbar tab is not selected"): its tabs, and for
  // Challans a challan and a new invoice, for Invoices an invoice's details and an invoice being edited
  const under = (p, base) => p === base || p.startsWith(`${base}/`)
  const OWNS = {
    challans: (p, r) => under(p, '/bill-desk/challans') || under(p, '/bill-desk/dc') || (under(p, '/bill-desk/add-invoice') && !String(r.asPath).includes('edit=')),
    invoices: (p, r) => under(p, '/bill-desk/invoices') || under(p, '/bill-desk/invoice-details') || under(p, '/bill-desk/invoice') || (under(p, '/bill-desk/add-invoice') && String(r.asPath).includes('edit='))
  }
  if (usesIa(role)) return [
    { sectionTitle: 'Bill Desk', auth: false },
    ...IA.map(sec => ({ title: sec.section, path: `/bill-desk/${sec.slug}/${firstTab(sec.slug, role)}`, activeTest: OWNS[sec.slug], icon: sec.icon, auth: false, ...badge(counts[sec.slug]) }))
  ]

  // Finance (2 Nov: "show all the tabs to finance"): Bill Desk's Challans and Invoices to look at, then Payments, where
  // Finance acts, and the Data Explorer. An invoice's details light Payments when the invoice is Finance's, else Invoices
  const detailIsPayments = r => { const id = new URLSearchParams(String(r.asPath).split('?')[1] || '').get('id'); try { return inPayments(getState().invoices.find(i => i.id === id)) } catch { return false } }
  const FIN_OWNS = {
    challans: OWNS.challans,
    invoices: (p, r) => under(p, '/bill-desk/invoices') || ((under(p, '/bill-desk/invoice-details') || under(p, '/bill-desk/invoice')) && !detailIsPayments(r))
  }

  return [
    { sectionTitle: 'Bill Desk', auth: false },
    ...IA.map(sec => ({ title: sec.section, path: `/bill-desk/${sec.slug}/${sec.items[0].slug}`, activeTest: FIN_OWNS[sec.slug], icon: sec.icon, auth: false })),
    { title: FINANCE.section, path: `/bill-desk/finance/${FINANCE.items[0].slug}`, icon: FINANCE.icon, auth: false, activeTest: (p, r) => under(p, '/bill-desk/finance') || ((under(p, '/bill-desk/invoice-details') || under(p, '/bill-desk/invoice')) && detailIsPayments(r)), ...badge(counts.finance) },
    // the pivot over invoice lines (2 Nov), from the compliance module's Data Explorer
    { title: 'Data Explorer', path: '/bill-desk/data-explorer', icon: 'mdi:table-pivot', auth: false, activeTest: p => under(p, '/bill-desk/data-explorer') }
  ]
}

export default billDeskNavigation
