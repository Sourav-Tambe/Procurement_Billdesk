// Who Bill Desk is viewed as (the Procure-v1 team split, WS-7: the accounts clerk records bills, the head checks and
// hands over, Finance takes it from there). Kept in the browser; the sidebar and pages read it.
import { useSyncExternalStore } from 'react'

export const ROLES = [
  { value: 'clerk', label: 'Accounts clerk', person: 'Mark Ellis', initials: 'ME', home: '/bill-desk/challans/to-bill' },
  { value: 'head', label: 'Bill Desk head', person: 'Daniel Brooks', initials: 'DB', home: '/bill-desk/invoices/submitted' },
  { value: 'finance', label: 'Finance', person: 'Rachel Morgan', initials: 'RM', home: '/bill-desk/finance/to-verify' }
]
export const TABS = {
  // the clerk and the head use the Challans · Invoices navigation in ia.js (2 Nov)
  // Finance's menu is FINANCE in ia.js (2 Nov)

}
const KEY = 'billdesk.v1.role'
// the layout, sidebar and pages redraw when the role changes (useRole)
const listeners = new Set()
export const getRole = () => {
  try {
    const r = typeof window !== 'undefined' && window.localStorage.getItem(KEY)

    return ROLES.some(x => x.value === r) ? r : 'clerk'
  } catch {
    return 'clerk'
  }
}
export const setRole = r => {
  try {
    window.localStorage.setItem(KEY, r)
  } catch {}
  listeners.forEach(l => l())
}
export const useRole = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l) }, getRole, () => 'clerk')
export const roleOf = v => ROLES.find(r => r.value === v) || ROLES[0]
export const me = () => roleOf(getRole())
