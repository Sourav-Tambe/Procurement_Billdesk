// Add invoice, edit, and connect an invoice Antz AI has read (Sourav, 31 Oct–1 Nov). One column of containers: Invoice
// (number, date, the paper), Vendor, Select DCs, Items; a bar at the foot with the total and the action. With only the
// number and the paper in, the action is the outline "Send to Antz AI"; once DCs are added it is Save invoice. An
// invoice the AI has read opens here filled in: the DCs printed on the bill are added, each bill line is paired with a DC
// item (or waits for the clerk to pick one), low-confidence reads are tinted, and Submit lands it in Matched or With
// discrepancies. The vendor's DCs can be many, so they are only listed in the Add challans modal; the form shows the added
// ones. Received sits beside Billed on every line.
import { useMemo, useState } from 'react'
import { Box, ButtonBase, Checkbox, Chip, Drawer, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { FIELD_SX } from '../ui/fieldStyle'
import { useBillDesk, vendorOf, itemOf, unitOf, whOf } from '../store'
import { me } from '../roles'
import { saveInvoiceForm, deleteInvoice, takenDcs, sendToAi, retryAi } from '../flow'
import { isFailed, totalsOf, TOTALS, SURE } from '../antzAi'
import { linesFrom, lineCalc, matchOf, computedOf, saveBlocks, dupOf, DISC, STATUS, inr, fmtDay, r2 } from '../logic'
import { gstDefault } from '../sample'
import { putDocs } from '../ui/docStore'
import { DocViewer } from '../ui/DocTiles'
import UploadZone from '../ui/UploadZone'
import { C, T, Txt, I, Btn } from '../ui/ui'
import { Page, Pill, ParsePill, tryRun } from '../ui/parts'
import ChallanSheet from './ChallanSheet'
import ItemThumb from '../ui/ItemThumb'
import { PagePlaceholder } from '../ui/ChallanCard'
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
const recvOf = (s, dcNumbers, itemId) => r2(dcNumbers.reduce((n, dc) => n + (s.dcsBy[dc]?.lines || []).filter(l => l.itemId === itemId).reduce((a, l) => a + (l.receivedQty || 0), 0), 0))
// manual: the items of the added DCs, keeping what the clerk already typed for an item that is still there
const relines = (s, dcNumbers, prev) => linesFrom(dcNumbers.map(dc => s.dcsBy[dc]).filter(Boolean)).map(l => {
  const p = prev.find(x => x.itemId === l.itemId)

  return p ? { ...l, rate: p.rate, gstPct: p.gstPct, billedQty: p.receivedQty === l.receivedQty ? p.billedQty : l.receivedQty } : { ...l, gstPct: gstDefault(itemOf(s, l.itemId), l.unitId) }
})
// read by Antz AI: the bill's lines stay; each one's Received comes from the added DCs; a line the AI couldn't pair is
// paired once a DC with its item is added; received items the bill doesn't list are added as "not on the bill"
const aiLines = (s, dcNumbers, prev) => {
  const onDcs = new Set(dcNumbers.flatMap(dc => (s.dcsBy[dc]?.lines || []).map(l => l.itemId)))
  const bill = prev.filter(l => !l.notOnBill).map(l => {
    const itemId = l.itemId && onDcs.has(l.itemId) ? l.itemId : l.guessItemId && onDcs.has(l.guessItemId) && !l.itemId ? l.guessItemId : l.itemId && !onDcs.has(l.itemId) ? null : l.itemId

    return { ...l, itemId, receivedQty: itemId ? recvOf(s, dcNumbers, itemId) : 0 }
  })
  const billed = new Set(bill.map(l => l.itemId).filter(Boolean))
  const notOnBill = linesFrom(dcNumbers.map(dc => s.dcsBy[dc]).filter(Boolean)).filter(l => !billed.has(l.itemId)).map(l => ({ ...l, billName: null, notOnBill: true, billedQty: 0, rate: '', gstPct: '', unsure: [] }))

  return [...bill, ...notOnBill]
}

// the vendor's open DCs, filtered: the big list lives only here (Sourav, 1 Nov: "that can be a very very big list")
const PAGE = 10
const FindDcs = ({ s, open, onClose, dcs, chosen, invoiceDate, billItems, holderOf, onFree, onPeek, onApply, vendorName }) => {
  const [q, setQ] = useState('')
  const [when, setWhen] = useState('before')
  const [wh, setWh] = useState('all')
  const [pick, setPick] = useState(chosen)
  const [shown, setShown] = useState(PAGE)
  const ref = invoiceDate ? new Date(`${invoiceDate}T23:59`) : new Date()
  const days = n => new Date(ref.getTime() - n * 86400000)
  const t = q.trim().toLowerCase()
  const list = dcs.filter(d => wh === 'all' || d.warehouseId === wh)
    .filter(d => when === 'all' || (when === 'before' ? new Date(d.receivedAt) <= ref : new Date(d.receivedAt) >= days(when === '7' ? 7 : 30) && new Date(d.receivedAt) <= ref))
    .filter(d => !t || d.dcNumber.toLowerCase().includes(t) || d.lines.some(l => (itemOf(s, l.itemId)?.name || '').toLowerCase().includes(t)))
    .sort((a, b) => (!!holderOf(a.dcNumber) - !!holderOf(b.dcNumber)) || b.receivedAt.localeCompare(a.receivedAt)) // challans already on an invoice last
  const added = pick.filter(x => !chosen.includes(x)).length

  return (
    // a right side sheet (Sourav, 2 Nov: "make a sidesheet"), 562px as the compliance species picker (AddSpeciesDrawer), in
    // three full-width bands: white header with title, search, area and dates; the list on the Antz background; white
    // footer with the actions
    <Drawer anchor='right' open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 562, maxWidth: '100vw' } } }}><Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={[{ p: '20px 24px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 'none' }, FIELD_SX]}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* the vendor whose challans these are, under the title (Sourav, 2 Nov) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='h6' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>Add challans</Typography>
            {vendorName && <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{vendorName}</Typography>}
          </Box>
          <IconButton aria-label='Close' size='small' onClick={onClose}><I i='mdi:close' s={22} /></IconButton>
        </Box>
        {/* the date window and the area as two dropdowns on one row (Sourav, 2 Nov) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField select label='Received' value={when} onChange={e => setWhen(e.target.value)} sx={{ '& .MuiInputBase-root': { bgcolor: C.white } }}>
            {[['before', invoiceDate ? 'Before the invoice date' : 'Up to today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All dates']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField>
          <TextField select label='Area' value={wh} onChange={e => setWh(e.target.value)} sx={{ '& .MuiInputBase-root': { bgcolor: C.white } }}>
            <MenuItem value='all'>All areas</MenuItem>{s.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
        </Box>
      </Box>
      {/* each challan a card, as the compliance species picker (AddSpeciesDrawer SpeciesOptionCard): white, 10px corners,
          a green border when picked, the checkbox in a tinted panel on the right; on the Antz background (Sourav, 2 Nov) */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'customColors.Background', borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, p: '16px 24px' }}>
        {/* search sits with the list it narrows (Sourav, 2 Nov) */}
        <Box sx={FIELD_SX}>
          <TextField value={q} onChange={e => { setQ(e.target.value); setShown(PAGE) }} placeholder='Search challan number or item' fullWidth sx={{ mb: 4, '& .MuiInputBase-root': { bgcolor: C.white, height: 56 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position='start'><I i='mdi:magnify' c={C.quiet} /></InputAdornment> } }} />
        </Box>
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3, color: 'customColors.OnSurfaceVariant' }}>Challans ({list.length})</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {list.slice(0, shown).map(d => {
            const h = holderOf(d.dcNumber), on = pick.includes(d.dcNumber)
            const items = d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean)
            const hits = billItems ? d.lines.filter(l => billItems.has(l.itemId)).length : 0

            return (
              // a challan already on an invoice (Sourav, 2 Nov: "a better way to show that it is linked and has a discrepancy"):
              // greyed, not selectable, no delete; a third line names the invoice, a pill gives its state, and a link opens it
              <Box key={d.dcNumber} onClick={() => { if (!h) setPick(p => (on ? p.filter(x => x !== d.dcNumber) : [...p, d.dcNumber])) }}
                sx={{ display: 'flex', alignItems: 'stretch', borderRadius: '10px', overflow: 'hidden', bgcolor: h ? 'customColors.Background' : 'common.white', cursor: h ? 'default' : 'pointer', transition: 'border-color .15s',
                  border: theme => `1.5px solid ${on ? theme.palette.primary.main : theme.palette.customColors.SurfaceVariant}`,
                  ...(!h && { '&:hover': { borderColor: on ? 'primary.main' : 'customColors.Outline', '& .dc-no': { color: 'primary.dark' } } }) }}>
                <Box sx={{ px: 4, py: 3, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className='dc-no' variant='body1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', transition: 'color .15s' }}>{d.dcNumber}</Typography>
                    <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{fmtDay(d.receivedAt)} · {whOf(s, d.warehouseId)} · {items.slice(0, 2).join(', ')}{items.length > 2 ? ` +${items.length - 2}` : ''}</Typography>
                    {h && <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '6px', flexWrap: 'wrap' }}>
                      <I i='mdi:link-variant' s={16} c={C.quiet} />
                      <Box component='a' href={`/bill-desk/invoice-details?id=${h.id}`} target='_blank' rel='noreferrer' onClick={e => e.stopPropagation()} title='Open this invoice'
                        sx={{ ...T.body, color: C.greenDark, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>On invoice {h.invoiceNo}</Box>
                      <Pill tone={h.match === 'discrepancy' ? 'warn' : 'ok'} icon={h.match === 'discrepancy' ? 'mdi:alert-outline' : 'mdi:check'}>{h.match === 'discrepancy' ? 'With discrepancies' : 'Matched'}</Pill>
                    </Box>}
                  </Box>
                  {h ? null : billItems && hits > 0 && <Pill tone='ok' icon='mdi:robot-outline' title={`${hits} of ${d.lines.length} items are on the bill`}>{hits} of {d.lines.length}</Pill>}
                  <IconButton aria-label={`View ${d.dcNumber}`} size='small' onClick={e => { e.stopPropagation(); onPeek(d.dcNumber) }} sx={{ color: 'customColors.neutralSecondary' }}><I i='mdi:eye-outline' s={20} /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, bgcolor: on ? 'customColors.OnBackground' : h ? 'transparent' : 'customColors.Surface' }}>
                  {h ? <I i='mdi:lock-outline' s={20} c={C.quiet} /> : <Checkbox checked={on} size='small' tabIndex={-1} sx={{ p: 0, pointerEvents: 'none' }} />}
                </Box>
              </Box>
            )
          })}
          {!list.length && <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', textAlign: 'center', py: 6 }}>No challans match.</Typography>}
        </Box>
        {list.length > shown && <Btn kind='ghost' onClick={() => setShown(n => n + PAGE)} sx={{ mt: 2 }}>Show more</Btn>}
      </Box>
      <Box sx={{ p: '16px 24px', flex: 'none', display: 'flex', justifyContent: 'flex-end', gap: '12px', bgcolor: 'common.white' }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind='pri' onClick={() => onApply(pick)}>{added > 0 ? `Add ${added} ${added === 1 ? 'challan' : 'challans'}` : 'Done'}</Btn>
      </Box>
    </Box></Drawer>
  )
}

