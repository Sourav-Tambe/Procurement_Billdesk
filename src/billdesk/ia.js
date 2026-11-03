// Bill Desk's navigation (Sourav, 2 Nov): two sidebar items, Challans and Invoices, each a page with three L1 tabs;
// the same for the clerk and the head. The role changes the actions and the default view, not the menu. Finance
// keeps its own menu until its structure is given. Each tab has its own address (/bill-desk/<section>/<tab>).
export const IA = [
  {
    section: 'Challans',
    slug: 'challans',
    icon: 'mdi:truck-check-outline',
    items: [
      { slug: 'to-bill', title: 'To Bill' },
      { slug: 'invoiced', title: 'Invoiced' },
      { slug: 'all', title: 'All Challans' }
    ]
  },
  {
    section: 'Invoices',
    slug: 'invoices',
    icon: 'mdi:receipt-text-outline',
    items: [
      { slug: 'pending-match', title: 'Pending Match' },
      { slug: 'correction-needed', title: 'Correction Needed' },
      // Submitted split in two (2 Nov: "split the listing that is under review and approved -> make approved to reviewed")
      // renamed Matched (3 Nov: "under review tab, u rename as matched"); the address stays under-review
      { slug: 'under-review', title: 'Matched' },
      { slug: 'reviewed', title: 'Reviewed', hideFor: ['finance'] },
      // every invoice in one list, with its stage (2 Nov: so the head "can see all the invoices that has reached to him")
      { slug: 'all-invoices', title: 'All Invoices', hideFor: ['finance'] }
    ]
  }
]
export const usesIa = role => role !== 'finance'
// the tabs a role sees in a section. Finance sees only what has not reached it yet (3 Nov, option 3): Reviewed and All
// Invoices hold the same invoices as Payments, so they are hidden for Finance and Payments › All Invoices is its one list
export const itemsFor = (sec, role) => sec.items.filter(i => !(i.hideFor || []).includes(role))
// a tab hidden for Finance sends it to Payments › All Invoices
export const hiddenFor = (section, view, role) => {
  const item = IA.find(x => x.slug === section)?.items.find(i => i.slug === view)

  return item && (item.hideFor || []).includes(role) ? '/bill-desk/finance/all' : null
}
// Finance's own page (2 Nov: "To Verify · Awaiting Approval · Payment Pending · Closed use these"), named Payments so
// it sits beside Bill Desk's Invoices in Finance's sidebar ("Yeah, I think payments would be right"); four tabs at
// /bill-desk/finance/<tab>
export const FINANCE = {
  section: 'Payments',
  slug: 'finance',
  icon: 'mdi:cash-multiple',
  items: [
    { slug: 'to-verify', title: 'To Verify', statuses: ['with_finance', 'checked'] },
    { slug: 'awaiting-approval', title: 'Awaiting Approval', statuses: ['sent_for_approval'] },
    { slug: 'payment-pending', title: 'Payment Pending', statuses: ['approved'] },
    { slug: 'closed', title: 'Closed', statuses: ['paid', 'rejected'] },
    // every invoice that has reached Finance, in one list (2 Nov: "I think you have to add one all invoices tab")
    { slug: 'all', title: 'All Invoices', statuses: ['with_finance', 'checked', 'sent_for_approval', 'approved', 'paid', 'rejected'], all: true }
  ]
}
export const financeTabOf = inv => FINANCE.items.find(t => !t.all && t.statuses.includes(inv?.status))?.slug || null
// an invoice Finance holds or has handled lives under Payments; anything earlier is Bill Desk's
export const inPayments = inv => !!financeTabOf(inv)
// the tab a sidebar item opens on, by role: the head starts on Under Review, where invoices wait for them
export const firstTab = (section, role) => (section === 'invoices' && role === 'head' ? 'under-review' : IA.find(x => x.slug === section).items[0].slug)
export const iaPage = (section, view) => {
  const sec = IA.find(x => x.slug === section)
  const item = sec?.items.find(i => i.slug === view)

  return item ? { section: sec, item } : null
}

// the list that holds an invoice: Back from the invoice and the form returns there
export const listOf = (inv, role) =>
  role === 'finance' && inPayments(inv) ? `/bill-desk/finance/${financeTabOf(inv)}`
    : inv?.status === 'to_connect' ? '/bill-desk/invoices/pending-match'
    : inv?.status === 'returned_to_clerk' ? '/bill-desk/invoices/correction-needed'
    : ['with_head', 'returned_by_finance'].includes(inv?.status) ? '/bill-desk/invoices/under-review'
    : '/bill-desk/invoices/reviewed'

// addresses from before the new navigation land on the page that replaced them
export const movedFrom = (role, tab, hash) => {
  if (role === 'clerk' && tab === 'dcs') return { '#on-invoice-ai': '/bill-desk/invoices/pending-match', '#on-invoice-fix': '/bill-desk/invoices/correction-needed', '#on-invoice-sent': '/bill-desk/invoices/under-review', '#on-invoice': '/bill-desk/invoices/under-review', '#all': '/bill-desk/challans/all' }[hash] || '/bill-desk/challans/to-bill'
  if (role === 'clerk' || role === 'head') return '/bill-desk/invoices/under-review'
  if (role === 'invoices' && tab === 'submitted') return '/bill-desk/invoices/under-review'
  if (role === 'finance') return `/bill-desk/finance/${{ inbox: 'to-verify', approval: 'awaiting-approval', decided: 'closed' }[tab] || 'to-verify'}`

  return null
}
