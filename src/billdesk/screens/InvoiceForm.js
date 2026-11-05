// Add invoice, edit, and connect an invoice Antz AI has read (Sourav, 31 Oct–1 Nov). One column of containers: Invoice
// (number, date, the paper), Vendor, GRN, Items; a bar at the foot with the total and the action. BD-72 (5 Nov): an
// invoice bills a GRN, not loose challans: the clerk picks the GRN (the vendor comes with it) and ticks the GRN lines on
// this bill. Then (5 Nov: "Ability to select DC's from the GRN") the clerk ticks the GRN's challans this bill covers; each
// item on a ticked challan comes in as its whole GRN line (Sourav picked "Whole item line"). Unticked challans' items stay
// on the GRN for a later invoice. Lines already on another invoice are listed, locked. One invoice holds one GRN. With only the
// number and the paper in, the action is the outline "Send to Antz AI"; once DCs are added it is Save invoice. An
// invoice the AI has read opens here filled in: the DCs printed on the bill are added, each bill line is paired with a DC
// item (or waits for the clerk to pick one), low-confidence reads are tinted, and Submit lands it in Matched or With
// discrepancies. The open GRNs can be many, so they are only listed in the Pick the GRN sheet; the form shows the picked
// ones. Received sits beside Billed on every line.
import { useMemo, useState } from 'react'
import { Box, ButtonBase, Checkbox, Drawer, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { FIELD_SX } from '../ui/fieldStyle'
import { useBillDesk, vendorOf, itemOf, unitOf, whOf, grnOf } from '../store'
import { me } from '../roles'
import { saveInvoiceForm, sendToAi, retryAi } from '../flow'
import { isFailed, totalsOf, TOTALS, SURE } from '../antzAi'
import { lineCalc, matchOf, computedOf, saveBlocks, dupOf, DISC, STATUS, inr, fmtDay, r2, lineTakenMap, lineKey, grnState, grnBilled } from '../logic'
import { gstDefault } from '../sample'
import { putDocs } from '../ui/docStore'
import { DocViewer } from '../ui/DocTiles'
import UploadZone from '../ui/UploadZone'
import { C, T, Txt, I, Btn } from '../ui/ui'
import { Page, Pill, ParsePill, Grid, Person, tryRun } from '../ui/parts'
import { GrnPill } from './GrnDesk'
import ChallanSheet from './ChallanSheet'
import ItemThumb from '../ui/ItemThumb'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useSettings } from 'src/@core/hooks/useSettings'
import themeConfig from 'src/configs/themeConfig'

// Antz AI follows Naveen's kitchen build (ParseState): the robot icon and the house tones, no colour of its own; a
// low-confidence read is marked for review in the warning tone
const REV_BG = C.notes40, REV_LINE = C.gold
const TOT_TONE = { match: 'ok', mismatch: 'check', unverified: 'quiet' }
const pct = n => `${Math.round(n * 100)}%`
// the reading beside the paper (Naveen's parsed-items view): each bill line as it now stands, with the AI's confidence,
// and the totals printed on the bill against what the lines add up to
const ReadPanel = ({ s, lines, printed, totals }) => {
  const bill = lines.filter(l => !l.notOnBill), got = computedOf({ lines: bill })
  const row = (k, v, strong) => <Box sx={{ display: 'flex', justifyContent: 'space-between', py: '4px' }}><Txt t={strong ? 'bodyTitle' : 'body'} c={C.text}>{k}</Txt><Txt t={strong ? 'bodyTitle' : 'body'} c={C.black}>{v}</Txt></Box>

  return (
    <Box sx={{ p: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Txt t='minorTitle' c={C.text} sx={{ flex: 1 }}>Antz AI read {bill.length} {bill.length === 1 ? 'item' : 'items'}</Txt>
        <Pill tone={TOT_TONE[totals]} icon='mdi:robot-outline'>{TOTALS[totals]}</Pill>
      </Box>
      <Box sx={{ bgcolor: C.white, borderRadius: '12px', overflow: 'hidden' }}>
        {bill.map((l, i) => {
          const conf = l.confidence ?? 1, open = (l.unsure || []).length > 0

          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '12px', p: '12px 14px', borderBottom: `1px solid ${C.n10}`, '&:last-of-type': { borderBottom: 0 }, ...(open || !l.itemId ? { bgcolor: REV_BG } : {}) }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Txt t='bodyMedium' c={C.black} sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.billName}</Txt>
                <Txt t='sub' c={C.quiet}>{l.billedQty} {unitOf(s, l.unitId)} · ₹{l.rate} · {l.gstPct || 0}%</Txt>
              </Box>
              {!l.itemId ? <Pill tone='check'>Not paired</Pill> : conf < SURE && !open ? <Pill tone='ok' icon='mdi:check'>Checked</Pill> : <Pill tone={conf < SURE ? 'check' : 'ok'}>{pct(conf)}</Pill>}
            </Box>
          )
        })}
      </Box>
      <Box sx={{ bgcolor: C.white, borderRadius: '12px', p: '12px 14px' }}>
        <Txt t='bodyTitle' c={C.text} sx={{ display: 'block', mb: '4px' }}>Printed on the bill</Txt>
        {printed?.total ? <>{row('Taxable', inr(printed.taxable))}{row('GST', inr(printed.gst))}{row('Total', inr(printed.total), true)}</> : <Txt t='body' c={C.quiet}>Not read</Txt>}
        <Box sx={{ borderTop: `1px solid ${C.n10}`, mt: '8px', pt: '8px' }}>{row('Lines add up to', inr(got.total), true)}</Box>
      </Box>
    </Box>
  )
}
const Num = ({ value, onChange, placeholder, bad, unsure, pre, post, disabled }) => <TextField size='small' type='number' value={value ?? ''} onChange={e => onChange(e.target.value.replace(/^0+(?=\d)/, ''))} placeholder={placeholder} error={!!bad} disabled={disabled} onWheel={e => e.target.blur()}
  slotProps={{ htmlInput: { inputMode: 'decimal', style: { textAlign: 'right' } }, input: { ...(pre && { startAdornment: <InputAdornment position='start'>{pre}</InputAdornment> }), ...(post && { endAdornment: <InputAdornment position='end'>{post}</InputAdornment> }) } }}
  sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, bgcolor: C.white }, // no yellow cell (2 Nov): the line's note says what to check
 '& .MuiInputAdornment-root p': { fontSize: 14, color: C.quiet } }} />
