// The Challans and Invoices pages (ia.js; Sourav, 2 Nov), each with L1 tabs, for the clerk and the head:
// - Challans › To Group: DCs on no GRN (BD-72, 5 Nov). The clerk ticks one vendor's challans and clicks Make GRN; a DC
//   opens the challan sheet.
// - Challans › Grouped: DCs on a GRN, with that GRN and how far it is billed. All Challans: every DC.
// - Invoices › Draft (sent to Antz AI, waiting for challans), Correction Needed (sent back to the clerk) and
//   Submitted (from head review until payment or rejection).
// The role changes the actions and the default view: the clerk adds, matches and fixes; the head opens an invoice to
// approve or send it back, and starts on Submitted showing what is under review.
import { useEffect, useMemo, useState } from 'react'
import { isReading, isFailed } from '../antzAi'
import { Box } from '@mui/material'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useBillDesk, vendorOf, whOf, unitOf } from '../store'
import { useRole } from '../roles'
import { iaPage, itemsFor } from '../ia'
import { lineTakenMap, grnState, GRN_STATE } from '../logic'
import { deleteInvoice, takenDcs, retryAi, approveToFinance, makeGrn } from '../flow'
import { computedOf, docsSummary, fmtDay, fmtAt, inr, DISC, stageLabel } from '../logic'
import { C, Txt, I, Btn } from '../ui/ui'
import { startOfDay, endOfDay } from 'date-fns'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { Badge, Button, MenuItem, Select } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Page, Pill, StagePill, ParsePill, Grid, Person, AddBtn, L1Tabs, SelBar, AskDialog, tryRun } from '../ui/parts'
import ListFilterDrawer from '../ui/ListFilterDrawer'
import ChallanSheet from './ChallanSheet'
import InvoiceSheet from './InvoiceSheet'
import AddGrnSheet from './AddGrnSheet'

