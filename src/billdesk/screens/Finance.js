// Finance › Payments (Sourav, 2 Nov: "To Verify · Awaiting Approval · Payment Pending · Closed use these"), built as
// Bill Desk's own lists are (ClerkDesk): the Antz compliance toolbar (Search; vendor, batch and date range on the
// right), the shared Grid with separate Bill Desk no., Invoice no. and Vendor columns, and rows that open Invoice
// details. Ticks bring an action bar:
// - To Verify (with Finance, oldest first): Send for payment approval, as one batch (no "mark received" step).
// - Awaiting Approval (in a batch): the approver's decision, Approved or Rejected (Deferred dropped).
// - Payment Pending (approved): Mark paid, with the payment reference (UTR) and date.
// - Closed: paid or rejected, read only.
// - All Invoices: every invoice that has reached Finance, with its stage, read only.
// Export to Excel (the Deal Slip Summary) exports the tab's rows, or the ticked ones.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Box, MenuItem, Select } from '@mui/material'
import { startOfDay, endOfDay } from 'date-fns'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import { useBillDesk, vendorOf } from '../store'
import { sendForApproval, recordOutcome, markPaid } from '../flow'
import { computedOf, inr, fmtDay, todayIso, stageLabel } from '../logic'
import { exportExcel } from '../excel'
import { FINANCE } from '../ia'
import { C, Txt, Btn } from '../ui/ui'
import { Page, Pill, StagePill, Grid, Person, SelBar, AskDialog, L1Tabs, tryRun } from '../ui/parts'

const total = list => list.reduce((n, i) => n + computedOf(i).total, 0)
const lastTo = (inv, to) => [...(inv.trail || [])].reverse().find(e => e.to === to)

