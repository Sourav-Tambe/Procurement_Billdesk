// Invoice lists for the clerk and the head (and Finance › Decided): one table of invoices, filtered by the menu item
// (views.js LISTS). The head's To check puts open exceptions first (discrepancy, signed DC missing), then invoices
// returned before; matched ones can be ticked and checked in a batch. Checked → tick → Send to Finance (handover).
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Box } from '@mui/material'
import toast from 'react-hot-toast'
import { useBillDesk, vendorOf } from '../store'
import { markChecked, handOver } from '../flow'
import { computedOf, checkBlocks, inr, fmtDay, fmtAt, OUTCOME } from '../logic'
import { LISTS, exceptionsOf, headOrder } from '../views'
import { C, Txt, Btn } from '../ui/ui'
import { Page, Pill, Grid, Person, SelBar, AskDialog, SearchField, Toolbar, tryRun } from '../ui/parts'
import { exportExcel } from '../excel'
import { statusPill, matchPill } from './Invoice'

const TITLES = {
  clerk: { invoices: ['Sent invoices', 'Invoices sent to the head, and where each one is now.'] },
  head: { 'to-check': ['To check', 'Exceptions first. Matched invoices with nothing open can be checked together.'], checked: ['Checked', 'Ready for Finance. Tick and send them as one handover.'], returned: ['Returned by Finance', 'Finance sent these back before payment approval.'] },
  finance: { decided: ['Decided', 'Approved and rejected. Deferred invoices are back in From Bill Desk.'] }
}
const EXC = { discrepancy: ['warn', 'Discrepancy'], resolved: ['info', 'Resolved'], signed_missing: ['bad', 'Signed DC missing'], signed_ack: ['quiet', 'No signed DC · accepted'], returned_before: ['quiet', 'Returned before'] }

const InvoiceList = ({ role, tab }) => {
  const s = useBillDesk()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState([])
  const [ask, setAsk] = useState(false)

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    let list = s.invoices.filter(LISTS[role][tab])
    if (t) list = list.filter(i => [i.id, i.invoiceNo, vendorOf(s, i.vendorId)?.name, ...i.dcNumbers].some(x => String(x || '').toLowerCase().includes(t)))

    return role === 'head' && tab === 'to-check' ? list.sort(headOrder(s)) : list.sort((a, b) => (b.trail.at(-1)?.at || '').localeCompare(a.trail.at(-1)?.at || ''))
  }, [s, role, tab, q])

  const [title, sub] = TITLES[role][tab]
  const batchCheck = role === 'head' && tab === 'to-check'
  const batchSend = role === 'head' && tab === 'checked'
  const canSel = i => (batchCheck ? i.match === 'matched' && checkBlocks(i, s.dcsBy).length === 0 : batchSend)
  const sum = rows.filter(r => sel.includes(r.id)).reduce((n, i) => n + computedOf(i).total, 0)

  const cols = [
    // vendor and the vendor's invoice number lead the row; the Bill Desk number sits beside them (Sourav, 31 Oct)
    { key: 'v', label: 'Vendor · invoice', minWidth: 240, render: i => <Box><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{vendorOf(s, i.vendorId)?.name}</Txt><Txt t='sub' c={C.quiet}>{i.invoiceNo || 'No invoice no. yet'}{i.invoiceDate ? ` · ${fmtDay(i.invoiceDate)}` : ''}</Txt></Box> },
    { key: 'id', label: 'Bill Desk no.', width: 150, render: i => <Box><Txt c={C.ink} sx={{ display: 'block' }}>{i.id}</Txt>{i.sample && <Txt t='sub' c={C.quiet}>Sample</Txt>}</Box> },
    { key: 'dc', label: 'DCs', minWidth: 140, render: i => <Box>{i.dcNumbers.map(dc => <Txt key={dc} sx={{ display: 'block', whiteSpace: 'nowrap' }}>{dc}</Txt>)}</Box> },
    { key: 'amt', label: 'Total', align: 'right', width: 130, render: i => <Txt t='bodyMedium'>{inr(computedOf(i).total)}</Txt> },
    { key: 'm', label: 'Match', width: 150, render: i => matchPill(i) },
    { key: 'x', label: 'Flags', minWidth: 200, render: i => <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{exceptionsOf(s, i).filter(e => e !== 'discrepancy' && e !== 'resolved').map(e => <Pill key={e} tone={EXC[e][0]}>{EXC[e][1]}</Pill>)}</Box> },
    role === 'finance'
      ? { key: 'o', label: 'Outcome', render: i => { const o = i.outcomes.at(-1); return o ? <Box><Txt sx={{ display: 'block' }}>{OUTCOME[o.kind]} · {o.approvalId}</Txt>{o.reason && <Txt t='sub' c={C.quiet}>{o.reason}</Txt>}</Box> : null } }
      : { key: 'st', label: 'Status', width: 170, render: i => statusPill(i) },
    { nowrap: true, minWidth: 250, key: 'at', label: 'Last change', render: i => { const e = i.trail.at(-1); return <Person name={e?.by} at={e?.at} /> } }
  ]

  return (
    <Page crumb={[role === 'finance' ? 'Finance' : 'Bill Desk', title]} title={title} sub={sub}
      act={role === 'finance' ? <Btn icon='mdi:microsoft-excel' sx={{ height: 40 }} onClick={() => exportExcel(s, rows, 'bill-desk-decided')}>Export {rows.length} to Excel</Btn> : null}>
      <Toolbar left={<>
        <SearchField value={q} onChange={setQ} placeholder='Search vendor, invoice or DC' />
      </>} />
      <Grid cols={cols} rows={rows} onRow={i => router.push(`/bill-desk/invoice/${i.id}`)} empty='Nothing here'
        {...(batchCheck || batchSend ? { sel, onSel: setSel, canSel } : {})} />
      <SelBar count={sel.length} label={`${sel.length} invoice${sel.length === 1 ? '' : 's'} selected`} sub={`Total ${inr(sum)}`} onClear={() => setSel([])}>
        {batchCheck && <Btn kind='pri' icon='mdi:check-all' onClick={() => { if (tryRun(toast, () => markChecked(sel), `${sel.length} marked checked`) !== false) setSel([]) }}>Mark checked</Btn>}
        {batchSend && <Btn kind='pri' icon='mdi:send-outline' onClick={() => setAsk(true)}>Send to Finance</Btn>}
      </SelBar>
      <AskDialog open={ask} title={`Send ${sel.length} invoice${sel.length === 1 ? '' : 's'} to Finance`} sub={`One handover, ${inr(sum)} in all. Finance marks it received.`} confirm='Send to Finance' onClose={() => setAsk(false)}
        fields={[{ key: 'note', label: 'Note for Finance (optional)', multiline: true }]}
        onConfirm={v => { if (tryRun(toast, () => handOver(sel, v.note), id => `Sent as ${id}`) !== false) { setAsk(false); setSel([]) } }} />
    </Page>
  )
}

export default InvoiceList
