// One delivery challan as a sheet over the list: Naveen's goods-receipt screen, one to one (Sourav, 31 Oct: "use the
// same screen that Naveen has"). Header with the tile, the number as a chip, the stage, History and the Bill Desk
// action (Add invoice when free, Open the invoice when on one; Edit and the print buttons are his, not ours). Left,
// the Products table with batch, expiry, containers and the quantities. Right, his cards: Delivery, Attachments,
// Vehicle, then a Bill Desk card with the stamp and where the DC is now. Fields the snapshot lacks come from
// seed/extras.js and are shown as present until the refresh step pulls the real ones.
import { useState } from 'react'
import { Box, ButtonBase, Dialog, IconButton } from '@mui/material'
import { DocViewer } from '../ui/DocTiles'
import { challanSvg } from '../sample'
import CommonDialogBox from 'src/components/CommonDialogBox'
import { useBillDesk, vendorOf, itemOf, unitOf, whOf } from '../store'
import { takenDcs } from '../flow'
import { extrasOf } from '../seed/extras'
import { fmtAt } from '../logic'
import { C, T, Txt, I, Btn } from '../ui/ui'
import { Pill, StagePill, Grid, Stamp, SignedDc, AddBtn } from '../ui/parts'
import { statusPill } from './Invoice'
import ItemThumb from '../ui/ItemThumb'

