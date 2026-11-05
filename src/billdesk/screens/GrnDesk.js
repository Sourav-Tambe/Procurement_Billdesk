// The GRNs page (BD-72, Sourav, 5 Nov: n challans → 1 GRN → 1 or n invoices; docs/mock/grn-ia.html). Tabs To Bill · Partly
// Billed · Fully Billed · All GRNs, worked out from which GRN lines are on an invoice. Built from the Challans list's parts:
// the same container, toolbar and Grid. A row opens the GRN sheet (a 562px right sheet, as the Add challans sheet): its
// challans, its item lines with the invoice billing each, and for the clerk Add invoice (lines left to bill), Add
// challans, Remove a challan (while none of its items is billed; the last one deletes the GRN) and Delete GRN (while
// no invoice bills it). The list has a delete per row for the clerk (5 Nov: "ability to remove a GRN"). /bill-desk/grn/<id> deep-links to the sheet.
import { useMemo, useState } from 'react'
import { Box, Drawer, IconButton, MenuItem, Select, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { startOfDay, endOfDay } from 'date-fns'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import { useBillDesk, vendorOf, whOf, itemOf, unitOf, grnOf } from '../store'
import { useRole } from '../roles'
import { iaPage, itemsFor } from '../ia'
import { removeFromGrn, addToGrn, deleteGrn, takenDcs } from '../flow'
import { lineTakenMap, lineKey, grnState, grnBilled, grnInvoiceIds, dcLocked, GRN_STATE, fmtDay } from '../logic'
import { C, Txt, I, Btn } from '../ui/ui'
import { Page, Pill, StagePill, Grid, Person, AddBtn, L1Tabs, tryRun } from '../ui/parts'
import ChallanCard from '../ui/ChallanCard'
import ItemThumb from '../ui/ItemThumb'
import ChallanSheet from './ChallanSheet'
import AddGrnSheet from './AddGrnSheet'

const VIEW = { 'to-bill': 'to_bill', 'partly-billed': 'partly', 'fully-billed': 'fully', all: null }
export const GrnPill = ({ state }) => { const [l, tone] = GRN_STATE[state]; return <Pill tone={tone}>{l}</Pill> }
// lines billed as a short bar of segments and "3 of 5"
const Progress = ({ n, of }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Box sx={{ display: 'flex', gap: '2px' }}>{Array.from({ length: Math.min(of, 8) }, (_, i) => <Box key={i} sx={{ width: 14, height: 6, borderRadius: '3px', bgcolor: i < Math.round((n / of) * Math.min(of, 8)) ? 'primary.main' : 'customColors.SurfaceVariant' }} />)}</Box>
    <Txt c={C.ink}>{n} of {of}</Txt>
  </Box>
)

export const GrnSheet = ({ id, onClose }) => {
  const s = useBillDesk()
  const router = useRouter()
  const clerk = useRole() === 'clerk'
  const [peek, setPeek] = useState(null)
  const [adding, setAdding] = useState(false)
  const g = grnOf(s, id)
  if (!g) return null
  const lt = lineTakenMap(s.invoices)
  const state = grnState(g, lt)
  const invs = grnInvoiceIds(g, lt).map(x => s.invoices.find(i => i.id === x)).filter(Boolean)
  const whs = [...new Set(g.dcNumbers.map(dc => whOf(s, s.dcsBy[dc]?.warehouseId)))].join(', ')
  const open = state === 'to_bill'
  const held = takenDcs(s)
  const canJoin = s.dcs.filter(d => d.vendorId === g.vendorId && !held[d.dcNumber] && !dcLocked(g, d, lt))
  const remove = dc => {
    if (g.dcNumbers.length === 1 && !window.confirm(`${dc} is the last challan on ${g.id}. Removing it deletes the GRN. Continue?`)) return
    const r = tryRun(toast, () => removeFromGrn(g.id, dc), x => (x === 'deleted' ? `${g.id} deleted` : `${dc} back in To Group`))
    if (r === 'deleted') onClose()
  }
  const kv = (k, v) => <Box><Txt t='sub' c={C.quiet} sx={{ display: 'block' }}>{k}</Txt><Txt t='bodyMedium' c={C.black}>{v}</Txt></Box>
  const cols = [
    { key: 'item', label: 'Item', flex: 2, minWidth: 180, render: l => <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}><ItemThumb item={itemOf(s, l.itemId)} size={36} /><Txt t='bodyTitle' c={C.black}>{itemOf(s, l.itemId)?.name || l.itemId}</Txt></Box> },
    { key: 'rec', label: 'Received', align: 'right', width: 110, render: l => `${l.receivedQty} ${unitOf(s, l.unitId)}` },
    { key: 'inv', label: 'Invoice', width: 170, render: l => { const i = s.invoices.find(x => x.id === lt[lineKey(g.id, l.itemId)]); return i ? <Box><Txt t='bodyTitle' c={C.ink} sx={{ display: 'block' }}>{i.invoiceNo}</Txt><Txt t='sub' c={C.quiet}>{i.id}</Txt></Box> : <StagePill label='Not billed' /> } }
  ]

  return (
    <>
      <Drawer anchor='right' open onClose={onClose} slotProps={{ paper: { sx: { width: 562, maxWidth: '100vw' } } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: '20px 24px 16px', flex: 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='h6' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{g.id}</Typography>
              <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{vendorOf(s, g.vendorId)?.name} · {whs}</Typography>
            </Box>
            <GrnPill state={state} />
            <IconButton aria-label='Close' size='small' onClick={onClose}><I i='mdi:close' s={22} /></IconButton>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'customColors.Background', borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, p: '16px 24px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', p: '14px 16px', bgcolor: C.white, borderRadius: '10px', mb: 4 }}>
              {kv('Lines billed', `${grnBilled(g, lt)} of ${g.lines.length}`)}
              {kv('Invoices', invs.length)}
              {kv('Made', `${fmtDay(g.createdAt)} · ${g.createdBy}`)}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', flex: 1 }}>Challans ({g.dcNumbers.length})</Typography>
              {clerk && <Btn kind='ghost' icon='mdi:plus' disabled={!canJoin.length} title={canJoin.length ? undefined : 'No challans of this vendor to group'} onClick={() => setAdding(true)}>Add challans</Btn>}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 5 }}>
              {g.dcNumbers.map(dc => { const d = s.dcsBy[dc]; if (!d) return null; const locked = dcLocked(g, d, lt); return (
                <ChallanCard key={dc} s={s} d={d} onView={() => setPeek(dc)}
                  right={!clerk ? null : locked
                    ? <Tooltip title='Its items are on an invoice'><Box sx={{ display: 'grid', placeItems: 'center', width: 34 }}><I i='mdi:lock-outline' s={20} c={C.quiet} /></Box></Tooltip>
                    : <Tooltip title='Remove from this GRN'><IconButton aria-label={`Remove ${dc}`} size='small' onClick={() => remove(dc)} sx={{ color: 'customColors.neutralSecondary' }}><I i='mdi:close' s={20} /></IconButton></Tooltip>} />
              ) })}
            </Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3, color: 'customColors.OnSurfaceVariant' }}>Item lines ({g.lines.length})</Typography>
            <Box sx={{ bgcolor: C.white, borderRadius: '8px' }}>
              <Grid cols={cols} rows={g.lines} rowKey={l => l.itemId} paginate={false} serial={false} dense onRow={l => { const x = lt[lineKey(g.id, l.itemId)]; if (x) router.push(`/bill-desk/invoice-details?id=${x}`) }} />
            </Box>
            {/* a challan whose items are billed is locked on the GRN (BD-72) */}
            {clerk && !open && <Txt c={C.quiet} sx={{ display: 'block', mt: 3 }}>Challans with items on an invoice are locked. Delete those invoices to free them.</Txt>}
          </Box>
          <Box sx={{ p: '16px 24px', flex: 'none', display: 'flex', gap: '12px', bgcolor: 'common.white' }}>
            {clerk && <Tooltip title={open ? '' : 'It has invoices. Delete them first'}><span><Btn icon='mdi:delete-outline' disabled={!open} onClick={() => { if (window.confirm(`Delete ${g.id}? Its challans go back to To Group.`) && tryRun(toast, () => deleteGrn(g.id), `${g.id} deleted`)) onClose() }}>Delete GRN</Btn></span></Tooltip>}
            <Box sx={{ flex: 1 }} />
            <Btn onClick={onClose}>Close</Btn>
            {clerk && state !== 'fully' && <Btn kind='pri' icon='mdi:plus' onClick={() => router.push(`/bill-desk/add-invoice?grn=${g.id}`)}>Add invoice</Btn>}
          </Box>
        </Box>
      </Drawer>
      {adding && <AddGrnSheet s={s} grn={g} free={canJoin} onClose={() => setAdding(false)} onPeek={setPeek}
        onMake={dcs => { if (tryRun(toast, () => addToGrn(g.id, dcs), `${dcs.length} ${dcs.length === 1 ? 'challan' : 'challans'} added to ${g.id}`) !== false) setAdding(false) }} />}
      {peek && <ChallanSheet dc={peek} onClose={() => setPeek(null)} />}
    </>
  )
}