// a form section as the compliance build lays one out (ExportPermitDetails): a numbered heading, then the fields in a
// grid, on a white container (Sourav, 2 Nov: "follow compliance form structure")
const Card = ({ n, title, count, act, children }) => (
  <Box component='section' sx={{ p: '20px 24px 24px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: 36, mb: 4 }}>
      <Typography variant='h6' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', flex: 1 }}>{n}. {title}
        {/* a count reads as a quiet number beside the title, not part of it (Sourav, 2 Nov) */}
        {count != null && <Box component='span' sx={{ ml: '8px', fontWeight: 400, color: 'customColors.neutralSecondary' }}>({count})</Box>}</Typography>{act}
    </Box>
    {children}
  </Box>
)

const scoreOf = (l, itemId) => (l.candidates || []).find(c => c.itemId === itemId)?.score
// the GRN lines this invoice may bill: free, or already its own
const freeOf = (g, lt, selfId) => (g ? g.lines.filter(l => { const h = lt[lineKey(g.id, l.itemId)]; return !h || h === selfId }) : [])
// the items a challan brings in (received at more than nothing)
const itemsOfDc = (s, dc) => (s.dcsBy[dc]?.lines || []).filter(l => l.receivedQty > 0).map(l => l.itemId)
// a line is on this bill when a ticked challan carries its item
const withPick = (s, lines, pick) => { const on = new Set(pick.flatMap(dc => itemsOfDc(s, dc))); return lines.map(l => (l.extra ? l : { ...l, on: on.has(l.itemId) })) }
// the GRN's challans that still carry a line to bill
const pickableDcs = (s, g, lt, selfId) => { const free = new Set(freeOf(g, lt, selfId).map(l => l.itemId)); return g ? g.dcNumbers.filter(dc => itemsOfDc(s, dc).some(i => free.has(i))) : [] }
// manual: one row per free GRN line, ticked (on) when it is on this bill; what the clerk typed for a line is kept. A new
// invoice starts with every free line ticked; an invoice being edited with its own lines ticked
const relines = (s, g, lt, selfId, prev, firstOn) => [
  ...freeOf(g, lt, selfId).map(l => {
    const p = prev.find(x => x.itemId === l.itemId && !x.extra)

    return p ? { ...l, billedQty: p.billedQty, rate: p.rate, gstPct: p.gstPct, on: p.on ?? true } : { ...l, billedQty: l.receivedQty, rate: '', gstPct: gstDefault(itemOf(s, l.itemId), l.unitId), on: firstOn }
  }),
  ...prev.filter(x => x.extra)
]
// read by Antz AI: the bill's lines stay; each one's Received comes from the GRN line it is paired with; a line the AI
// couldn't pair waits for the clerk; GRN lines the bill doesn't list simply stay on the GRN for another invoice
const aiLines = (g, lt, selfId, prev) => {
  const free = new Map(freeOf(g, lt, selfId).map(l => [l.itemId, l]))

  return prev.filter(l => !l.notOnBill).map(l => {
    const itemId = l.itemId && free.has(l.itemId) ? l.itemId : !l.itemId && l.guessItemId && free.has(l.guessItemId) && !(l.candidates || []).length ? l.guessItemId : l.itemId && !free.has(l.itemId) ? null : l.itemId

    return { ...l, itemId, receivedQty: itemId ? free.get(itemId).receivedQty : 0 }
  })
}

// pick the GRN and its challans in one right side sheet (5 Nov: "the challan selection should be shown in the sidesheet
// itself"): the open GRNs (lines still to bill), the vendor's only once a vendor is picked; the picked GRN opens to its
// challans with tick boxes (the ones with lines to bill start ticked; one whose items are all billed elsewhere is
// locked). In the Add challans sheet's shape (562px; header, the list on the Antz background, footer)
const FindGrn = ({ s, grns, lt, selfId, chosen, chosenDcs, hint, onClose, onApply, onPeek }) => {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(chosen || hint || null)
  const startDcs = id => (id && id === chosen && chosenDcs?.length ? chosenDcs : pickableDcs(s, grnOf(s, id), lt, selfId))
  const [dcs, setDcs] = useState(() => startDcs(chosen || hint || null))
  const choose = id => { if (id !== pick) { setPick(id); setDcs(startDcs(id)) } }
  const toggle = dc => setDcs(x => (x.includes(dc) ? x.filter(d => d !== dc) : [...x, dc]))
  const t = q.trim().toLowerCase()
  const list = grns.filter(g => !t || [g.id, vendorOf(s, g.vendorId)?.name, ...g.dcNumbers].some(x => String(x || '').toLowerCase().includes(t)))
    .sort((a, b) => (b.id === hint) - (a.id === hint) || (b.createdAt || '').localeCompare(a.createdAt || ''))

  return (
    <Drawer anchor='right' open onClose={onClose} slotProps={{ paper: { sx: { width: 562, maxWidth: '100vw' } } }}><Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: '20px 24px 16px', display: 'flex', alignItems: 'center', flex: 'none' }}>
        <Typography variant='h6' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant', flex: 1 }}>Pick the GRN and challans</Typography>
        <IconButton aria-label='Close' size='small' onClick={onClose}><I i='mdi:close' s={22} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'customColors.Background', borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, p: '16px 24px' }}>
        <Box sx={FIELD_SX}>
          <TextField value={q} onChange={e => setQ(e.target.value)} placeholder='Search GRN, challan or vendor' fullWidth sx={{ mb: 4, '& .MuiInputBase-root': { bgcolor: C.white, height: 56 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position='start'><I i='mdi:magnify' c={C.quiet} /></InputAdornment> } }} />
        </Box>
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3, color: 'customColors.OnSurfaceVariant' }}>GRNs with lines to bill ({list.length})</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {list.map(g => {
            const on = pick === g.id, left = g.lines.length - grnBilled(g, lt)
            const can = on ? pickableDcs(s, g, lt, selfId) : []

            return (
              <Box key={g.id} sx={{ borderRadius: '10px', overflow: 'hidden', bgcolor: 'common.white',
                border: theme => `1.5px solid ${on ? theme.palette.primary.main : theme.palette.customColors.SurfaceVariant}`, '&:hover': { borderColor: on ? 'primary.main' : 'customColors.Outline' } }}>
                <Box onClick={() => choose(g.id)} sx={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}>
                  <Box sx={{ px: 4, py: 3, flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Typography variant='body1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{g.id}</Typography>
                      <GrnPill state={grnState(g, lt)} />{g.id === hint && <Pill tone='ok' icon='mdi:robot-outline'>Challans on the bill</Pill>}
                    </Box>
                    <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{vendorOf(s, g.vendorId)?.name} · {g.dcNumbers.length} {g.dcNumbers.length === 1 ? 'challan' : 'challans'} · {left} of {g.lines.length} lines to bill</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 3, bgcolor: on ? 'customColors.OnBackground' : 'customColors.Surface' }}><I i={on ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'} s={20} c={on ? C.green : C.quiet} /></Box>
                </Box>
                {/* the picked GRN's challans to tick */}
                {on && <Box sx={{ borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                  {g.dcNumbers.map(dc => { const d = s.dcsBy[dc]; if (!d) return null; const locked = !can.includes(dc), ticked = !locked && dcs.includes(dc); const items = d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean); return (
                    <Box key={dc} onClick={() => { if (!locked) toggle(dc) }} sx={{ display: 'flex', alignItems: 'center', gap: '12px', px: 4, py: '10px', cursor: locked ? 'default' : 'pointer', borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, '&:first-of-type': { borderTop: 0 }, bgcolor: locked ? 'customColors.Background' : 'transparent' }}>
                      <Checkbox size='small' checked={ticked} disabled={locked} tabIndex={-1} inputProps={{ 'aria-label': `Bill ${dc} on this invoice` }} sx={{ p: 0, pointerEvents: 'none' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='body2' sx={{ fontWeight: 600, color: locked ? 'customColors.neutralSecondary' : 'customColors.OnSurfaceVariant' }}>{dc}</Typography>
                        <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{locked ? 'Its items are on another invoice' : `${fmtDay(d.receivedAt)} · ${items.slice(0, 2).join(', ')}${items.length > 2 ? ` +${items.length - 2}` : ''}`}</Typography>
                      </Box>
                      <IconButton aria-label={`View ${dc}`} size='small' onClick={e => { e.stopPropagation(); onPeek(dc) }} sx={{ color: 'customColors.neutralSecondary' }}><I i='mdi:eye-outline' s={20} /></IconButton>
                    </Box>
                  ) })}
                </Box>}
              </Box>
            )
          })}
          {!list.length && <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', textAlign: 'center', py: 6 }}>No GRN with lines to bill. Make one from Challans › To Group.</Typography>}
        </Box>
      </Box>
      <Box sx={{ p: '16px 24px', flex: 'none', display: 'flex', justifyContent: 'flex-end', gap: '12px', bgcolor: 'common.white' }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind='pri' disabled={!pick || !dcs.length} onClick={() => onApply(pick, dcs)}>{pick && dcs.length ? `Use ${dcs.length} ${dcs.length === 1 ? 'challan' : 'challans'}` : 'Use GRN'}</Btn>
      </Box>
    </Box></Drawer>
  )
}

const InvoiceForm = ({ invoice, grnId: startGrn, onClose, onSaved, onSent }) => {
  const s = useBillDesk()
  const lt = lineTakenMap(s.invoices)
  const { settings } = useSettings()
  const navHidden = useMediaQuery(theme => theme.breakpoints.down('lg'))
  const navLeft = navHidden ? 0 : settings.navCollapsed ? themeConfig.collapsedNavigationSize : themeConfig.navigationSize
  // a read that failed is entered by hand here, or sent back with Try again (2 Nov)
  const failedMode = isFailed(invoice)
  const aiMode = invoice?.status === 'to_connect' && !failedMode
  const [f, setF] = useState(() => {
    // the clerk connects the GRN (Sourav, 2 Nov: "that work user has to do"): the one holding the challans printed on the
    // bill is only suggested
    if (aiMode) return { id: invoice.id, vendorId: invoice.vendorId, grnId: '', invoiceNo: invoice.invoiceNo, invoiceDate: invoice.invoiceDate, lines: aiLines(null, lt, invoice.id, invoice.ai?.lines || []), docs: invoice.docs || [], printed: {} }
    // an invoice being edited keeps its own lines; its challans show ticked
    if (invoice) { const g = grnOf(s, invoice.grnId); return { id: invoice.id, vendorId: invoice.vendorId, grnId: invoice.grnId || '', pick: invoice.dcNumbers || [], invoiceNo: invoice.invoiceNo, invoiceDate: invoice.invoiceDate, lines: g ? relines(s, g, lt, invoice.id, invoice.lines.map(l => ({ ...l, on: true })), false) : invoice.lines, docs: invoice.docs || [], printed: {} } }
    const g = grnOf(s, startGrn)
    // a GRN opened from its sheet starts here with every challan that has lines to bill ticked
    const pick = pickableDcs(s, g, lt, null)

    return { id: null, vendorId: g?.vendorId || '', grnId: g?.id || '', pick, invoiceNo: '', invoiceDate: '', lines: g ? withPick(s, relines(s, g, lt, null, [], true), pick) : [], docs: [], printed: {} }
  })
  const [view, setView] = useState(null)
  const [peek, setPeek] = useState(null)
  const [finding, setFinding] = useState(false)
  const [tried, setTried] = useState(false)
  const [changing, setChanging] = useState([]) // lines whose GRN item the clerk is changing
  const set = patch => setF(x => ({ ...x, ...patch }))

  const grn = grnOf(s, f.grnId)
  // GRNs this invoice can bill: lines still to bill (or this invoice's own GRN), the vendor's only once one is picked
  const openGrns = (s.grns || []).filter(g => g.id === f.grnId || freeOf(g, lt, f.id).length > 0)
  const grnsFor = openGrns.filter(g => !f.vendorId || g.vendorId === f.vendorId)
  const vendors = useMemo(() => s.vendors.filter(v => v.id === f.vendorId || openGrns.some(g => g.vendorId === v.id)), [s, f.vendorId]) // eslint-disable-line react-hooks/exhaustive-deps
  // what is saved: the ticked lines (manual) or the bill's lines (Antz AI)
  const billLines = aiMode ? f.lines : f.lines.filter(l => l.on !== false).map(({ on, ...l }) => l) // eslint-disable-line no-unused-vars
  const inv = { ...f, id: f.id || '__new__', lines: billLines }
  const m = matchOf(inv), c = computedOf(inv)
  const dup = dupOf(inv, s.invoices)
  const blocks = saveBlocks(inv, s.invoices, lt)
  const discOf = l => m.discrepancies.find(d => d.itemId === l.itemId && l.itemId)
  // a bill line still to be paired isn't a discrepancy yet: it blocks Submit until the clerk picks its GRN item
  const nDisc = m.discrepancies.filter(d => d.itemId).length
  const nReview = f.lines.filter(l => !l.notOnBill && (!l.itemId || (l.unsure || []).length)).length
  // Remove GRN (5 Nov: "allow to remove a grn to change vendor"): the vendor stays; the challans and items go
  const removeGrn = () => setF(x => ({ ...x, grnId: '', pick: [], lines: aiMode ? aiLines(null, lt, x.id, x.lines) : [] }))
  const changeVendor = v => { if (v !== f.vendorId) setF(x => ({ ...x, vendorId: v, grnId: '', pick: [], lines: aiMode ? aiLines(null, lt, x.id, x.lines) : [] })) }
  const pickGrn = (id, dcs) => { const g = grnOf(s, id); setF(x => { const pick = dcs || pickableDcs(s, g, lt, x.id); return { ...x, grnId: id, vendorId: g.vendorId, pick, lines: aiMode ? aiLines(g, lt, x.id, x.lines) : withPick(s, relines(s, g, lt, x.id, x.lines, true), pick) } }) }
  const setLine = (i, patch) => setF(x => ({ ...x, lines: x.lines.map((l, k) => (k === i ? { ...l, ...patch, unsure: (l.unsure || []).filter(u => !(u in patch)) } : l)) }))
  const pairLine = (i, itemId) => setF(x => ({ ...x, lines: aiLines(grn, lt, x.id, x.lines.map((l, k) => (k === i ? { ...l, itemId, guessItemId: itemId, candidates: [] } : l))) }))
  const canSendAi = !f.id && !f.grnId
  const trySend = () => {
    if (dup) { toast.error(`Invoice ${f.invoiceNo.trim()} is already recorded as ${dup.id}`); return }
    if (!f.invoiceNo.trim() || !f.docs.length) { setTried(true); toast.error(!f.invoiceNo.trim() ? 'Enter the invoice number' : 'Attach the invoice'); return }
    const id = tryRun(toast, () => sendToAi(f), () => 'Antz AI is reading this invoice.')
    if (id) onSent?.(id)
  }
  const trySave = () => {
    if (blocks.length) { setTried(true); toast.error(blocks[0]); return }
    const id = tryRun(toast, () => saveInvoiceForm({ ...f, id: f.id, lines: billLines }), x => (aiMode ? `${x} connected` : `Saved as ${x}`))
    if (id) onSaved?.(id)
  }

  // no Suggested GRNs on the form (Sourav, 5 Nov); the picker still marks the GRN holding the challans printed on the bill
  const hint = aiMode && invoice.ai?.grnHint && openGrns.some(g => g.id === invoice.ai.grnHint) ? invoice.ai.grnHint : null
  // the GRN's lines already on another invoice, by invoice (shown locked under the items)
  const elsewhere = grn ? Object.entries(grn.lines.reduce((acc, l) => { const h = lt[lineKey(grn.id, l.itemId)]; if (h && h !== f.id) (acc[h] = acc[h] || []).push(l); return acc }, {})) : []
  const grnItems = freeOf(grn, lt, f.id)
  const priced = !!f.grnId // match shows as soon as the GRN is in; rates are optional
  const totals = aiMode ? totalsOf(invoice.ai?.printed, f.lines) : null
  const tryAgain = () => { if (tryRun(toast, () => retryAi(invoice.id), 'Antz AI is reading this invoice again.')) onSent?.(invoice.id) }
  const title = aiMode || failedMode ? 'Invoice details' : f.id ? `Edit ${f.id}` : 'Add invoice' // the page is named, not the number (2 Nov)
  const showItems = !!f.grnId || (aiMode && f.lines.length > 0)
  const dcCols = [
    { nowrap: true, width: 170, key: 'dc', label: 'Challan no.', render: d => <Txt t='bodyTitle' c={C.black}>{d.dcNumber}</Txt> },
    { key: 'items', label: 'Items', minWidth: 220, render: d => { const n = d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean); return <Txt c={C.ink} sx={{ whiteSpace: 'normal' }}>{n.slice(0, 2).join(', ')}{n.length > 2 && <Txt t='bodyTitle' c={C.quiet}>{` +${n.length - 2}`}</Txt>}</Txt> } },
    { nowrap: true, minWidth: 140, key: 'wh', label: 'Warehouse', render: d => whOf(s, d.warehouseId) },
    { nowrap: true, minWidth: 220, key: 'at', label: 'Received', render: d => <Person name={d.receivedBy} at={d.receivedAt} /> }
  ]
  const TH = { bgcolor: C.tableHead, color: C.text, ...T.bodyMedium, height: 48, px: '10px', textAlign: 'left', whiteSpace: 'nowrap' }

  return (
    <Page contained={false} crumb={['Bill Desk', aiMode || failedMode ? 'Invoices' : 'GRNs', aiMode || failedMode ? 'Invoice details' : title]} // the crumb names the page, not the invoice number (2 Nov)
      title={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <IconButton aria-label='Back' onClick={onClose} sx={{ ml: '-8px', color: 'customColors.OnSurfaceVariant' }}><I i='mdi:arrow-left' s={24} /></IconButton>
        {title}{aiMode && <ParsePill state={nReview ? 'Needs check' : 'Read'} />}
        {failedMode && <ParsePill state='Failed' title={invoice.ai?.error} />}
      </Box>}>
      {/* room at the foot so the fixed action bar never covers the last section */}
      <Box sx={[{ display: 'flex', flexDirection: 'column', gap: '16px', pb: '96px' }, FIELD_SX]}>
        {/* the whole form in one container, sections divided by a line (Sourav, 2 Nov: "full form in one container") */}
        <Box sx={{ bgcolor: C.white, borderRadius: '12px', '& > section + section': { borderTop: `1px solid ${C.surfaceVariant}` } }}>
        <Card n={1} title='Invoice details' act={failedMode && <Btn icon='mdi:refresh' onClick={tryAgain} sx={{ height: 36 }}>Try again</Btn>}>
          {/* the layout of the shipment form Sourav pointed to (2 Nov): fields in two columns, then "Invoice document" with the
              compliance upload, one row per PDF and a dashed Add another file. Order: number, vendor, date */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', columnGap: 5, rowGap: 6, alignItems: 'start' }}>
            <TextField label='Invoice number*' autoComplete='off' sx={{ '& .MuiInputBase-input': { fontWeight: 600 } }} value={f.invoiceNo} onChange={e => set({ invoiceNo: e.target.value })} fullWidth error={!!dup || (tried && !f.invoiceNo.trim())}
              helperText={dup ? `Already recorded as ${dup.id} · ${vendorOf(s, dup.vendorId)?.name || 'vendor not read yet'} · ${STATUS[dup.status]}` : undefined} slotProps={{ inputLabel: { shrink: true } }} />
            {/* the vendor can change at any time (Sourav, 5 Nov: "dont block it"); another vendor drops the GRN, since a GRN
                is one vendor's */}
            <TextField select label='Vendor*' value={f.vendorId} onChange={e => changeVendor(e.target.value)} fullWidth error={tried && !f.vendorId}
              helperText={f.grnId ? 'Changing the vendor removes the GRN' : undefined}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, renderValue: v => vendorOf(s, v)?.name || <Txt t='minor' c={C.quiet}>Pick the vendor on the bill</Txt> } }}>
              {vendors.map(v => { const n = openGrns.filter(g => g.vendorId === v.id).length; return (
                <MenuItem key={v.id} value={v.id} sx={{ display: 'flex', gap: 4 }}><Box component='span' sx={{ flex: 1 }}>{v.name}</Box><Txt t='body' c={C.quiet}>{n} {n === 1 ? 'GRN' : 'GRNs'} to bill</Txt></MenuItem>
              ) })}
            </TextField>
            <TextField label='Invoice date*' type='date' value={f.invoiceDate} onChange={e => set({ invoiceDate: e.target.value })} fullWidth error={tried && !canSendAi && !f.invoiceDate} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', mt: 6, mb: 2 }}>Invoice document*</Typography>
          {/* the file rows take one challan column; the + sits beside it, outside the column (Sourav, 2 Nov) */}
          <Box>
            <Box>
            <UploadZone across pdfOnly accept='application/pdf,.pdf' label='Upload invoice' bad={tried && !f.docs.length} docs={f.docs} by={me().person} onOpen={i => setView(i)}
              onAdd={async made => { const metas = await putDocs(made); setF(x => ({ ...x, docs: [...x.docs, ...metas] })) }}
              onRemove={id => setF(x => ({ ...x, docs: x.docs.filter(d => d.id !== id) }))} />
            </Box>
          </Box>
        </Card>

        {/* the GRN this invoice bills (BD-72): its number, how many lines are left, its challans read-only; Change GRN */}
        <Card n={2} title='GRN' act={grn && <Box sx={{ display: 'flex', gap: '8px' }}>
          <Btn kind='ghost' icon='mdi:pencil-outline' onClick={() => setFinding(true)}>Change GRN or challans</Btn>
          <Btn kind='ghost' icon='mdi:close' onClick={removeGrn}>Remove GRN</Btn>
        </Box>}>
          {grn
            ? <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: 4 }}>
                  {/* the GRN as a plain document icon, no tile (Sourav, 5 Nov) */}
                  <Box sx={{ display: 'flex', flex: 'none' }}><I i='mdi:file-document-check-outline' s={32} c={C.amberText} /></Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{grn.id}</Typography><GrnPill state={grnState(grn, lt)} /></Box>
                    <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>{grn.dcNumbers.length} {grn.dcNumbers.length === 1 ? 'challan' : 'challans'} · {grnItems.length} of {grn.lines.length} lines free for this invoice · made {fmtDay(grn.createdAt)}</Typography>
                  </Box>
                </Box>
                {/* the challans this bill covers, as a table (5 Nov: "challans selected should be shown as a table"); picked
                    in the GRN sheet, Change GRN reopens it. A row opens the goods receipt */}
                <Grid cols={dcCols} rows={(aiMode ? grn.dcNumbers : f.pick || []).map(dc => s.dcsBy[dc]).filter(Boolean)} rowKey={d => d.dcNumber} onRow={d => setPeek(d.dcNumber)} paginate={false}
                  empty='No challans picked. Use Change GRN to pick them.' />
              </>
            : <Box sx={{ minHeight: 150, bgcolor: C.n05, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', px: 4, ...(tried && !canSendAi && { boxShadow: `0 0 0 1px ${C.error}` }) }}>
                <I i='mdi:file-document-outline' s={36} c={C.quiet} />
                <Typography sx={{ color: 'customColors.neutralSecondary', fontWeight: 500, fontSize: '1rem' }}>No GRN picked</Typography>
                <Btn icon='mdi:plus' onClick={() => setFinding(true)} sx={{ height: 40 }}>Pick GRN</Btn>
              </Box>}
        </Card>

        </Box>

        {/* Items in a container of their own (Sourav, 2 Nov: "split items into a separate section in the form") */}
        {/* the items are the bill's, so an invoice Antz AI read shows them before any challan is added; adding challans
            is the clerk's call and only pairs them (Sourav, 2 Nov) */}
        {showItems && <Box sx={{ bgcolor: C.white, borderRadius: '12px' }}>
          <Card n={3} title='Items' count={billLines.length} act={aiMode && <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* no totals pill (Sourav, 2 Nov: "remove the yellow pill"); the comparison is in Compare with bill */}
            {/* no Compare with bill button (Sourav, 2 Nov); the bill opens from its row in Invoice document, with the reading beside it */}
          </Box>}>
            <Box component='table' sx={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0,
              '& th': TH, '& th:first-of-type': { borderRadius: '10px 0 0 10px' }, '& th:last-of-type': { borderRadius: '0 10px 10px 0' },
              '& td': { px: '10px', py: '12px', borderBottom: `1px solid ${C.n10}`, verticalAlign: 'middle' }, '& tbody tr:last-of-type td': { borderBottom: 0 }, '& .r': { textAlign: 'right' } }}>
              <colgroup><col /><col style={{ width: 132 }} /><col style={{ width: 132 }} /><col style={{ width: 120 }} /><col style={{ width: 104 }} /><col style={{ width: 104 }} /></colgroup>
              <thead><tr><th>Item</th><th className='r'>Received Qty.</th><th className='r'>Billed Qty.</th><th className='r'>Rate</th><th className='r'>GST</th><th className='r'>Amount</th></tr></thead>
              <tbody>
                {f.lines.map((l, i) => {
                  if (!aiMode && l.on === false) return null // its challans are unticked: it stays on the GRN for a later invoice
                  const d = discOf(l), lc = lineCalc(l), u = unitOf(s, l.unitId), it = itemOf(s, l.itemId), uns = l.unsure || []
                  const name = <Txt t='minorMedium' c={l.notOnBill ? C.quiet : C.black} sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.billName || it?.name}>{aiMode ? (l.notOnBill ? 'Not on the bill' : l.billName) : it?.name}</Txt>
  
                  return (
                    <Box component='tr' key={`${l.itemId || l.billName}-${i}`} sx={{ bgcolor: d ? C.tert20 : 'transparent' }}>
                      <td>
                        {aiMode ? <Box sx={{ minWidth: 0 }}>
                          {name}
                          {/* one item column (2 Nov): the name as read from the bill, the GRN item it is paired with under it in grey;
                              the picker shows only when the line is unpaired or the clerk asks to change it */}
                          {!l.notOnBill && (l.itemId && !changing.includes(i)
                            ? <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '2px' }}>
                                <Txt t='body' c={C.quiet} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>GRN item: {it?.name}</Txt>
                                <ButtonBase onClick={() => setChanging(x => [...x, i])} sx={{ ...T.bodyMedium, color: C.greenDark, borderRadius: '4px', px: '4px' }}>Change</ButtonBase>
                              </Box>
                            : !grn
                              ? null // no GRN yet: Received shows — on every line, so no note repeats on each row
                              : <Box sx={{ mt: '8px', maxWidth: 320 }}><TextField select size='small' value={l.itemId || ''} onChange={e => { pairLine(i, e.target.value); setChanging(x => x.filter(k => k !== i)) }} fullWidth error={tried && !l.itemId}
                            sx={{ '& .MuiInputBase-root': { height: 40, bgcolor: C.white }, ...(!l.itemId && !tried && { '& .MuiInputBase-root': { height: 40, bgcolor: REV_BG }, '& .MuiOutlinedInput-notchedOutline': { borderColor: `${REV_LINE} !important` } }) }}
                            slotProps={{ select: { displayEmpty: true, renderValue: v => (v ? itemOf(s, v)?.name : 'Pick the GRN item') } }}>
                            {[...grnItems].sort((a, b) => (scoreOf(l, b.itemId) || 0) - (scoreOf(l, a.itemId) || 0)).map(x => <MenuItem key={x.itemId} value={x.itemId} sx={{ display: 'flex', gap: 4 }}>
                              <Box component='span' sx={{ flex: 1 }}>{itemOf(s, x.itemId)?.name}</Box>{scoreOf(l, x.itemId) && <Pill tone='ok' icon='mdi:robot-outline'>{pct(scoreOf(l, x.itemId))} match</Pill>}
                            </MenuItem>)}
                          </TextField></Box>)}
                          {l.notOnBill && <Txt t='body' c={C.quiet} sx={{ display: 'block', mt: '2px' }}>DC item: {it?.name}</Txt>}
                        </Box> : <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <ItemThumb item={it} size={40} />
                          <Box sx={{ minWidth: 0 }}>{name}</Box>
                        </Box>}
                        {/* a discrepancy says by how much (2 Nov) */}
                        {d && <Txt t='body' c={C.tert} sx={{ display: 'block', mt: '2px' }}>{d.kind === 'more' ? `Billed ${r2(d.billed - d.received)} ${u} more than received` : d.kind === 'less' ? `Billed ${r2(d.received - d.billed)} ${u} less than received` : DISC[d.kind]}</Txt>}
                        {/* no check note on low-confidence lines (Sourav, 2 Nov: "don't want this") */}
                      </td>
                      <td className='r'><Txt t='body' c={l.itemId ? C.ink : C.quiet} sx={{ whiteSpace: 'nowrap' }} title={l.itemId ? `${l.receivedQty} ${u}` : undefined}>{l.itemId ? `${l.receivedQty} ${u}` : '—'}</Txt></td>
                      <td><Num value={l.billedQty} onChange={v => setLine(i, { billedQty: v })} bad={!!d} unsure={uns.includes('billedQty')} disabled={l.notOnBill} /></td>
                      <td><Num value={l.rate} onChange={v => setLine(i, { rate: v })} placeholder='0.00' pre='₹' unsure={uns.includes('rate')} disabled={l.notOnBill}  /></td>
                      <td><Num value={l.gstPct} onChange={v => setLine(i, { gstPct: v })} placeholder='0' post='%' disabled={l.notOnBill} /></td>
                      <td className='r'><Txt t='bodyTitle' c={lc.taxable ? C.black : C.quiet}>{lc.taxable ? inr(lc.taxable + lc.gst) : '—'}</Txt></td>
                    </Box>
                  )
                })}
                {/* the GRN's lines already on another invoice, locked, one row per invoice (docs/mock/grn-ia.html) */}
                {elsewhere.map(([id, ls]) => { const o = s.invoices.find(x => x.id === id); return (
                  <tr key={id}>
                    <td colSpan={2}><Txt c={C.quiet}>{ls.map(l => itemOf(s, l.itemId)?.name).join(', ')}</Txt></td>
                    <td colSpan={4}><Txt c={C.quiet}>On {o?.invoiceNo} ({id})</Txt></td>
                  </tr>
                ) })}
              </tbody>
            </Box>
            {!aiMode && grn && !billLines.length && <Txt c={C.quiet} sx={{ display: 'block', mt: 3 }}>Tick a challan above to bring in its items.</Txt>}
          </Card>
        </Box>}

        {/* the foot of the form: total and the one action (Send to Antz AI until DCs are added) */}
        {/* fixed to the bottom edge of the window, across the content beside the menu (Sourav, 2 Nov) */}
        <Box sx={{ position: 'fixed', bottom: 0, right: 0, left: navLeft, zIndex: 1100, bgcolor: C.white, borderTop: `1px solid ${C.surfaceVariant}`, boxShadow: theme => `0 -4px 16px ${theme.palette.customColors.shadowColor}`, p: '14px 48px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {showItems && <>
            <Txt t='minorMedium' c={C.text}>Total</Txt>
            <Txt sx={{ fontSize: 24, fontWeight: 600 }} c={C.black}>{inr(c.total)}</Txt>
            {priced && (nDisc === 0 ? <Pill tone='ok' icon='mdi:check'>Matched</Pill> : <Pill tone='warn' icon='mdi:alert-outline'>{nDisc} {nDisc === 1 ? 'discrepancy' : 'discrepancies'}</Pill>)}
          </>}
          <Box sx={{ flex: 1 }} />
          <Btn onClick={onClose}>Cancel</Btn>
          {/* Send to Antz AI appears once the paper is attached and goes when a GRN is picked (Sourav, 1 Nov) */}
          {canSendAi && f.docs.length > 0 && <Btn icon='mdi:robot-outline' onClick={trySend} disabled={!!dup} sx={{ color: 'customColors.addPrimary', borderColor: 'customColors.addPrimary', '&:hover': { borderColor: 'customColors.addPrimary', bgcolor: 'customColors.antzSecondaryBg' }, '&.Mui-disabled': { color: 'action.disabled', borderColor: 'action.disabledBackground' } }}>Send to Antz AI</Btn>}
          {/* the main action is always there, grey until the form can be saved (Sourav, 2 Nov) */}
          <Btn kind='pri' icon={aiMode ? 'mdi:check' : 'mdi:content-save-outline'} disabled={blocks.length > 0 || !f.grnId} onClick={trySave}>{aiMode ? 'Submit' : 'Save invoice'}</Btn>
        </Box>
      </Box>

      {finding && <FindGrn s={s} grns={grnsFor} lt={lt} selfId={f.id} chosen={f.grnId} chosenDcs={f.pick} hint={hint} onClose={() => setFinding(false)} onPeek={setPeek} onApply={(id, dcs) => { pickGrn(id, aiMode ? null : dcs); setFinding(false) }} />}
      {view != null && <DocViewer docs={f.docs} index={view} onClose={() => setView(null)} side={aiMode ? <ReadPanel s={s} lines={f.lines} printed={invoice.ai?.printed} totals={totals} /> : null} />}
      {peek && <ChallanSheet dc={peek} onClose={() => setPeek(null)} />}
    </Page>
  )
}

export default InvoiceForm