const REASON = { SHORT_SUPPLY: 'Short supply', REJECTED: 'Rejected', EXCESS: 'Excess', OTHER: 'Other' }
const PANEL = '#F3F7F5'
// Naveen's date form: 05-Oct-26, 7:28 AM
const fmtNav = iso => { if (!iso) return '—'; const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleDateString('en-GB', { month: 'short' })}-${String(d.getFullYear()).slice(2)}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` }
const fmtDayNav = iso => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—')

// a section below the table: 10px corners, OutlineVariant border, white, all three the same height (Sourav, 31 Oct); title 16/600; rows with a 40px icon tile, label over value, hairlines between
const Section = ({ title, badge, children }) => (
  <Box sx={{ borderRadius: '12px', bgcolor: C.white, p: '4px 16px 8px', boxSizing: 'border-box' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}><Txt t='minorTitle' c={C.text}>{title}</Txt>{badge}</Box>
    <Box sx={{ '& > * + *': { borderTop: `1px solid ${C.n10}` } }}>{children}</Box>
  </Box>
)
const Tile = ({ icon, color = C.text, children }) => children || <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: C.white, border: `1px solid ${C.n05}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}><I i={icon} s={20} c={color} /></Box>
const Row = ({ icon, color, tile, label, children, sub }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '8px' }}>
    <Tile icon={icon} color={color}>{tile}</Tile>
    <Box sx={{ minWidth: 0 }}>
      <Txt t='sub' c={C.quiet} sx={{ display: 'block', mb: '2px' }}>{label}</Txt>
      <Box sx={{ ...T.bodyMedium, fontSize: 14, color: C.ink, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{children}</Box>
      {sub && <Txt t='sub' c={C.quiet} sx={{ display: 'block', mt: '2px' }}>{sub}</Txt>}
    </Box>
  </Box>
)
const Plate = ({ no }) => <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: '#2b2b2b', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Box sx={{ bgcolor: '#f5e6a3', color: '#222', fontSize: 7, fontWeight: 700, px: '4px', borderRadius: '2px', letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.3 }}>{no.replace(/^(KA)(\d\d)(\D+)(\d+)$/, '$1 $2 $3\n$4').split('\n').map((p, i) => <div key={i}>{p}</div>)}</Box></Box>
const GateThumb = () => <Box sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${C.n10}`, bgcolor: C.white, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Box component='svg' viewBox='0 0 40 40' sx={{ width: 32, height: 32 }}><rect x='6' y='4' width='28' height='32' fill='#fff' stroke='#999' /><rect x='10' y='9' width='12' height='2' fill='#555' /><rect x='10' y='14' width='20' height='1.5' fill='#aaa' /><rect x='10' y='18' width='20' height='1.5' fill='#aaa' /><rect x='10' y='22' width='14' height='1.5' fill='#aaa' /><rect x='10' y='26' width='20' height='1.5' fill='#aaa' /><rect x='10' y='30' width='9' height='1.5' fill='#aaa' /></Box></Box>

// what happened to this DC in Bill Desk: the receipt, then every trail event on an invoice that names it
const historyOf = (s, d) => {
  const rows = [{ at: d.receivedAt, by: d.receivedBy, what: `Received at ${whOf(s, d.warehouseId)} · Diet & Kitchen` }]
  s.invoices.forEach(inv => { if (inv.dcNumbers.includes(d.dcNumber)) inv.trail.forEach(e => rows.push({ at: e.at, by: e.by, what: `${e.action} · ${inv.id}${e.note ? ` · ${e.note}` : ''}` })) })

  return rows.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}

// a value that opens something, as Naveen's text links in the goods receipt (2 Nov)
const Link = ({ onClick, children }) => (
  <ButtonBase onClick={onClick} sx={{ font: 'inherit', color: 'primary.dark', textAlign: 'left', borderRadius: '4px', '&:hover': { textDecoration: 'underline' } }}>{children}</ButtonBase>
)
const gateSvg = (d, label) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" font-family="Courier New, monospace" font-size="13" fill="#222"><rect width="600" height="420" fill="#F7F7F2"/><text x="40" y="48" font-size="18" font-weight="bold">GATE ENTRY SHEET</text><text x="40" y="74">${label}</text><line x1="40" y1="96" x2="560" y2="96" stroke="#222"/>${[0, 1, 2, 3, 4, 5].map(i => `<line x1="40" y1="${130 + i * 40}" x2="560" y2="${130 + i * 40}" stroke="#bbb"/>`).join('')}<text x="40" y="122">${d.dcNumber}</text><text x="40" y="400" font-size="11" fill="#666">Security · sample sheet</text></svg>`)}`

const ChallanSheet = ({ dc, onClose, onAddInvoice, onOpenInvoice }) => {
  const s = useBillDesk()
  const [hist, setHist] = useState(false)
  // clicks from Naveen's goods receipt (Sourav, 2 Nov): a file opens the paper, the vehicle opens the truck visit, a
  // product row opens its detail; another challan on the truck opens in this same sheet
  const [cur, setCur] = useState(dc)
  const [paper, setPaper] = useState(null)
  const [truck, setTruck] = useState(false)
  const [lineOpen, setLineOpen] = useState(null)
  const d = cur ? s.dcsBy[cur] : null
  if (!d) return null
  const vendor = vendorOf(s, d.vendorId)
  const inv = s.invoices.find(i => i.id === takenDcs(s)[d.dcNumber])
  const x = extrasOf(d)
  const docs = [
    { id: 'recv', kind: 'challan', name: x.receivingFile.name, type: 'image/svg+xml', url: challanSvg({ ...d, signedDc: false }, s), by: d.receivedBy, at: d.receivedAt },
    ...(x.signedFile ? [{ id: 'signed', kind: 'challan', name: x.signedFile.name, type: 'image/svg+xml', url: challanSvg(d, s), by: d.receivedBy, at: d.receivedAt }] : []),
    { id: 'gate', kind: 'gate', name: x.gateSheet.label, type: 'image/svg+xml', url: gateSvg(d, x.gateSheet.label), by: x.visit.enteredBy, at: x.visit.enteredAt }
  ]
  const openPaper = id => setPaper(docs.findIndex(p => p.id === id))
  const day = d.receivedAt.slice(0, 10)
  const onTruck = s.dcs.filter(o => o.receivedAt.slice(0, 10) === day && extrasOf(o).visit.vehicleNo === x.visit.vehicleNo)
  const qty = (n, u) => `${Math.round((n || 0) * 100) / 100} ${unitOf(s, u)}`
  const rows = d.lines.map((l, i) => ({ ...l, ...x.lines[i], id: i }))
  const rejected = d.lines.filter(l => l.rejectedQty > 0).length
  const cols = [
    { key: 'item', label: 'Product', flex: 2, minWidth: 180, render: l => <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}><ItemThumb item={itemOf(s, l.itemId)} size={40} /><Box sx={{ minWidth: 0 }}><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{itemOf(s, l.itemId)?.name || l.itemId}</Txt><Txt t='sub' c={C.quiet}>{l.itemId.replace(/^pi-/, '')}</Txt></Box></Box> },
    { key: 'batch', label: 'Batch', nowrap: true, width: 112, render: l => l.batchNo },
    { key: 'cont', label: 'Cont', width: 76, render: l => l.containers },
    { key: 'ch', label: 'Challan', align: 'right', width: 108, render: l => qty(l.challanQty, l.unitId) },
    { key: 'rec', label: 'Received', align: 'right', width: 108, render: l => <Txt t='bodyMedium'>{qty(l.receivedQty, l.unitId)}</Txt> },
    { key: 'rej', label: 'Rejected', align: 'right', width: 108, render: l => (l.rejectedQty ? <Txt c={C.tert}>{qty(l.rejectedQty, l.unitId)}</Txt> : <Txt c={C.quiet}>{qty(0, l.unitId)}</Txt>) },
  ]

  return (
    <>
    <CommonDialogBox dialogBoxStatus dialogWithMaxWidth padding={0} close={onClose} title='' paperSx={{ width: 'min(1360px, calc(100vw - 64px))', maxWidth: 'none' }}
      formComponent={
        <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 96px)' }}>
          {/* the Inventory window's header: 72px, title 20/500, actions, close */}
          <Box sx={{ height: 72, flex: 'none', display: 'flex', alignItems: 'center', gap: '12px', px: 6, borderBottom: `1px solid ${C.n05}` }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: C.tint, display: 'grid', placeItems: 'center' }}><I i='mdi:truck-check-outline' s={22} c={C.greenDark} /></Box>
            <Txt sx={{ fontSize: 20, fontWeight: 500, lineHeight: '24px' }} c={C.text}>Goods receipt</Txt>
            <Box sx={{ bgcolor: C.n05, color: C.ink, ...T.minorMedium, px: '10px', py: '4px', borderRadius: '6px' }}>{d.dcNumber}</Box>
            {inv ? statusPill(inv) : <StagePill label='To Bill' />}
            <Box sx={{ flex: 1 }} />
            <Btn icon='mdi:history' onClick={() => setHist(true)} sx={{ height: 40 }}>History</Btn>
            {inv
              ? onOpenInvoice && <Btn kind='pri' icon='mdi:receipt-text-outline' onClick={() => onOpenInvoice(inv.id)} sx={{ height: 40 }}>Open {inv.invoiceNo || inv.id}</Btn>
              : onAddInvoice && <Btn kind='pri' icon='mdi:plus' onClick={() => onAddInvoice(d)} sx={{ height: 40 }}>Add invoice</Btn>}
            <IconButton aria-label='Close' onClick={onClose} sx={{ p: 0, ml: '4px', color: 'customColors.OnSurfaceVariant' }}><I i='mdi:close' s={24} /></IconButton>
          </Box>

          {/* the Antz background behind white containers: the products table and the three boxes (Sourav, 2 Nov: "too white") */}
          {/* products left, the facts in a 340px column on the right, as Naveen splits his goods-receipt edit screen (Sourav,
              2 Nov: a 20-line challan pushed the facts a screen down). Only the products side scrolls */}
          <Box sx={{ flex: 1, minHeight: 0, p: '20px 24px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '16px', bgcolor: 'customColors.Background' }}>
            <Box sx={{ minHeight: 0, overflowY: 'auto', bgcolor: C.white, borderRadius: '12px', p: '16px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '12px' }}>
                <I i='mdi:package-variant-closed' c={C.text} /><Txt t='minorTitle' c={C.text} sx={{ flex: 1 }}>Products · {d.lines.length}</Txt>
                {rejected > 0 && <Pill tone='warn'>{rejected} {rejected === 1 ? 'line' : 'lines'} with rejected quantity</Pill>}
              </Box>
              <Box sx={{ flex: 'none', display: 'flex', flexDirection: 'column', '& > *': { height: 'auto !important', flex: 'none !important' } }}><Grid cols={cols} rows={rows} paginate={false} empty='No lines on this challan' onRow={l => setLineOpen(o => (o === l.id ? null : l.id))} /></Box>
              {lineOpen != null && rows[lineOpen] && (() => { const l = rows[lineOpen], per = l.containers ? Math.round(((l.receivedQty || 0) / l.containers) * 100) / 100 : 0; return (
                <Box sx={{ mt: '12px', p: '12px 16px', borderRadius: '10px', bgcolor: 'customColors.Background', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <Txt t='bodyTitle' c={C.text}>{itemOf(s, l.itemId)?.name}</Txt>
                  <Txt c={C.text}>Batch {l.batchNo}</Txt>
                  <Txt c={C.text}>{l.expiry ? `Expires ${fmtDayNav(l.expiry)}` : 'No expiry tracked'}</Txt>
                  <Txt c={C.text}>{l.containers} {l.containers === 1 ? 'container' : 'containers'} × {per} {unitOf(s, l.unitId)}</Txt>
                  {l.rejectedQty > 0 && <Txt c={C.tert}>Rejected {qty(l.rejectedQty, l.unitId)}{l.returnReason ? ` · ${REASON[l.returnReason] || l.returnReason}` : ''}</Txt>}
                  <Box sx={{ flex: 1 }} /><IconButton aria-label='Close detail' size='small' onClick={() => setLineOpen(null)}><I i='mdi:close' s={18} /></IconButton>
                </Box>) })()}
            </Box>

            <Box sx={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inv && <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', p: '12px 16px', borderRadius: '10px', bgcolor: C.tint }}>
              <I i='mdi:receipt-text-outline' c={C.greenDark} /><Txt c={C.ink}>On invoice <b>{inv.invoiceNo}</b> · {inv.id}</Txt>{statusPill(inv)}
            </Box>}
              <Section title='Attachments'>
                <Row icon='mdi:file-document-outline' label='Filed at receiving' sub={`${(x.receivingFile.sizeKb / 1024).toFixed(1)} MB`}><Link onClick={() => openPaper('recv')}>{x.receivingFile.name}</Link></Row>
                {x.signedFile
                  ? <Row tile={<Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Stamp size={40} /></Box>} label='Signed DC' sub={`${x.signedFile.name} · ${(x.signedFile.sizeKb / 1024).toFixed(1)} MB`}><Link onClick={() => openPaper('signed')}>Signed, sealed, delivered</Link></Row>
                  : <Row icon='mdi:file-sign' color={C.error} label='Signed DC' sub='not in Diet & Kitchen · can be billed with a flag'><SignedDc signed={false} /></Row>}
                <Row tile={<GateThumb />} label='From the gate (security)'><Link onClick={() => openPaper('gate')}>{x.gateSheet.label}</Link></Row>
              </Section>
              <Section title='Vehicle'>
                <Row tile={<Plate no={x.visit.vehicleNo} />} label='Vehicle' sub={onTruck.length > 1 ? `${onTruck.length} challans on this truck` : null}><Link onClick={() => setTruck(true)}>{x.visit.vehicleNo} · {x.visit.visitRef}</Link></Row>
                <Row icon='mdi:account-outline' label='Driver'>{x.visit.driverName} · {x.visit.driverPhone}</Row>
                <Row icon='mdi:swap-horizontal' label='At the gate' sub={`by ${x.visit.enteredBy}`}>{fmtNav(x.visit.enteredAt).split(', ')[1]} in · {fmtNav(x.visit.exitedAt).split(', ')[1]} out</Row>
              </Section>
              <Section title='Delivery'>
                <Row icon='mdi:storefront-outline' label='Vendor' sub={vendor?.gstin ? `GSTIN ${vendor.gstin}` : null}>{vendor?.name}</Row>
                <Row icon='mdi:calendar-clock-outline' label='Received' sub={`by ${d.receivedBy}`}>{fmtNav(d.receivedAt)}</Row>
                <Row icon='mdi:warehouse' label='Warehouse'>{whOf(s, d.warehouseId)}</Row>
              </Section>
            </Box>
          </Box>
        </Box>
      } />

      {paper != null && paper >= 0 && <DocViewer docs={docs} index={paper} onClose={() => setPaper(null)} />}
      <Dialog open={truck} onClose={() => setTruck(false)} maxWidth='md' fullWidth slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
        <Box sx={{ p: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${C.n10}` }}>
          <Txt t='medium' c={C.text} sx={{ flex: 1 }}>Truck visit · {x.visit.vehicleNo} · {x.visit.visitRef}</Txt>
          <IconButton aria-label='Close' onClick={() => setTruck(false)}><I i='mdi:close' s={22} /></IconButton>
        </Box>
        <Box sx={{ p: '8px 24px 20px' }}>
          <Txt c={C.quiet} sx={{ display: 'block', py: '10px' }}>{x.visit.driverName} · {x.visit.driverPhone} · in {fmtNav(x.visit.enteredAt).split(', ')[1]}, out {fmtNav(x.visit.exitedAt).split(', ')[1]}</Txt>
          {onTruck.map(o => (
            <ButtonBase key={o.dcNumber} onClick={() => { setCur(o.dcNumber); setTruck(false); setLineOpen(null) }} sx={{ width: '100%', display: 'grid', gridTemplateColumns: '180px 1fr 120px 90px', gap: '16px', textAlign: 'left', py: '12px', px: '8px', borderRadius: '8px', borderBottom: `1px solid ${C.n10}`, '&:hover': { bgcolor: C.panel } }}>
              <Txt t='bodyTitle' c={o.dcNumber === d.dcNumber ? C.greenDark : C.ink}>{o.dcNumber}</Txt><Txt c={C.text}>{vendorOf(s, o.vendorId)?.name}</Txt><Txt c={C.quiet}>{fmtNav(o.receivedAt).split(', ')[1]}</Txt><Txt c={C.quiet}>{o.lines.length} {o.lines.length === 1 ? 'item' : 'items'}</Txt>
            </ButtonBase>
          ))}
        </Box>
      </Dialog>
      <Dialog open={hist} onClose={() => setHist(false)} maxWidth='md' fullWidth slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
        <Box sx={{ p: '20px 24px', borderBottom: `1px solid ${C.n10}` }}><Txt t='medium' c={C.text}>History · {d.dcNumber}</Txt></Box>
        <Box sx={{ p: '8px 24px 20px' }}>
          {historyOf(s, d).map((r, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '180px 160px 1fr', gap: '16px', py: '12px', borderBottom: `1px solid ${C.n10}` }}>
              <Txt c={C.quiet}>{fmtAt(r.at)}</Txt><Txt c={C.text}>{r.by}</Txt><Txt c={C.ink}>{r.what}</Txt>
            </Box>
          ))}
        </Box>
        <Box sx={{ p: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end' }}><Btn onClick={() => setHist(false)}>Close history</Btn></Box>
      </Dialog>
    </>
  )
}

export default ChallanSheet
