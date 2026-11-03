// /bill-desk/invoice/<id>: one invoice, for whichever role is looking (screens/Invoice). The id is read from the
// address after mount, so the page never waits on router.query.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Invoice from 'src/billdesk/screens/Invoice'

const InvoicePage = () => {
  useRouter() // redraw on client navigation
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  const id = decodeURIComponent(window.location.pathname.split('/')[3] || '')

  return <Invoice key={id} id={id} />
}

export default InvoicePage