const InvoiceForm = ({ invoice, vendorId, dcNumber, onClose, onSaved, onSent }) => {
  const s = useBillDesk()
  const taken = takenDcs(s)
  const { settings } = useSettings()
  const navHidden = useMediaQuery(theme => theme.breakpoints.down('lg'))
  const navLeft = navHidden ? 0 : settings.navCollapsed ? themeConfig.collapsedNavigationSize : themeConfig.navigationSize
  // a read that failed is entered by hand here, or sent back with Try again (2 Nov)
  const failedMode = isFailed(invoice)
  const aiMode = invoice?.status === 'to_connect' && !failedMode
  const [f, setF] = useState(() => {
    if (aiMode) {
      const hints = (invoice.ai?.dcHints || []).filter(dc => !taken[dc] || taken[dc] === invoice.id)

      // the clerk connects the challans (Sourav, 2 Nov: "that work user has to do"): the ones printed on the bill are
      // only suggested, none are added for them
      return { id: invoice.id, vendorId: invoice.vendorId, dcNumbers: [], invoiceNo: invoice.invoiceNo, invoiceDate: invoice.invoiceDate, lines: aiLines(s, [], invoice.ai?.lines || []), docs: invoice.docs || [], printed: {} }
    }
    if (invoice) return { id: invoice.id, vendorId: invoice.vendorId, dcNumbers: invoice.dcNumbers, invoiceNo: invoice.invoiceNo, invoiceDate: invoice.invoiceDate, lines: invoice.lines, docs: invoice.docs || [], printed: {} }
    const b = { id: null, vendorId: vendorId || '', dcNumbers: [], invoiceNo: '', invoiceDate: '', lines: [], docs: [], printed: {} }
    if (dcNumber) { b.dcNumbers = [dcNumber]; b.lines = relines(s, [dcNumber], []) }

    return b
  })
  const [view, setView] = useState(null)
  const [peek, setPeek] = useState(null)
  const [finding, setFinding] = useState(false)
  const [tried, setTried] = useState(false)
  const [changing, setChanging] = useState([]) // lines whose DC item the clerk is changing
  const set = patch => setF(x => ({ ...x, ...patch }))
  const relineFor = (dcs, lines) => (aiMode ? aiLines(s, dcs, lines) : relines(s, dcs, lines))

  // DCs a vendor can bill now: free, on this invoice, or held by an invoice with discrepancies still with the clerk
  const holderOf = dc => (taken[dc] && taken[dc] !== f.id ? s.invoices.find(i => i.id === taken[dc]) : null)
  const usable = dc => { const h = holderOf(dc); return !h || (h.match === 'discrepancy' && ['draft', 'returned_to_clerk'].includes(h.status)) }
  const vendors = useMemo(() => s.vendors.filter(v => v.id === f.vendorId || s.dcs.some(d => d.vendorId === v.id && usable(d.dcNumber))), [s, f.vendorId]) // eslint-disable-line react-hooks/exhaustive-deps
  const vDcs = s.dcs.filter(d => d.vendorId === f.vendorId && (f.dcNumbers.includes(d.dcNumber) || usable(d.dcNumber)))
  const inv = { ...f, id: f.id || '__new__' }
  const m = matchOf(inv), c = computedOf(inv)
  const dup = dupOf(inv, s.invoices)
  const blocks = saveBlocks(inv, s.invoices, { ...taken, ...Object.fromEntries(f.dcNumbers.map(dc => [dc, inv.id])) })
  const discOf = l => m.discrepancies.find(d => d.itemId === l.itemId && l.itemId)
  // a bill line still to be paired isn't a discrepancy yet: it blocks Submit until the clerk picks its DC item
  const nDisc = m.discrepancies.filter(d => d.itemId).length
  const nBill = f.lines.filter(l => !l.notOnBill).length
  const nReview = f.lines.filter(l => !l.notOnBill && (!l.itemId || (l.unsure || []).length)).length
  const setDcs = next => set({ dcNumbers: next, lines: relineFor(next, f.lines) })
  const setLine = (i, patch) => setF(x => ({ ...x, lines: x.lines.map((l, k) => (k === i ? { ...l, ...patch, unsure: (l.unsure || []).filter(u => !(u in patch)) } : l)) }))
  const pairLine = (i, itemId) => setF(x => ({ ...x, lines: aiLines(s, x.dcNumbers, x.lines.map((l, k) => (k === i ? { ...l, itemId, guessItemId: itemId } : l))) }))
  const freeFromHolder = h => {
    if (!window.confirm(`Delete ${h.id} (${h.invoiceNo}, with discrepancies)? Its DCs become free to bill on this invoice.`)) return
    tryRun(toast, () => deleteInvoice(h.id), `${h.id} deleted`)
  }
  const canSendAi = !f.id && f.dcNumbers.length === 0
  const trySend = () => {
    if (dup) { toast.error(`Invoice ${f.invoiceNo.trim()} is already recorded as ${dup.id}`); return }
    if (!f.invoiceNo.trim() || !f.docs.length) { setTried(true); toast.error(!f.invoiceNo.trim() ? 'Enter the invoice number' : 'Attach the invoice'); return }
    const id = tryRun(toast, () => sendToAi(f), () => 'Antz AI is reading this invoice.')
    if (id) onSent?.(id)
  }
  const trySave = () => {
    if (blocks.length) { setTried(true); toast.error(blocks[0]); return }
    const id = tryRun(toast, () => saveInvoiceForm({ ...f, id: f.id }), x => (aiMode ? `${x} connected` : `Saved as ${x}`))
    if (id) onSaved?.(id)
  }

  // suggestions (read by the AI): the vendor's DCs that carry an item the bill lists but no added DC has
  const want = new Set(f.lines.filter(l => !l.notOnBill && !l.receivedQty).map(l => l.itemId || l.guessItemId).filter(Boolean))
  // suggestions: first the challans printed on the bill, then others carrying an item the bill lists
  const free = d => !f.dcNumbers.includes(d.dcNumber) && !holderOf(d.dcNumber)
  const printedDcs = aiMode ? (invoice.ai?.dcHints || []).map(dc => s.dcsBy[dc]).filter(d => d && d.vendorId === f.vendorId && free(d)) : []
  // manual entry suggests too, once the vendor is picked (Sourav, 2 Nov): that vendor's challans still to bill, the
  // latest received up to the invoice date first
  const upto = f.invoiceDate ? `${f.invoiceDate}T23:59` : '9999'
  const manualDcs = !aiMode && f.vendorId ? vDcs.filter(d => free(d) && d.receivedAt <= upto).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)) : []
  const suggested = aiMode ? [...printedDcs, ...vDcs.filter(d => free(d) && !printedDcs.includes(d) && d.lines.some(l => want.has(l.itemId)))].slice(0, 4) : manualDcs.slice(0, 3)
  const billItems = aiMode ? new Set(f.lines.filter(l => !l.notOnBill).map(l => l.itemId || l.guessItemId)) : null
  const dcItems = [...new Map(f.dcNumbers.flatMap(dc => s.dcsBy[dc]?.lines || []).map(l => [l.itemId, l])).values()]
  const vendor = vendorOf(s, f.vendorId)
  const priced = f.dcNumbers.length > 0 // match shows as soon as challans are in; rates are optional
  const totals = aiMode ? totalsOf(invoice.ai?.printed, f.lines) : null
  const tryAgain = () => { if (tryRun(toast, () => retryAi(invoice.id), 'Antz AI is reading this invoice again.')) onSent?.(invoice.id) }
  const title = aiMode || failedMode ? 'Invoice details' : f.id ? `Edit ${f.id}` : 'Add invoice' // the page is named, not the number (2 Nov)
  // the challan card (Sourav, 2 Nov: "Document placeholder", option B of docs/mock/challan-card-compact.html): a drawn page
  // with a folded corner in place of the paper picture, the number, "n items · area" and "date · receiver", view and
  // remove. No item lines: section 3 lists them, and the eye opens the goods receipt. A suggestion is dashed, with Add.
  const dcRow = (d, extra) => {
    const n = d.lines.length
    const quiet = { color: 'customColors.neutralSecondary' }

    return (
      <Box key={d.dcNumber} sx={{ display: 'flex', alignItems: 'center', gap: '16px', p: '14px 8px 14px 16px', borderRadius: '12px', bgcolor: 'common.white',
        border: theme => `1px ${extra.dashed ? 'dashed' : 'solid'} ${extra.dashed ? theme.palette.customColors.OutlineVariant : theme.palette.customColors.SurfaceVariant}`,
        transition: 'border-color .15s', '&:hover': { borderColor: 'customColors.Outline' } }}>
        <PagePlaceholder onClick={() => setPeek(d.dcNumber)} label={`Open ${d.dcNumber}`} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant='subtitle1' noWrap sx={{ fontWeight: 600, lineHeight: 1.4, color: 'customColors.OnSurfaceVariant' }}>{d.dcNumber}</Typography>
          <Typography variant='body2' noWrap sx={quiet}>{n} {n === 1 ? 'item' : 'items'} · {whOf(s, d.warehouseId)}</Typography>
          <Typography variant='body2' noWrap sx={quiet}>{extra.why || `${fmtDay(d.receivedAt)} · ${d.receivedBy || 'received'}`}</Typography>
        </Box>
        <IconButton aria-label={`View ${d.dcNumber}`} size='small' onClick={() => setPeek(d.dcNumber)} sx={quiet}><I i='mdi:eye-outline' s={20} /></IconButton>
        {extra.add
          ? <Btn kind='ghost' icon='mdi:plus' onClick={() => setDcs([...f.dcNumbers, d.dcNumber])}>Add</Btn>
          : <IconButton aria-label={`Remove ${d.dcNumber}`} size='small' onClick={() => setDcs(f.dcNumbers.filter(x => x !== d.dcNumber))} sx={quiet}><I i='mdi:close' s={20} /></IconButton>}
      </Box>
    )
  }
  // three to a row at every width; the invoice document block takes one of the same columns, so the two line up (2 Nov)
  const DC_GRID = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }
  const TH = { bgcolor: C.tableHead, color: C.text, ...T.bodyMedium, height: 48, px: '10px', textAlign: 'left', whiteSpace: 'nowrap' }

  return (
    <Page contained={false} crumb={['Bill Desk', aiMode || failedMode ? 'Invoiced' : 'Delivery challans', aiMode || failedMode ? 'Invoice details' : title]} // the crumb names the page, not the invoice number (2 Nov)
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
            <TextField select label='Vendor*' value={f.vendorId} disabled={!!f.id && !aiMode && !failedMode} onChange={e => set({ vendorId: e.target.value, dcNumbers: [], lines: [] })} fullWidth error={tried && !f.vendorId}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, renderValue: v => vendorOf(s, v)?.name || <Txt t='minor' c={C.quiet}>Pick the vendor on the bill</Txt> } }}>
              {vendors.map(v => { const n = s.dcs.filter(d => d.vendorId === v.id && usable(d.dcNumber)).length; return (
                <MenuItem key={v.id} value={v.id} sx={{ display: 'flex', gap: 4 }}><Box component='span' sx={{ flex: 1 }}>{v.name}</Box><Txt t='body' c={C.quiet}>{n} {n === 1 ? 'DC' : 'DCs'} to bill</Txt></MenuItem>
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

        <Card n={2} title='Challans' act={f.dcNumbers.length > 0 && <Btn kind='ghost' icon='mdi:plus' onClick={() => setFinding(true)}>Add challans</Btn>}>
          {f.dcNumbers.length
            ? <Box sx={DC_GRID}>{f.dcNumbers.map(dc => s.dcsBy[dc] && dcRow(s.dcsBy[dc], { onBill: aiMode && invoice.ai?.dcHints?.includes(dc) }))}</Box>
            : <Box sx={{ minHeight: 150, bgcolor: C.n05, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', px: 4, ...(tried && !canSendAi && { boxShadow: `0 0 0 1px ${C.error}` }) }}>
                {/* the compliance empty box; Add challans shows once the vendor is picked, since the list is that vendor's (2 Nov) */}
                <I i='mdi:truck-outline' s={36} c={C.quiet} />
                <Typography sx={{ color: 'customColors.neutralSecondary', fontWeight: 500, fontSize: '1rem' }}>No challans added</Typography>
                {f.vendorId && <Btn icon='mdi:plus' onClick={() => setFinding(true)} sx={{ height: 40 }}>Add challans</Btn>}
              </Box>}
          {suggested.length > 0 && <>
            <Txt t='bodyTitle' c={C.text} sx={{ display: 'block', mt: '16px', mb: '8px' }}>Suggested</Txt>
            <Box sx={DC_GRID}>{suggested.map(d => dcRow(d, { dashed: true, add: true, why: !aiMode ? undefined : printedDcs.includes(d) ? 'Printed on the bill' : `Has ${d.lines.filter(l => want.has(l.itemId)).map(l => itemOf(s, l.itemId)?.name).join(', ')}` }))}</Box>
          </>}
        </Card>

        </Box>

        {/* Items in a container of their own (Sourav, 2 Nov: "split items into a separate section in the form") */}
        {/* the items are the bill's, so an invoice Antz AI read shows them before any challan is added; adding challans
            is the clerk's call and only pairs them (Sourav, 2 Nov) */}
        {(f.dcNumbers.length > 0 || (aiMode && f.lines.length > 0)) && <Box sx={{ bgcolor: C.white, borderRadius: '12px' }}>
          <Card n={3} title='Items' count={f.lines.length} act={aiMode && <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  const d = discOf(l), lc = lineCalc(l), u = unitOf(s, l.unitId), it = itemOf(s, l.itemId), uns = l.unsure || []
                  const name = <Txt t='minorMedium' c={l.notOnBill ? C.quiet : C.black} sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.billName || it?.name}>{aiMode ? (l.notOnBill ? 'Not on the bill' : l.billName) : it?.name}</Txt>
  
                  return (
                    <Box component='tr' key={`${l.itemId || l.billName}-${i}`} sx={{ bgcolor: d ? C.tert20 : 'transparent' }}>
                      <td>
                        {aiMode ? <Box sx={{ minWidth: 0 }}>
                          {name}
                          {/* one item column (2 Nov): the name as read from the bill, the DC item it is paired with under it in grey;
                              the picker shows only when the line is unpaired or the clerk asks to change it */}
                          {!l.notOnBill && (l.itemId && !changing.includes(i)
                            ? <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '2px' }}>
                                <Txt t='body' c={C.quiet} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>DC item: {it?.name}</Txt>
                                <ButtonBase onClick={() => setChanging(x => [...x, i])} sx={{ ...T.bodyMedium, color: C.greenDark, borderRadius: '4px', px: '4px' }}>Change</ButtonBase>
                              </Box>
                            : f.dcNumbers.length === 0
                              ? null // no challans yet: Received shows — on every line, so no note repeats on each row
                              : <Box sx={{ mt: '8px', maxWidth: 320 }}><TextField select size='small' value={l.itemId || ''} onChange={e => { pairLine(i, e.target.value); setChanging(x => x.filter(k => k !== i)) }} fullWidth error={tried && !l.itemId}
                            sx={{ '& .MuiInputBase-root': { height: 40, bgcolor: C.white }, ...(!l.itemId && !tried && { '& .MuiInputBase-root': { height: 40, bgcolor: REV_BG }, '& .MuiOutlinedInput-notchedOutline': { borderColor: `${REV_LINE} !important` } }) }}
                            slotProps={{ select: { displayEmpty: true, renderValue: v => (v ? itemOf(s, v)?.name : 'Pick the DC item') } }}>
                            {[...dcItems].sort((a, b) => (scoreOf(l, b.itemId) || 0) - (scoreOf(l, a.itemId) || 0)).map(x => <MenuItem key={x.itemId} value={x.itemId} sx={{ display: 'flex', gap: 4 }}>
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
              </tbody>
            </Box>
          </Card>
        </Box>}

        {/* the foot of the form: total and the one action (Send to Antz AI until DCs are added) */}
        {/* fixed to the bottom edge of the window, across the content beside the menu (Sourav, 2 Nov) */}
        <Box sx={{ position: 'fixed', bottom: 0, right: 0, left: navLeft, zIndex: 1100, bgcolor: C.white, borderTop: `1px solid ${C.surfaceVariant}`, boxShadow: theme => `0 -4px 16px ${theme.palette.customColors.shadowColor}`, p: '14px 48px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {(f.dcNumbers.length > 0 || (aiMode && f.lines.length > 0)) && <>
            <Txt t='minorMedium' c={C.text}>Total</Txt>
            <Txt sx={{ fontSize: 24, fontWeight: 600 }} c={C.black}>{inr(c.total)}</Txt>
            {priced && (nDisc === 0 ? <Pill tone='ok' icon='mdi:check'>Matched</Pill> : <Pill tone='warn' icon='mdi:alert-outline'>{nDisc} {nDisc === 1 ? 'discrepancy' : 'discrepancies'}</Pill>)}
          </>}
          <Box sx={{ flex: 1 }} />
          <Btn onClick={onClose}>Cancel</Btn>
          {/* Send to Antz AI appears once the paper is attached and goes when the first DC is added (Sourav, 1 Nov) */}
          {canSendAi && f.docs.length > 0 && <Btn icon='mdi:robot-outline' onClick={trySend} disabled={!!dup} sx={{ color: 'customColors.addPrimary', borderColor: 'customColors.addPrimary', '&:hover': { borderColor: 'customColors.addPrimary', bgcolor: 'customColors.antzSecondaryBg' }, '&.Mui-disabled': { color: 'action.disabled', borderColor: 'action.disabledBackground' } }}>Send to Antz AI</Btn>}
          {/* the main action is always there, grey until the form can be saved (Sourav, 2 Nov) */}
          <Btn kind='pri' icon={aiMode ? 'mdi:check' : 'mdi:content-save-outline'} disabled={blocks.length > 0 || f.dcNumbers.length === 0} onClick={trySave}>{aiMode ? 'Submit' : 'Save invoice'}</Btn>
        </Box>
      </Box>

      {finding && <FindDcs s={s} open vendorName={vendor?.name} onClose={() => setFinding(false)} dcs={vDcs} chosen={f.dcNumbers} invoiceDate={f.invoiceDate} billItems={billItems}
        holderOf={holderOf} onFree={freeFromHolder} onPeek={setPeek} onApply={next => { setDcs(next); setFinding(false) }} />}
      {view != null && <DocViewer docs={f.docs} index={view} onClose={() => setView(null)} side={aiMode ? <ReadPanel s={s} lines={f.lines} printed={invoice.ai?.printed} totals={totals} /> : null} />}
      {peek && <ChallanSheet dc={peek} onClose={() => setPeek(null)} />}
    </Page>
  )
}

export default InvoiceForm