const qtyLine = (s, lines, key) => {
  const by = {}
  lines.forEach(l => { if (l[key]) by[l.unitId] = (by[l.unitId] || 0) + l[key] })
  const parts = Object.entries(by).map(([u, n]) => `${Math.round(n * 100) / 100} ${unitOf(s, u)}`)

  return parts.length ? parts.join(' · ') : '0'
}
// where an invoice is now, in the pipeline's words (docs/mock/invoice-pipeline.html)
const stageOf = i => stageLabel(i.status)
// each page's list, as the old tabs called them: DC lists (to, inv, all) and invoice lists (ai, fix, sent)
const VIEW = { 'to-group': 'to', grouped: 'inv', all: 'all', 'pending-match': 'ai', 'correction-needed': 'fix', 'under-review': 'rev', reviewed: 'sent', 'all-invoices': 'allinv' }
const ClerkDesk = ({ section = 'challans', view = 'to-group', initialDc = null }) => {
  const s = useBillDesk()
  const router = useRouter()
  const theme = useTheme()
  const role = useRole()
  const clerk = role === 'clerk'
  const page = iaPage(section, view)
  const isInv = section === 'invoices'
  const tab = isInv ? 'on' : VIEW[view]
  const seg = isInv ? VIEW[view] : null
  const [q, setQ] = useState('')
  const [vendor, setVendor] = useState('all')
  const [openInv, setOpenInv] = useState(null) // the invoice whose side sheet is open
  const [parse, setParse] = useState('all')
  // the head starts on what is waiting for them (2 Nov: the role changes the default view)
  const [stage, setStage] = useState('all')
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [filters, setFilters] = useState({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [sel, setSel] = useState([])
  const [ask, setAsk] = useState(false)
  // Add invoice and edit are a full page (/bill-desk/add-invoice)
  const editInv = i => router.push(`/bill-desk/add-invoice?edit=${i.id}`)
  const [sheet, setSheet] = useState(initialDc) // the challan sheet, by DC number
  const taken = takenDcs(s) // DC → the GRN holding it (BD-72)
  const lt = lineTakenMap(s.invoices)
  const t = q.trim().toLowerCase()

  const grnById = Object.fromEntries((s.grns || []).map(g => [g.id, g]))
  const grnLabel = g => GRN_STATE[grnState(g, lt)][0]
  const nowOf = d => { const g = grnById[taken[d.dcNumber]]; return g ? grnLabel(g) : 'To Group' }
  // the date range (received date on the DC tabs, invoice date on Invoiced) and the drawer's picks
  const inDates = iso => !dates.startDate || !dates.endDate || !iso || (new Date(iso) >= startOfDay(new Date(dates.startDate)) && new Date(iso) <= endOfDay(new Date(dates.endDate)))
  const someIn = (sel, v) => !sel?.length || sel.includes(v)
  const dcRows = useMemo(() => s.dcs.filter(d => tab === 'all' || (tab === 'inv' ? !!taken[d.dcNumber] : !taken[d.dcNumber]))
    .filter(d => inDates(d.receivedAt) && (vendor === 'all' || d.vendorId === vendor) && someIn(filters.Vendor, d.vendorId) && someIn(filters.Warehouse, d.warehouseId) && someIn(filters['Received by'], d.receivedBy) && someIn(filters.Now, nowOf(d)))
    .filter(d => !t || d.dcNumber.toLowerCase().includes(t) || vendorOf(s, d.vendorId)?.name.toLowerCase().includes(t))
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)), [s, tab, vendor, dates, filters, t]) // eslint-disable-line react-hooks/exhaustive-deps
  // Submitted (Sourav, 2 Nov): every invoice that has left the clerk, from head review until payment or rejection
  // Under Review: with the head (sent, or returned by Finance). Reviewed: the head approved it; Finance check to payment
  // or rejection (2 Nov: Submitted split in two)
  const REV = ['with_head', 'returned_by_finance']
  const SENT = ['checked', 'with_finance', 'sent_for_approval', 'approved', 'paid', 'rejected']
  const revAll = s.invoices.filter(i => REV.includes(i.status))
  // All Invoices: every invoice the clerk has saved or sent to Antz AI, whatever its stage
  const allInv = s.invoices
  const fixAll = s.invoices.filter(i => i.status === 'returned_to_clerk')
  const sentAll = s.invoices.filter(i => SENT.includes(i.status))
  // Invoiced › To connect (1 Nov): invoices sent to Antz AI; a row being read can't be opened yet
  const aiAll = s.invoices.filter(i => i.status === 'to_connect')
  const aiStateOf = i => (isReading(i) ? 'Reading' : isFailed(i) ? 'Failed' : (i.ai?.lines || []).some(l => !l.itemId || (l.unsure || []).length) ? 'Needs check' : 'Read')
  const [, tick] = useState(0)
  useEffect(() => { if (!aiAll.some(isReading)) return undefined; const t = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(t) }, [aiAll.map(i => i.id + isReading(i)).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const aiRows = aiAll.filter(i => (vendor === 'all' || i.vendorId === vendor) && someIn(filters.Vendor, i.vendorId) && (parse === 'all' || aiStateOf(i) === parse))
    .filter(i => !t || [i.invoiceNo, vendorOf(s, i.vendorId)?.name].some(x => String(x || '').toLowerCase().includes(t)))
    .sort((a, b) => (b.ai?.sentAt || '').localeCompare(a.ai?.sentAt || ''))
  // Pending match columns (Sourav, 2 Nov): serial number, invoice number, vendor, parsing status, uploaded by (name and
  // time), action. DCs on the bill and the total are gone: the clerk sees those when connecting
  const aiCols = [
    { nowrap: true, minWidth: 160, key: 'no', label: 'Invoice no.', render: i => <Box><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{i.invoiceNo}</Txt>{!isReading(i) && !isFailed(i) && <Txt t='sub' c={C.quiet}>{fmtDay(i.invoiceDate)}</Txt>}</Box> },
    { nowrap: true, minWidth: 200, key: 'v', label: 'Vendor', render: i => { const quiet = isReading(i) || isFailed(i); return <Txt t='bodyTitle' c={quiet ? C.quiet : C.black}>{isReading(i) ? 'Reading…' : isFailed(i) ? 'Not read' : vendorOf(s, i.vendorId)?.name}</Txt> } },
    { nowrap: true, width: 170, key: 'ai', label: 'Parsing status', render: i => <ParsePill state={aiStateOf(i)} title={isFailed(i) ? i.ai?.error : undefined} /> },
    { nowrap: true, minWidth: 220, key: 'at', label: 'Uploaded by', render: i => <Person name={i.trail[0]?.by} at={i.ai?.sentAt || i.trail[0]?.at} /> },
    ...(clerk ? [{ key: 'act', label: 'Action', align: 'right', width: 170, render: i => (isReading(i) ? null : <Box onClick={e => e.stopPropagation()}>{isFailed(i)
      ? <Btn icon='mdi:refresh' onClick={() => tryRun(toast, () => retryAi(i.id), 'Antz AI is reading this invoice again.')} sx={{ height: 36 }}>Try again</Btn>
      : <Btn icon='mdi:plus' onClick={() => editInv(i)}>Challan</Btn>} {/* "+ Challan" (Sourav, 2 Nov) */}</Box>) }] : [])
  ]
  const onInv = (seg === 'fix' ? fixAll : seg === 'rev' ? revAll : seg === 'allinv' ? allInv : sentAll)
    .filter(i => inDates(i.invoiceDate) && (vendor === 'all' || i.vendorId === vendor) && (stage === 'all' || stageLabel(i.status) === stage))
    .filter(i => !t || [i.id, i.invoiceNo, i.grnId, vendorOf(s, i.vendorId)?.name, ...i.dcNumbers].some(x => String(x || '').toLowerCase().includes(t)))
    .sort((a, b) => (a.invoiceDate || '').localeCompare(b.invoiceDate || ''))
  const opt = (v, l) => ({ value: v, label: l })
  const pool = tab === 'to' ? s.dcs.filter(d => !taken[d.dcNumber]) : tab === 'inv' ? s.dcs.filter(d => taken[d.dcNumber]) : tab === 'all' ? s.dcs : (seg === 'ai' ? aiAll : seg === 'fix' ? fixAll : seg === 'rev' ? revAll : seg === 'allinv' ? allInv : sentAll).filter(i => i.vendorId) // the sub-tab's own vendors
  // Vendor sits outside the drawer as its own dropdown (Sourav, 31 Oct); the drawer holds the rest
  const vendorOpts = [...new Set(pool.map(x => x.vendorId))].map(v => [v, vendorOf(s, v)?.name || v]).sort((a, b) => a[1].localeCompare(b[1]))
  const NOW_ORDER = ['To Group', ...Object.values(GRN_STATE).map(x => x[0])]
  // the drawer is for the DC tabs; Invoiced has the Vendor dropdown and the date range only
  // Invoiced has its own drawer (2 Nov): Vendor, and on To connect the Antz AI state; the DC tabs keep theirs
  const categories = tab === 'on' ? [
    { label: 'Vendor', options: vendorOpts.map(([v, l]) => opt(v, l)) },
    ...(seg === 'ai' ? [{ label: 'Parsing status', options: ['Reading', 'Read', 'Needs check', 'Failed'].map(n => opt(n, n)) }] : [])
  ] : [
    { label: 'Vendor', options: vendorOpts.map(([v, l]) => opt(v, l)) },
    { label: 'Warehouse', options: s.warehouses.map(w => opt(w.id, w.name)) },
    // every DC is signed (Sourav, 2 Nov): no Signed DC column or filter
    { label: 'Received by', options: [...new Set(pool.map(d => d.receivedBy).filter(Boolean))].sort().map(n => opt(n, n)) },
    ...(tab !== 'to' ? [{ label: 'Now', options: NOW_ORDER.filter(n => s.dcs.some(d => nowOf(d) === n)).map(n => opt(n, n)) }] : [])
  ]
  const tabCount = { 'to-group': s.dcs.filter(d => !taken[d.dcNumber]).length, grouped: s.dcs.filter(d => taken[d.dcNumber]).length, all: s.dcs.length, 'pending-match': aiAll.length, 'correction-needed': fixAll.length, 'under-review': revAll.length, reviewed: sentAll.length, 'all-invoices': allInv.length }
  const lastReturn = i => [...i.trail].reverse().find(e => e.to === 'returned_to_clerk')
  // a DC row opens the challan sheet over the list (Sourav, 31 Oct); /bill-desk/dc/<number> deep-links to it
  const openDc = d => setSheet(d.dcNumber)
  const closeSheet = () => { setSheet(null); if (initialDc) router.replace('/bill-desk/challans/to-group') }

  const dcCols = [
    { nowrap: true, width: 150, key: 'dc', label: 'DC', render: d => <Txt t='bodyTitle' c={C.black}>{d.dcNumber}</Txt> },
    { nowrap: true, minWidth: 200, key: 'v', label: 'Vendor', render: d => <Txt t='bodyTitle' c={C.black}>{vendorOf(s, d.vendorId)?.name}</Txt> }, // as bold as the DC number (2 Nov)
    { nowrap: true, minWidth: 150, key: 'wh', label: 'Warehouse', render: d => whOf(s, d.warehouseId) },
    { key: 'p', label: 'Products', align: 'right', width: 110, render: d => d.lines.length },
    { key: 'rec', label: 'Received qty', minWidth: 170, render: d => qtyLine(s, d.lines, 'receivedQty') },
    { nowrap: true, minWidth: 250, key: 'at', label: 'Received', render: d => <Person name={d.receivedBy} at={d.receivedAt} /> },
    // the GRN a challan is on, and how far that GRN is billed (BD-72)
    ...(tab !== 'to' ? [{ nowrap: true, minWidth: 190, key: 'now', label: 'GRN', render: d => { const g = grnById[taken[d.dcNumber]]; return g ? <Box><Txt t='bodyTitle' c={C.ink} sx={{ display: 'block' }}>{g.id}</Txt><Txt t='sub' c={C.quiet}>{grnLabel(g)}</Txt></Box> : <StagePill label='To Group' /> } }] : [])
  ]
  // Bill Desk no. first, then invoice no., vendor, the challan count (Sourav, 2 Nov)
  const bd = { nowrap: true, width: 140, key: 'id', label: 'Bill Desk no.', render: i => <Txt c={C.ink}>{i.id}</Txt> }
  const ino = { nowrap: true, minWidth: 150, key: 'no', label: 'Invoice no.', render: i => <Box><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{i.invoiceNo}</Txt><Txt t='sub' c={C.quiet}>{fmtDay(i.invoiceDate)}</Txt></Box> }
  const grnCol = { nowrap: true, width: 150, key: 'grn', label: 'GRN', render: i => (i.grnId ? <Txt c={C.ink}>{i.grnId}</Txt> : <Txt c={C.quiet}>—</Txt>) }
  const ven = { nowrap: true, minWidth: 180, key: 'v', label: 'Vendor', render: i => (i.vendorId ? <Txt t='bodyTitle' c={C.black}>{vendorOf(s, i.vendorId)?.name}</Txt> : <Txt c={C.quiet}>Not read yet</Txt>) }
  // an invoice still pending match has no match result or total yet
  const mis = i => { if (i.status === 'to_connect') return <Txt c={C.quiet}>—</Txt>; const n = (i.discrepancies || []).filter(d => d.itemId).length; return n ? <Txt c={C.tert}>{n} {n === 1 ? 'item' : 'items'} mismatch</Txt> : <Txt c={C.text}>Matched</Txt> }
  const invCols = seg === 'fix' ? [
    bd, ino, ven,
    { nowrap: true, minWidth: 250, key: 'by', label: 'Sent back by', render: i => { const r = lastReturn(i); return <Person name={r?.by} at={r?.at} /> } },
    { key: 'note', label: 'Note', flex: 2, minWidth: 260, render: i => <Txt c={C.text} sx={{ whiteSpace: 'normal' }}>{lastReturn(i)?.note ? `“${lastReturn(i).note}”` : '—'}</Txt> },
    ...(clerk ? [{ key: 'act', label: 'Action', align: 'right', width: 120, render: i => <Box onClick={e => e.stopPropagation()}><Btn icon='mdi:pencil-outline' onClick={() => editInv(i)}>Fix</Btn></Box> }] : [])
  ] : [
    bd, ino, ven, grnCol,
    { nowrap: true, key: 'amt', label: 'Total', align: 'right', width: 130, render: i => (i.status === 'to_connect' && !computedOf(i).total ? <Txt c={C.quiet}>—</Txt> : <Txt t='bodyMedium'>{inr(computedOf(i).total)}</Txt>) },
    { nowrap: true, key: 'mis', label: 'Match', width: 170, render: mis },
    { nowrap: true, key: 'stage', label: 'Stage', width: 170, render: i => <StagePill status={i.status} /> }
  ]

  // Make GRN (BD-72): the clerk ticks challans on To Group; one vendor's only
  const grouping = clerk && !isInv && tab === 'to'
  const pickedDcs = grouping ? dcRows.filter(d => sel.includes(d.dcNumber)) : []
  const pickedVendors = [...new Set(pickedDcs.map(d => d.vendorId))]
  const pickedItems = new Set(pickedDcs.flatMap(d => d.lines.map(l => l.itemId))).size
  const [adding, setAdding] = useState(false) // the Add GRN sheet (5 Nov)
  const makeFrom = dcs => {
    const id = tryRun(toast, () => makeGrn(dcs), x => `${x} made`)
    if (id) { setSel([]); setAdding(false); router.push(`/bill-desk/grn/${id}`) }
  }
  const tryMakeGrn = () => makeFrom(pickedDcs.map(d => d.dcNumber))

  // the head's bulk Mark as reviewed, on Under Review only
  const bulk = role === 'head' && seg === 'rev'
  const picked = bulk ? onInv.filter(i => sel.includes(i.id)) : []
  const pickedDisc = picked.filter(i => (i.discrepancies || []).some(d => d.itemId)).length

  return (
    <Page crumb={['Bill Desk', page.section.section]} title={page.section.section} act={clerk && !isInv ? <AddBtn onClick={() => setAdding(true)}>Add GRN</AddBtn> : null}>
      {/* three tabs per page, counts in brackets the Compliance way; each tab is its own address so Back returns to it */}
      <L1Tabs value={view} onChange={v => router.push(`/bill-desk/${section}/${v}`)}
        tabs={itemsFor(page.section, role).map(t => [t.slug, `${t.title} (${tabCount[t.slug]})`])} />
      {/* the toolbar of the Antz codebase's compliance Shipments list (pages/compliance/documents/shipments), copied as it is
          (Sourav, 2 Nov: "follow compliance components"): Search on the left; the date range and the outlined Filter button
          with its count badge on the right, wrapping rather than overlapping. Compliance has no toolbar dropdown, so the
          vendor is a category in the filter drawer */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 4, flexWrap: 'wrap', mb: 5 }}>
        <Search placeholder={tab === 'on' ? 'Search vendor, invoice or DC' : 'Search DC or vendor'} value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {/* Invoiced filters by vendor and parsing status as dropdowns (Sourav, 2 Nov), the plain small Select of the
              codebase's hospital lists; the DC tabs keep the Filter drawer */}
          {tab === 'on' && <Select size='small' value={vendor} onChange={e => setVendor(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value='all'>All vendors</MenuItem>
            {vendorOpts.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </Select>}
          {tab === 'on' && (seg === 'sent' || seg === 'allinv') && <Select size='small' value={stage} onChange={e => setStage(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value='all'>All stages</MenuItem>
            {(seg === 'allinv' ? ['Draft', 'Correction Needed', 'Under Review', 'Returned by Finance', 'In Verification', 'Awaiting Approval', 'Payment Pending', 'Paid', 'Rejected'] : ['In Verification', 'Awaiting Approval', 'Payment Pending', 'Paid', 'Rejected']).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>}
          {tab === 'on' && seg === 'ai' && <Select size='small' value={parse} onChange={e => setParse(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value='all'>All statuses</MenuItem>
            {['Reading', 'Read', 'Needs check', 'Failed'].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>}
          <Box>
            <CommonDateRangePickers filterDates={dates} onChange={(a, b) => setDates({ startDate: a, endDate: b })} />
          </Box>
          {tab !== 'on' && <Button variant='outlined'
            sx={{ height: 40, color: theme.palette.customColors.OnSurfaceVariant, borderColor: theme.palette.customColors.OutlineVariant, borderRadius: '4px', fontSize: '16px' }}
            startIcon={<TuneRoundedIcon sx={{ height: '24px', width: '24px' }} color={theme.palette.customColors.OnSurfaceVariant} />}
            endIcon={<Badge badgeContent={filterCount} color='primary' invisible={filterCount === 0} sx={{ ml: 2, mr: 2 }} />}
            onClick={() => setFilterOpen(true)}>Filter</Button>}
        </Box>
      </Box>
      {tab !== 'on'
        ? <Grid cols={dcCols} rows={dcRows} rowKey={d => d.dcNumber} onRow={openDc} {...(grouping ? { sel, onSel: setSel } : {})} empty={tab === 'all' ? 'No delivery challans from Diet & Kitchen.' : tab === 'inv' ? 'No challan is on a GRN yet.' : 'Every challan is on a GRN.'} />
        : seg === 'ai'
        ? <Grid cols={aiCols} rows={aiRows} onRow={i => { if (!isReading(i)) clerk ? editInv(i) : router.push(`/bill-desk/invoice-details?id=${i.id}`) }} empty='Nothing waiting. Invoices sent to Antz AI appear here.' />
        : <Grid cols={invCols} rows={onInv} onRow={i => router.push(`/bill-desk/invoice-details?id=${i.id}`)} {...(bulk ? { sel, onSel: setSel } : {})} empty={seg === 'fix' ? 'Nothing sent back. Invoices the head returns land here.' : seg === 'rev' ? 'Nothing waiting for the head.' : seg === 'allinv' ? 'No invoices yet.' : 'Nothing reviewed yet. Invoices the head approves land here.'} />}
      {grouping && <SelBar count={pickedDcs.length} label={`${pickedDcs.length} ${pickedDcs.length === 1 ? 'challan' : 'challans'} selected`}
        sub={pickedVendors.length > 1 ? 'A GRN holds one vendor’s challans. Tick challans from one vendor.' : `${vendorOf(s, pickedVendors[0])?.name} · ${pickedItems} ${pickedItems === 1 ? 'item' : 'items'}`} onClear={() => setSel([])}>
        <Btn kind='pri' icon='mdi:file-document-plus-outline' disabled={pickedVendors.length !== 1} onClick={tryMakeGrn}>Make GRN</Btn>
      </SelBar>}
      {/* the head marks several invoices reviewed at once (3 Nov: "Give bulk mark as review for the head"); Send back
          stays one at a time, from the invoice, since each needs its own note */}
      {bulk && <SelBar count={picked.length} label={`${picked.length} ${picked.length === 1 ? 'invoice' : 'invoices'} selected`}
        sub={`Total ${inr(picked.reduce((n, i) => n + computedOf(i).total, 0))}${pickedDisc ? ` · ${pickedDisc} with items differing` : ''}`} onClear={() => setSel([])}>
        <Btn kind='pri' icon='mdi:check' onClick={() => setAsk(true)}>Mark as reviewed</Btn>
      </SelBar>}
      <AskDialog open={ask} title={`Mark ${picked.length} ${picked.length === 1 ? 'invoice' : 'invoices'} as reviewed`}
        sub={`They move to Reviewed and go to Finance together for verification.${pickedDisc ? ` ${pickedDisc} ${pickedDisc === 1 ? 'has' : 'have'} items differing from the challans; the differences travel with ${pickedDisc === 1 ? 'it' : 'them'}.` : ''}`}
        confirm='Mark as reviewed' onClose={() => setAsk(false)} fields={[]}
        onConfirm={() => { if (tryRun(toast, () => approveToFinance(picked.map(i => i.id)), `${picked.length} reviewed and sent to Finance`) !== false) { setAsk(false); setSel([]) } }} />
      <ListFilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} initialSelected={filters} setFilterCount={setFilterCount} categories={categories} onApply={next => { setFilters(next); setFilterOpen(false) }} />
      {openInv && <InvoiceSheet id={openInv} onClose={() => setOpenInv(null)} onEdit={i => { setOpenInv(null); editInv(i) }} onPeekDc={dc => setSheet(dc)}
        onDelete={i => { if (window.confirm(`Delete ${i.id} (${i.invoiceNo})? Its challans go back to To Bill.`) && tryRun(toast, () => deleteInvoice(i.id), `${i.id} deleted`)) setOpenInv(null) }} />}
      {adding && <AddGrnSheet s={s} free={s.dcs.filter(d => !taken[d.dcNumber])} onClose={() => setAdding(false)} onMake={makeFrom} onPeek={setSheet} />}
      {sheet && <ChallanSheet dc={sheet} onClose={closeSheet} onMakeGrn={clerk ? d => { const id = tryRun(toast, () => makeGrn([d.dcNumber]), x => `${x} made`); if (id) router.push(`/bill-desk/grn/${id}`) } : undefined} onOpenGrn={id => router.push(`/bill-desk/grn/${id}`)} />}
    </Page>
  )
}

export default ClerkDesk
