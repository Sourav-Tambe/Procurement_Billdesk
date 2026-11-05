// /bill-desk/<section>/<view>: Challans › To Bill · Invoiced · All Challans and Invoices › Pending Match · Correction
// Needed · Submitted (ia.js), one page for the clerk and the head; /bill-desk/finance/<tab> is Finance's own menu.
// Addresses from before the new navigation (/bill-desk/clerk/…, /bill-desk/head/…) are sent on to their new page.
// The address is read after mount, so the page never waits on router.query.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getRole, setRole } from 'src/billdesk/roles'
import { iaPage, movedFrom, hiddenFor, FINANCE } from 'src/billdesk/ia'
import ClerkDesk from 'src/billdesk/screens/ClerkDesk'
import GrnDesk from 'src/billdesk/screens/GrnDesk'
import FinanceDesk from 'src/billdesk/screens/Finance'

const SectionView = () => {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  const [, , section, view] = (ready ? window.location.pathname.replace(/\/$/, '') : '').split('/')
  const page = iaPage(section, view)
  const finance = section === 'finance' && FINANCE.items.some(t => t.slug === view)
  const moved = !ready ? null : page ? hiddenFor(section, view, getRole()) : !finance ? movedFrom(section, view, window.location.hash) : null
  useEffect(() => {
    if (moved) router.replace(moved)
    else if (finance && getRole() !== 'finance') setRole('finance')
  }, [moved, finance, page]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready || moved) return null
  if (finance) return <FinanceDesk key={view} view={view} />
  if (!page) return 'Not a Bill Desk page'
  if (section === 'grns') return <GrnDesk key={view} view={view} />

  return <ClerkDesk key={`${section}/${view}`} section={section} view={view} />
}

export default SectionView