const GrnDesk = ({ view = 'to-bill', initialGrn = null }) => {
  const s = useBillDesk()
  const router = useRouter()
  const role = useRole()
  const page = iaPage('grns', view)
  const [q, setQ] = useState('')
  const [vendor, setVendor] = useState('all')
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [sheet, setSheet] = useState(initialGrn)
  const lt = lineTakenMap(s.invoices)
  const grns = s.grns || []
  const stateOf = g => grnState(g, lt)
  const t = q.trim().toLowerCase()
  const inDates = iso => !dates.startDate || !dates.endDate || (new Date(iso) >= startOfDay(new Date(dates.startDate)) && new Date(iso) <= endOfDay(new Date(dates.endDate)))
  const pool = grns.filter(g => !VIEW[view] || stateOf(g) === VIEW[view])
  const rows = useMemo(() => pool.filter(g => (vendor === 'all' || g.vendorId === vendor) && inDates(g.createdAt))
    .filter(g => !t || [g.id, vendorOf(s, g.vendorId)?.name, ...g.dcNumbers].some(x => String(x || '').toLowerCase().includes(t)))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')), [s, view, vendor, dates, t]) // eslint-disable-line react-hooks/exhaustive-deps
  const vendorOpts = [...new Set(pool.map(g => g.vendorId))].map(v => [v, vendorOf(s, v)?.name || v]).sort((a, b) => a[1].localeCompare(b[1]))
  const tabCount = Object.fromEntries(Object.entries(VIEW).map(([k, st]) => [k, grns.filter(g => !st || stateOf(g) === st).length]))
  const closeSheet = () => { setSheet(null); if (initialGrn) router.replace(`/bill-desk/grns/${view}`) }
  const cols = [
    { nowrap: true, width: 136, key: 'id', label: 'GRN no.', render: g => <Txt t='bodyTitle' c={C.black}>{g.id}</Txt> },
    { nowrap: true, minWidth: 170, key: 'v', label: 'Vendor', render: g => <Txt t='bodyTitle' c={C.black}>{vendorOf(s, g.vendorId)?.name}</Txt> },
    { nowrap: true, minWidth: 140, key: 'dcs', label: 'Challans', render: g => <Box><Txt c={C.ink} sx={{ display: 'block' }}>{g.dcNumbers.length}</Txt><Txt t='sub' c={C.quiet}>{g.dcNumbers[0]}{g.dcNumbers.length > 1 ? ` +${g.dcNumbers.length - 1}` : ''}</Txt></Box> },
    // no Warehouse column: with the row delete it pushed the table past the page (the sheet shows the warehouse)
    { nowrap: true, width: 160, key: 'billed', label: 'Lines billed', render: g => <Progress n={grnBilled(g, lt)} of={g.lines.length} /> },
    { key: 'inv', label: 'Invoices', align: 'right', width: 90, render: g => grnInvoiceIds(g, lt).length },
    ...(view === 'all' ? [{ nowrap: true, width: 130, key: 'st', label: 'Status', render: g => <GrnPill state={stateOf(g)} /> }] : []),
    { nowrap: true, minWidth: 200, key: 'at', label: 'Made', render: g => <Person name={g.createdBy} at={g.createdAt} time={view !== 'all'} /> },
    // delete from the list for the clerk; a GRN with invoices can't go (5 Nov)
    ...(role === 'clerk' ? [{ key: 'act', label: '', align: 'right', width: 64, render: g => { const ok = stateOf(g) === 'to_bill'; return (
      <Box onClick={e => e.stopPropagation()}><Tooltip title={ok ? `Delete ${g.id}` : 'It has invoices. Delete them first'}><span>
        <IconButton aria-label={`Delete ${g.id}`} size='small' disabled={!ok} onClick={() => { if (window.confirm(`Delete ${g.id}? Its challans go back to To Group.`)) tryRun(toast, () => deleteGrn(g.id), `${g.id} deleted`) }}><I i='mdi:delete-outline' s={20} /></IconButton>
      </span></Tooltip></Box>) } }] : [])
  ]

  return (
    <Page crumb={['Bill Desk', 'GRNs']} title='GRNs' act={role === 'clerk' ? <AddBtn onClick={() => router.push('/bill-desk/add-invoice')}>Add invoice</AddBtn> : null}>
      <L1Tabs value={view} onChange={v => router.push(`/bill-desk/grns/${v}`)} tabs={itemsFor(page.section, role).map(x => [x.slug, `${x.title} (${tabCount[x.slug]})`])} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 4, flexWrap: 'wrap', mb: 5 }}>
        <Search placeholder='Search GRN, challan or vendor' value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Select size='small' value={vendor} onChange={e => setVendor(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value='all'>All vendors</MenuItem>
            {vendorOpts.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </Select>
          <Box><CommonDateRangePickers filterDates={dates} onChange={(a, b) => setDates({ startDate: a, endDate: b })} /></Box>
        </Box>
      </Box>
      <Grid cols={cols} rows={rows} onRow={g => setSheet(g.id)}
        empty={view === 'to-bill' ? 'No GRN waiting for an invoice. Make one from Challans › To Group.' : view === 'partly-billed' ? 'No GRN is partly billed.' : view === 'fully-billed' ? 'No GRN is fully billed yet.' : 'No GRNs yet. Make one from Challans › To Group.'} />
      {sheet && <GrnSheet id={sheet} onClose={closeSheet} />}
    </Page>
  )
}

export default GrnDesk
