// /bill-desk/add-invoice: the Add invoice form as a full page (Sourav, 31 Oct). ?grn=<GRN no.> starts it on that GRN
// (from the GRN sheet, BD-72); ?edit=<BD no.> edits an invoice still with the clerk. Read after mount.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getRole, setRole } from 'src/billdesk/roles'
import { getState } from 'src/billdesk/store'
import { listOf } from 'src/billdesk/ia'
import InvoiceForm from 'src/billdesk/screens/InvoiceForm'

const AddInvoicePage = () => {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => { if (getRole() !== 'clerk') setRole('clerk'); setReady(true) }, [])
  if (!ready) return null
  const q = new URLSearchParams(window.location.search)
  const invoice = q.get('edit') ? getState().invoices.find(i => i.id === q.get('edit')) : undefined
  // Back goes to where the invoice lives, not to browser history (which may hold another site or a stale entry):
  // an invoice being edited returns to its Invoices tab, a new one to the GRN it started from or to the GRNs list
  const back = () => {
    if (invoice) return router.push(listOf(invoice))
    if (q.get('grn')) return router.push(`/bill-desk/grn/${q.get('grn')}`)

    return router.push('/bill-desk/grns/to-bill')
  }

  return (
    <InvoiceForm key={window.location.search} invoice={invoice} grnId={q.get('grn') || undefined} onClose={back}
      onSent={() => router.push('/bill-desk/invoices/pending-match')}
      onSaved={() => router.push('/bill-desk/invoices/under-review')} />
  )
}

export default AddInvoicePage