const FinanceDesk = ({ view = 'to-verify' }) => {
  const s = useBillDesk()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [vendor, setVendor] = useState('all')
  const [batch, setBatch] = useState('all')
  const [stage, setStage] = useState('all')
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [sel, setSel] = useState([])
  const [ask, setAsk] = useState(null) // 'send' | 'rejected' | 'paid'
  const tab = FINANCE.items.find(t => t.slug === view) || FINANCE.items[0]
  const of = t => s.invoices.filter(i => t.statuses.includes(i.status))
  const pool = of(tab)
  const batchOf = i => s.approvals.find(a => a.id === (i.approvalIds || []).at(-1))
  const inDates = iso => !dates.startDate || !dates.endDate || !iso || (new Date(iso) >= startOfDay(new Date(dates.startDate)) && new Date(iso) <= endOfDay(new Date(dates.endDate)))
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()

    return pool.filter(i => inDates(i.invoiceDate) && (vendor === 'all' || i.vendorId === vendor) && (batch === 'all' || batchOf(i)?.id === batch) && (stage === 'all' || stageLabel(i.status) === stage))
      .filter(i => !t || [i.id, i.invoiceNo, vendorOf(s, i.vendorId)?.name, ...i.dcNumbers].some(x => String(x || '').toLowerCase().includes(t)))
      .sort((a, b) => (a.invoiceDate || '').localeCompare(b.invoiceDate || '')) // oldest invoice first (BD-14)
  }, [s, view, q, vendor, batch, stage, dates]) // eslint-disable-line react-hooks/exhaustive-deps
  const picked = rows.filter(r => sel.includes(r.id))
  const vendorOpts = [...new Set(pool.map(i => i.vendorId))].map(v => [v, vendorOf(s, v)?.name || v]).sort((a, b) => a[1].localeCompare(b[1]))
  const batchOpts = [...new Set(pool.map(i => batchOf(i)?.id).filter(Boolean))]

  // the columns every tab shares, then the tab's own
  const mis = i => { const n = (i.discrepancies || []).filter(d => d.itemId).length; return n ? <Txt c={C.tert}>{n} {n === 1 ? 'item' : 'items'} mismatch</Txt> : <Txt c={C.text}>Matched</Txt> }
  const base = [
    { nowrap: true, width: 140, key: 'id', label: 'Bill Desk no.', render: i => <Txt c={C.ink}>{i.id}</Txt> },
    { nowrap: true, minWidth: 150, key: 'no', label: 'Invoice no.', render: i => <Box><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{i.invoiceNo}</Txt><Txt t='sub' c={C.quiet}>{fmtDay(i.invoiceDate)}</Txt></Box> },
    { nowrap: true, minWidth: 180, key: 'v', label: 'Vendor', render: i => <Txt t='bodyTitle' c={C.black}>{vendorOf(s, i.vendorId)?.name}</Txt> },
    { nowrap: true, key: 'amt', label: 'Total', align: 'right', width: 130, render: i => <Txt t='bodyMedium'>{inr(computedOf(i).total)}</Txt> },
    { nowrap: true, key: 'mis', label: 'Match', width: 160, render: mis }
  ]
  const batchCell = i => { const b = batchOf(i); return b ? <Box><Txt sx={{ display: 'block' }} c={C.ink}>{b.id}</Txt><Txt t='sub' c={C.quiet}>{b.sentTo} · {fmtDay(b.sentAt)}</Txt></Box> : '—' }
  const own = {
    'to-verify': [{ nowrap: true, minWidth: 230, key: 'rev', label: 'Reviewed by', render: i => { const e = lastTo(i, 'checked'); return <Person name={e?.by} at={e?.at} /> } }],
    'awaiting-approval': [{ nowrap: true, minWidth: 230, key: 'pa', label: 'Approval batch', render: batchCell }],
    'payment-pending': [{ nowrap: true, minWidth: 230, key: 'ap', label: 'Approved', render: i => { const e = lastTo(i, 'approved'); return <Person name={e?.by} at={e?.at} /> } }],
    all: [{ nowrap: true, key: 'stage', label: 'Stage', width: 180, render: i => <StagePill status={i.status} /> }],
    closed: [{ minWidth: 260, flex: 1.5, key: 'out', label: 'Outcome', render: i => (i.status === 'paid'
      ? <Box><StagePill status='paid' /><Txt t='sub' c={C.quiet} sx={{ display: 'block', mt: '4px' }}>UTR {i.payment?.utr} · {fmtDay(i.payment?.date)}</Txt></Box>
      : <Box><StagePill status='rejected' /><Txt t='sub' c={C.quiet} sx={{ display: 'block', mt: '4px', whiteSpace: 'normal' }}>{i.outcomes?.at(-1)?.reason || ''}</Txt></Box>) }]
  }
  const cols = [...base, ...own[tab.slug]]
  const canTick = !['closed', 'all'].includes(tab.slug)
  const go = v => { setSel([]); setVendor('all'); setBatch('all'); setStage('all'); router.push(`/bill-desk/finance/${v}`) }
  const done = msg => out => { if (out !== false) { setAsk(null); setSel([]) } return out }

  return (
    <Page crumb={['Bill Desk', 'Payments']} title='Payments'
      act={<Btn icon='mdi:microsoft-excel' sx={{ height: 40 }} onClick={() => exportExcel(s, picked.length ? picked : rows, `deal-slip-${tab.slug}`)}>Export {picked.length || rows.length} to Excel</Btn>}>
      <L1Tabs value={tab.slug} onChange={go} tabs={FINANCE.items.map(t => [t.slug, `${t.title} (${of(t).length})`])} />
      {/* the toolbar of the Antz codebase's compliance lists, as on Bill Desk's own pages */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 4, flexWrap: 'wrap', mb: 5 }}>
        <Search placeholder='Search vendor, invoice or DC' value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Select size='small' value={vendor} onChange={e => setVendor(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value='all'>All vendors</MenuItem>
            {vendorOpts.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </Select>
          {tab.slug === 'awaiting-approval' && <Select size='small' value={batch} onChange={e => setBatch(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value='all'>All batches</MenuItem>
            {batchOpts.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>}
          {tab.slug === 'all' && <Select size='small' value={stage} onChange={e => setStage(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value='all'>All stages</MenuItem>
            {['In Verification', 'Awaiting Approval', 'Payment Pending', 'Paid', 'Rejected'].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>}
          <Box><CommonDateRangePickers filterDates={dates} onChange={(a, b) => setDates({ startDate: a, endDate: b })} /></Box>
        </Box>
      </Box>
      <Grid cols={cols} rows={rows} sel={canTick ? sel : undefined} onSel={canTick ? setSel : undefined} onRow={i => router.push(`/bill-desk/invoice-details?id=${i.id}`)}
        empty={{ 'to-verify': 'Nothing to verify. Invoices the head reviews land here.', 'awaiting-approval': 'Nothing is waiting for payment approval.', 'payment-pending': 'Nothing approved and waiting for payment.', closed: 'Nothing paid or rejected yet.', all: 'Nothing has reached Finance yet.' }[tab.slug]} />

      <SelBar count={sel.length} label={`${sel.length} ${sel.length === 1 ? 'invoice' : 'invoices'} selected`} sub={`Total ${inr(total(picked))}`} onClear={() => setSel([])}>
        {tab.slug === 'to-verify' && <Btn kind='pri' icon='mdi:file-send-outline' onClick={() => setAsk('send')}>Send for payment approval</Btn>}
        {tab.slug === 'awaiting-approval' && <>
          <Btn kind='danger' icon='mdi:close' onClick={() => setAsk('rejected')}>Rejected</Btn>
          <Btn kind='pri' icon='mdi:check' onClick={() => tryRun(toast, () => recordOutcome(sel, { kind: 'approved' }), `${sel.length} approved`) !== false && setSel([])}>Approved</Btn>
        </>}
        {tab.slug === 'payment-pending' && <Btn kind='pri' icon='mdi:cash-check' onClick={() => setAsk('paid')}>Mark paid</Btn>}
      </SelBar>

      <AskDialog open={ask === 'send'} title='Send for payment approval' sub={`${picked.length} ${picked.length === 1 ? 'invoice' : 'invoices'} · ${inr(total(picked))}, as one approval batch. Record the decision when it comes back.`} confirm='Record as sent' onClose={() => setAsk(null)}
        fields={[{ key: 'sentTo', label: 'Sent to', initial: 'Payment approval committee' }, { key: 'ref', label: 'Reference (file / note no.)' }, { key: 'date', label: 'Sent on', type: 'date', initial: todayIso() }, { key: 'note', label: 'Note (optional)', multiline: true }]}
        onConfirm={v => done()(tryRun(toast, () => sendForApproval(sel, v), id => `Recorded as ${id}`))} />
      <AskDialog open={ask === 'rejected'} title='Rejected by the approver' sub='Recorded with the reason; it moves to Closed. What happens next to a rejected invoice is not decided yet.' confirm='Record' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'reason', label: 'Reason', multiline: true }]}
        onConfirm={v => done()(tryRun(toast, () => recordOutcome(sel, { kind: 'rejected', reason: v.reason }), `${sel.length} rejected`))} />
      <AskDialog open={ask === 'paid'} title='Mark paid' sub={`${picked.length} ${picked.length === 1 ? 'invoice' : 'invoices'} · ${inr(total(picked))}. They move to Closed.`} confirm='Mark paid' onClose={() => setAsk(null)}
        fields={[{ key: 'utr', label: 'Payment reference (UTR)' }, { key: 'date', label: 'Paid on', type: 'date', initial: todayIso() }]}
        onConfirm={v => done()(tryRun(toast, () => markPaid(sel, v), `${sel.length} marked paid`))} />
    </Page>
  )
}

export default FinanceDesk
