// /bill-desk/invoice-details?id=<BD no.>: one invoice as a full page (Sourav, 2 Nov: "make that invoice modal into a full
// page"), for the clerk and the head. Back returns to the Invoices tab that holds it. The clerk's ⋮ menu (Edit,
// Delete) shows while the clerk holds it; the head's Approve and Send back show while it is under review.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useRole } from 'src/billdesk/roles'
import { getState, useBillDesk } from 'src/billdesk/store'
import { listOf, inPayments } from 'src/billdesk/ia'
import { deleteInvoice, approveToFinance, returnToClerk, returnByFinance, sendForApproval, recordOutcome, markPaid } from 'src/billdesk/flow'
import { todayIso } from 'src/billdesk/logic'
import { tryRun, AskDialog } from 'src/billdesk/ui/parts'
import { Btn } from 'src/billdesk/ui/ui'
import InvoiceSheet from 'src/billdesk/screens/InvoiceSheet'
import ChallanSheet from 'src/billdesk/screens/ChallanSheet'

const InvoiceDetailsPage = () => {
  const router = useRouter()
  useBillDesk() // redraw when the invoice moves
  const role = useRole()
  const [ready, setReady] = useState(false)
  const [peek, setPeek] = useState(null)
  const [ask, setAsk] = useState(null) // 'back' | 'approve'
  useEffect(() => setReady(true), [])
  if (!ready) return null
  const id = new URLSearchParams(window.location.search).get('id')
  const inv = getState().invoices.find(i => i.id === id)
  const clerkHas = role === 'clerk' && ['to_connect', 'returned_to_clerk'].includes(inv?.status)
  const headHas = role === 'head' && ['with_head', 'returned_by_finance'].includes(inv?.status)
  const back = () => router.push(listOf(inv, role))
  // Finance's actions on one invoice (2 Nov), the same as on its tabs
  const fin = role === 'finance' ? inv?.status : null
  // the role's actions in the header (2 Nov): the head approves or sends back; the clerk holding it fixes it (sent back)
  // or adds its challans (pending match); Edit and Delete sit in the ⋮ while the clerk holds it
  const edit = i => router.push(`/bill-desk/add-invoice?edit=${i.id}`)
  const actions = headHas ? (
    <>
      <Btn kind='outline' onClick={() => setAsk('back')}>Send back</Btn>
      <Btn kind='pri' icon='mdi:check' onClick={() => setAsk('approve')}>Mark as reviewed</Btn>
    </>
  ) : clerkHas ? <Btn kind='pri' onClick={() => edit(inv)}>{inv.status === 'returned_to_clerk' ? 'Fix invoice' : '+ Challan'}</Btn>
    : ['with_finance', 'checked'].includes(fin) ? <><Btn kind='outline' onClick={() => setAsk('fback')}>Send back</Btn><Btn kind='pri' icon='mdi:file-send-outline' onClick={() => setAsk('send')}>Send for approval</Btn></>
    : fin === 'sent_for_approval' ? <><Btn kind='danger' icon='mdi:close' onClick={() => setAsk('rejected')}>Rejected</Btn><Btn kind='pri' icon='mdi:check' onClick={() => { if (tryRun(toast, () => recordOutcome([inv.id], { kind: 'approved' }), 'Recorded as approved') !== false) back() }}>Approved</Btn></>
    : fin === 'approved' ? <Btn kind='pri' icon='mdi:cash-check' onClick={() => setAsk('paid')}>Mark paid</Btn>
    : null

  return (
    <>
      <InvoiceSheet page id={id} onClose={back} onPeekDc={setPeek} actions={actions} crumb={role === 'finance' && inPayments(inv) ? 'Payments' : 'Invoices'}
        onEdit={clerkHas ? edit : undefined}
        onDelete={clerkHas ? (i => { if (window.confirm(`Delete ${i.id} (${i.invoiceNo})? Its challans go back to To Bill.`) && tryRun(toast, () => deleteInvoice(i.id), `${i.id} deleted`)) back() }) : undefined} />
      {peek && <ChallanSheet dc={peek} onClose={() => setPeek(null)} />}
      <AskDialog open={ask === 'back'} title='Send back to the clerk' sub='The invoice moves to Correction Needed with your note, shown above its stage.' confirm='Send back' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'note', label: 'What to fix', multiline: true }]}
        onConfirm={v => { if (tryRun(toast, () => returnToClerk(inv.id, v.note), 'Sent back to the clerk') !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask === 'approve'} title='Mark as reviewed' sub='It moves to Reviewed and goes to Finance for verification.' confirm='Mark as reviewed' onClose={() => setAsk(null)}
        fields={[]} // no note (3 Nov): it only reached Activity; anything to flag goes through Send back
        onConfirm={() => { if (tryRun(toast, () => approveToFinance(inv.id), 'Reviewed and sent to Finance') !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask === 'fback'} title='Send back to Bill Desk' sub='It returns to the head as Returned by Finance, with your reason above its stage.' confirm='Send back' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'reason', label: 'Why it goes back', multiline: true }]}
        onConfirm={v => { if (tryRun(toast, () => returnByFinance(inv.id, v.reason), 'Sent back to Bill Desk') !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask === 'send'} title='Send for payment approval' sub='This invoice, as one approval batch. Record the decision when it comes back.' confirm='Record as sent' onClose={() => setAsk(null)}
        fields={[{ key: 'sentTo', label: 'Sent to', initial: 'Payment approval committee' }, { key: 'ref', label: 'Reference (file / note no.)' }, { key: 'date', label: 'Sent on', type: 'date', initial: todayIso() }]}
        onConfirm={v => { if (tryRun(toast, () => sendForApproval([inv.id], v), id => `Recorded as ${id}`) !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask === 'rejected'} title='Rejected by the approver' sub='Recorded with the reason; it moves to Closed.' confirm='Record' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'reason', label: 'Reason', multiline: true }]}
        onConfirm={v => { if (tryRun(toast, () => recordOutcome([inv.id], { kind: 'rejected', reason: v.reason }), 'Recorded as rejected') !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask === 'paid'} title='Mark paid' sub='It moves to Closed.' confirm='Mark paid' onClose={() => setAsk(null)}
        fields={[{ key: 'utr', label: 'Payment reference (UTR)' }, { key: 'date', label: 'Paid on', type: 'date', initial: todayIso() }]}
        onConfirm={v => { if (tryRun(toast, () => markPaid([inv.id], v), 'Marked paid') !== false) { setAsk(null); back() } }} />
    </>
  )
}

export default InvoiceDetailsPage
