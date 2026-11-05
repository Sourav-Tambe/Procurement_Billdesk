// One invoice as a centred modal over the Invoiced list (first a side sheet) (Sourav, 2 Nov: "when I click these rows, show a sidesheet,
// and edit can be an option that will give me to edit it, and in menu have an option to delete"). Read-only: the
// header names the Bill Desk and invoice numbers with the match state; Edit opens the form; the ⋮ menu holds Delete.
// Body on the Antz background with white containers: the totals, the items with received against billed, the
// challans, and the attached documents.
import { useState } from 'react'
import { Box, Button, Card, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CommonDialogBox from 'src/components/CommonDialogBox'
import { useBillDesk, vendorOf, itemOf, unitOf, whOf, grnOf } from '../store'
import { computedOf, fmtDay, fmtAt, inr, r2, lineTakenMap, grnBilled, grnInvoiceIds } from '../logic'
import { C, T, I, Btn, Txt } from '../ui/ui'
import { Page, Pill, StagePill, Grid } from '../ui/parts'
import ItemThumb from '../ui/ItemThumb'
import DocViewRow from '../ui/DocViewRow'
import InvoicePipeline from '../ui/InvoicePipeline'
import { GrnSheet } from './GrnDesk'
import { DocViewer } from '../ui/DocTiles'
import PdfFileCard from '../ui/PdfFileCard'
import { ActivityRail, ActivitySheet } from '../ui/ActivityRail'

const Box2 = ({ title, count, children }) => (
  <Box sx={{ bgcolor: 'common.white', borderRadius: '12px', p: '16px' }}>
    <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', mb: '12px' }}>
      {title}{count != null && <Box component='span' sx={{ ml: '8px', fontWeight: 400, color: 'customColors.neutralSecondary' }}>({count})</Box>}
    </Typography>
    {children}
  </Box>
)
const Fact = ({ label, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', display: 'block' }}>{label}</Typography>
    <Typography variant='body2' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }} noWrap>{children}</Typography>
  </Box>
)

const ROLE = { clerk: 'Accounts clerk', head: 'Bill Desk head', finance: 'Finance' }
const initials = n => String(n || '').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase()

const InvoiceSheet = ({ id, onClose, onEdit, onDelete, onPeekDc, page = false, actions = null, crumb = 'Invoices' }) => {
  const s = useBillDesk()
  const [menu, setMenu] = useState(null)
  const [view, setView] = useState(null)
  const [all, setAll] = useState(false) // the Activity side sheet
  const [grnOpen, setGrnOpen] = useState(false) // the GRN side sheet (5 Nov: "GRN there on click should open sidesheet")
  const inv = s.invoices.find(i => i.id === id)
  if (!inv) return null
  const c = computedOf(inv)
  const disc = inv.match === 'discrepancy'
  const discOf = itemId => (inv.discrepancies || []).find(d => d.itemId === itemId)

  // the body, shared by the page and the modal: facts, items, challans and documents, each a white container
  const itemsTable = withTotal => (
        <Box sx={{ '& > *': { height: 'auto !important' } }}>
          <Grid paginate={false} rows={inv.lines.map((l, k) => ({ ...l, _k: k }))} rowKey={l => l._k} empty='No items'
            totalRow={withTotal ? { item: <Txt t='bodyTitle' c={C.ink}>Invoice total</Txt>, amt: <Txt t='bodyTitle' c={C.ink}>{inr(c.total)}</Txt> } : undefined} cols={[
            { key: 'item', label: 'Item', flex: 2, minWidth: 220, render: l => { const d = discOf(l.itemId), u = unitOf(s, l.unitId); return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <ItemThumb item={itemOf(s, l.itemId)} size={40} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Txt t='bodyTitle' c={C.black}>{itemOf(s, l.itemId)?.name || l.itemId}</Txt>
                    {d && (d.kind === 'more' || d.kind === 'less') && <Pill tone='warn'>{d.kind === 'more' ? '+' : '−'}{r2(Math.abs(d.billed - d.received))} {u}</Pill>}
                  </Box>
                  {d && d.kind !== 'more' && d.kind !== 'less' ? <Txt t='sub' c={C.tert}>Check this line</Txt>
                    : <Txt t='sub' c={C.quiet}>{String(l.itemId).replace(/^pi-/, '')}</Txt>}
                </Box>
              </Box>) } },
            { key: 'rec', label: 'Received', align: 'right', width: 110, render: l => `${l.receivedQty} ${unitOf(s, l.unitId)}` },
            { key: 'bil', label: 'Billed', align: 'right', width: 110, render: l => <Txt t={discOf(l.itemId) ? 'bodyTitle' : 'body'} c={discOf(l.itemId) ? C.tert : C.ink}>{l.billedQty} {unitOf(s, l.unitId)}</Txt> },
            { key: 'rate', label: 'Rate', align: 'right', width: 100, render: l => (Number(l.rate) ? inr(l.rate) : '—') },
            { key: 'amt', label: 'Amount', align: 'right', width: 116, render: l => { const a = r2((Number(l.billedQty) || 0) * (Number(l.rate) || 0) * (1 + (Number(l.gstPct) || 0) / 100)); return a ? inr(a) : '—' } }
          ]} />
        </Box>
  )
  // the challans as a table, the same as the form's (Sourav, 5 Nov: "make it also table"); a row opens the goods receipt
  const challanGrid = (
        // compact to fit the details column: no serial, received as date and name on two lines
        <Grid paginate={false} serial={false} rows={inv.dcNumbers.map(dc => s.dcsBy[dc]).filter(Boolean)} rowKey={d => d.dcNumber} onRow={d => onPeekDc(d.dcNumber)} empty='None added yet' cols={[
          { nowrap: true, width: 150, key: 'dc', label: 'Challan no.', render: d => <Txt t='bodyTitle' c={C.black}>{d.dcNumber}</Txt> },
          { key: 'items', label: 'Items', flex: 1, minWidth: 160, render: d => { const n = d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean); return <Txt c={C.ink} sx={{ whiteSpace: 'normal' }}>{n.slice(0, 2).join(', ')}{n.length > 2 && <Txt t='bodyTitle' c={C.quiet}>{` +${n.length - 2}`}</Txt>}</Txt> } },
          { nowrap: true, width: 140, key: 'wh', label: 'Warehouse', render: d => whOf(s, d.warehouseId) },
          { nowrap: true, width: 140, key: 'at', label: 'Received', render: d => <Box><Txt c={C.ink} sx={{ display: 'block' }}>{fmtDay(d.receivedAt)}</Txt><Txt t='sub' c={C.quiet}>{d.receivedBy}</Txt></Box> }
        ]} />
  )
  const body = modal => (
    <Box sx={{ ...(modal && { flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'customColors.Background', p: '16px 24px 24px' }), display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Box sx={{ bgcolor: 'common.white', borderRadius: '12px', p: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '16px' }}>
        <Fact label='Invoice date'>{fmtDay(inv.invoiceDate)}</Fact>
        <Fact label='Challans'>{inv.dcNumbers.length}</Fact>
        <Fact label='Items'>{inv.lines.length}</Fact>
        <Fact label='Total'>{inr(c.total)}</Fact>
      </Box>

      {/* items as the goods receipt's products table (the shared Grid: SL.NO, item photo, name and code) */}
      <Box2 title='Items' count={inv.lines.length}>
        <Box sx={{ '& > *': { height: 'auto !important' } }}>
          <Grid paginate={false} rows={inv.lines.map((l, k) => ({ ...l, _k: k }))} rowKey={l => l._k} empty='No items' cols={[
            { key: 'item', label: 'Item', flex: 2, minWidth: 220, render: l => { const d = discOf(l.itemId), u = unitOf(s, l.unitId); return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <ItemThumb item={itemOf(s, l.itemId)} size={40} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Txt t='bodyTitle' c={C.black}>{itemOf(s, l.itemId)?.name || l.itemId}</Txt>
                    {d && (d.kind === 'more' || d.kind === 'less') && <Pill tone='warn'>{d.kind === 'more' ? '+' : '−'}{r2(Math.abs(d.billed - d.received))} {u}</Pill>}
                  </Box>
                  {d && d.kind !== 'more' && d.kind !== 'less' ? <Txt t='sub' c={C.tert}>Check this line</Txt>
                    : <Txt t='sub' c={C.quiet}>{String(l.itemId).replace(/^pi-/, '')}</Txt>}
                </Box>
              </Box>) } },
            { key: 'rec', label: 'Received', align: 'right', width: 110, render: l => `${l.receivedQty} ${unitOf(s, l.unitId)}` },
            { key: 'bil', label: 'Billed', align: 'right', width: 110, render: l => <Txt t={discOf(l.itemId) ? 'bodyTitle' : 'body'} c={discOf(l.itemId) ? C.tert : C.ink}>{l.billedQty} {unitOf(s, l.unitId)}</Txt> },
            { key: 'rate', label: 'Rate', align: 'right', width: 100, render: l => (Number(l.rate) ? inr(l.rate) : '—') },
            { key: 'amt', label: 'Amount', align: 'right', width: 116, render: l => { const a = r2((Number(l.billedQty) || 0) * (Number(l.rate) || 0) * (1 + (Number(l.gstPct) || 0) / 100)); return a ? inr(a) : '—' } }
          ]} />
        </Box>
      </Box2>

      {/* challans and documents three across, as on the form (Sourav, 2 Nov) */}
      <Box2 title='Challans' count={inv.dcNumbers.length}>
        {challanGrid}
      </Box2>

      <Box2 title='Documents' count={(inv.docs || []).length}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px' }}>
          {(inv.docs || []).map((d, k) => <DocViewRow key={d.id} doc={d} onView={() => setView(k)} />)}
        </Box>
        {!(inv.docs || []).length && <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>No documents attached</Typography>}
      </Box2>
    </Box>
  )

  const menuEl = (
    <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <MenuItem onClick={() => { setMenu(null); onDelete(inv) }} sx={{ color: 'error.main' }}>
        <ListItemIcon sx={{ color: 'error.main' }}><I i='mdi:delete-outline' s={20} /></ListItemIcon>Delete invoice
      </MenuItem>
    </Menu>
  )

  // Invoice details as a full page (Sourav, 2 Nov, from docs/mock/invoice-details-v2.html): a header card with the
  // invoice number, its state, a one-line summary, the role's actions, the send-back note when it came back, and the
  // stage rail; then Invoice information (key facts, challans, items, totals) on the left and a column with Attachments
  // and Activity on the right. No tabs, no info tiles.
  const nMis = (inv.discrepancies || []).filter(d => d.itemId).length
  const vendor = vendorOf(s, inv.vendorId)?.name
  const up = inv.trail[0]
  const approved = [...inv.trail].reverse().find(e => e.to === 'checked')
  const returned = ['returned_to_clerk', 'returned_by_finance'].includes(inv.status) ? [...inv.trail].reverse().find(e => e.to === inv.status) : null
  const docs = inv.docs || []
  const fact = (label, value, tone) => (
    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, py: 2 }}>
      <Typography sx={{ fontSize: 15, color: 'customColors.neutralSecondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 500, textAlign: 'right', color: tone || 'customColors.OnSurfaceVariant' }}>{value}</Typography>
    </Box>
  )
  const grn = grnOf(s, inv.grnId), grnLt = lineTakenMap(s.invoices)
  const sectionTitle = (t, n) => <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'customColors.OnSurfaceVariant', mb: 3 }}>{t} <Box component='span' sx={{ fontWeight: 400, color: 'customColors.neutralSecondary' }}>({n})</Box></Typography>
  const cardTitle = (t, n, right) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, mb: 4.5 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{t}{n != null && <Box component='span' sx={{ fontWeight: 400, color: 'customColors.neutralSecondary' }}> ({n})</Box>}</Typography>
      {right}
    </Box>
  )
  const textLink = (label, onClick, icon) => <Button variant='text' size='small' onClick={onClick} endIcon={icon ? <I i={icon} s={16} /> : null} sx={{ color: 'primary.dark', fontWeight: 600, fontSize: 14, minWidth: 0, px: 1, textTransform: 'none' }}>{label}</Button>

  if (page) return (
    <Page contained={false} crumb={['Bill Desk', crumb, inv.invoiceNo]}>
      <Card sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, flexWrap: 'wrap' }}>
          <IconButton aria-label='Back' onClick={onClose} sx={{ color: 'customColors.OnSurfaceVariant', mt: '2px' }}><I i='mdi:arrow-left' s={24} /></IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 28, fontWeight: 400, lineHeight: 1.25, color: 'customColors.OnSurfaceVariant' }}>{inv.invoiceNo}</Typography>
              <StagePill status={inv.status} />
            </Box>
            <Typography sx={{ mt: 1, fontSize: 15, color: 'customColors.neutralSecondary' }}>
              <Box component='span' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{vendor || 'Vendor not read'}</Box>
              {' · '}{inr(c.total)} · {inv.id}{up ? ` · uploaded ${fmtAt(up.at)} by ${up.by}` : ''}
            </Typography>
          </Box>
          {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>{actions}</Box>}
          {(onEdit || onDelete) && <IconButton aria-label='Record actions' onClick={e => setMenu(e.currentTarget)} sx={{ color: 'customColors.OnSurfaceVariant' }}><I i='mdi:dots-vertical' s={20} /></IconButton>}
          <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 200, borderRadius: '10px', boxShadow: theme => theme.shadows[3], border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` } } }}>
            {onEdit && <MenuItem onClick={() => { setMenu(null); onEdit(inv) }} sx={{ py: 2, px: 3, gap: 1, color: 'customColors.OnSurfaceVariant' }}>
              <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}><I i='mdi:pencil-outline' s={18} /></ListItemIcon><Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>Edit</Typography>
            </MenuItem>}
            {onDelete && <MenuItem onClick={() => { setMenu(null); onDelete(inv) }} sx={{ py: 2, px: 3, gap: 1, color: 'customColors.Tertiary' }}>
              <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}><I i='mdi:trash-can-outline' s={18} /></ListItemIcon><Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>Delete invoice</Typography>
            </MenuItem>}
          </Menu>
        </Box>
        {/* the note it came back with, above the rail (Sourav, 2 Nov: "sent back i need a comment highlighted above the stage") */}
        {returned && (
          <Box sx={theme => ({ mt: 5, display: 'flex', gap: 3.5, px: 4.5, py: 4, borderRadius: '10px', backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.2), border: `1px solid ${alpha(theme.palette.customColors.TertiaryContainer, 0.6)}` })}>
            <Box sx={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, backgroundColor: C.secBg, color: C.ink }}>{initials(returned.by)}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{returned.by}</Typography>
                <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>{ROLE[returned.role] || ''} · Sent back {fmtAt(returned.at)}</Typography>
              </Box>
              <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.5, color: 'customColors.OnSurfaceVariant' }}>{returned.note ? `“${returned.note}”` : 'No note given.'}</Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 5 }}><InvoicePipeline inv={inv} /></Box>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 380px' }, gap: 6, alignItems: 'start', mt: 2 }}>
        <Card sx={{ p: 6 }}>
          {cardTitle('Invoice information')}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 10, pt: 3, borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            {fact('Vendor', vendor || '—')}
            {fact('Invoice date', fmtDay(inv.invoiceDate))}
            {fact('Items', nMis ? `${inv.lines.length} · ${nMis} differ` : `${inv.lines.length} · all match`, nMis ? C.tert : undefined)}
            {fact('Bill Desk no.', inv.id)}
            {fact('Uploaded by', up ? `${up.by} · ${fmtDay(up.at)}` : '—')}
            {approved && fact('Reviewed by', `${approved.by} · ${fmtDay(approved.at)}`)}
          </Box>

          {/* challans: a compact card each, above the items (Sourav, 2 Nov: "challans i need a proper small section above the items") */}
          {/* the GRN this invoice bills, and how far that GRN is billed (BD-72) */}
          {grn && <Box role='button' tabIndex={0} onClick={() => setGrnOpen(true)} onKeyDown={e => { if (e.key === 'Enter') setGrnOpen(true) }}
            sx={{ mt: 5, display: 'flex', alignItems: 'center', gap: '12px', p: '12px 16px', borderRadius: '10px', bgcolor: C.tint, cursor: 'pointer', '&:hover': { filter: 'brightness(0.97)' } }}>
            <I i='mdi:file-document-check-outline' c={C.greenDark} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Txt t='bodyTitle' c={C.greenDark}>{grn.id}</Txt>
              <Txt c={C.text} sx={{ display: 'block' }}>This GRN: {grnInvoiceIds(grn, grnLt).length} {grnInvoiceIds(grn, grnLt).length === 1 ? 'invoice' : 'invoices'} · {grnBilled(grn, grnLt)} of {grn.lines.length} lines billed</Txt>
            </Box>
            <I i='mdi:chevron-right' c={C.greenDark} />
          </Box>}
          {grn && grnOpen && <GrnSheet id={grn.id} onClose={() => setGrnOpen(false)} />}
          <Box sx={{ mt: 5 }}>
            {sectionTitle('Challans', inv.dcNumbers.length)}
            {inv.dcNumbers.length
              ? challanGrid
              : <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>None added yet</Typography>}
          </Box>

          <Box sx={{ mt: 5 }}>
            {sectionTitle('Items', inv.lines.length)}
            {/* the invoice total as the table's last row, under Amount (2 Nov: "bro fix it") */}
            {itemsTable(true)}
          </Box>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <Card sx={{ p: 6 }}>
            {cardTitle('Attachments', docs.length, onEdit ? textLink('+ Add', () => onEdit(inv)) : null)}
            {docs.length
              ? <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 150px)', justifyContent: 'space-between', gap: 3 }}>
                  {docs.slice(0, 4).map((d, k) => <PdfFileCard key={d.id} doc={d} onView={() => setView(k)} />)}
                </Box>
              : <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>No invoice uploaded</Typography>}
            {docs.length > 4 && <Box sx={{ textAlign: 'right', mt: 2 }}>{textLink(`+${docs.length - 4} more`, () => setView(4))}</Box>}
          </Card>
          <Card sx={{ p: 6 }}>
            {cardTitle('Activity', inv.trail.length, textLink('View all', () => setAll(true), 'mdi:chevron-right'))}
            <ActivityRail inv={inv} />
          </Card>
        </Box>
      </Box>
      <ActivitySheet inv={inv} open={all} onClose={() => setAll(false)} />
      {view != null && <DocViewer docs={docs} index={view} onClose={() => setView(null)} />}
    </Page>
  )

  return (
    // a centred modal (Sourav, 2 Nov: "invoice show in a modal, match the modal like we had in the procure lite"): the
    // CommonDialogBox with the Inventory window header the goods receipt uses (72px, tile, title 20/500, number chip,
    // state, actions, close)
    <CommonDialogBox dialogBoxStatus dialogWithMaxWidth padding={0} close={onClose} title='' paperSx={{ width: 'min(1040px, calc(100vw - 64px))', maxWidth: 'none' }}
      formComponent={<Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 96px)' }}>
      <Box sx={{ height: 72, flex: 'none', display: 'flex', alignItems: 'center', gap: '12px', px: 6, borderBottom: `1px solid ${C.n05}` }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: C.tint, display: 'grid', placeItems: 'center' }}><I i='mdi:receipt-text-outline' s={22} c={C.greenDark} /></Box>
        <Txt sx={{ fontSize: 20, fontWeight: 500, lineHeight: '24px' }} c={C.text}>Invoice</Txt>
        <Box sx={{ bgcolor: C.n05, color: C.ink, ...T.minorMedium, px: '10px', py: '4px', borderRadius: '6px' }}>{inv.invoiceNo}</Box>
        <Pill tone={disc ? 'warn' : 'ok'} icon={disc ? 'mdi:alert-outline' : 'mdi:check'}>{disc ? 'With discrepancies' : 'Matched'}</Pill>
        <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary', minWidth: 0 }}>{inv.id} · {vendorOf(s, inv.vendorId)?.name}</Typography>
        <Box sx={{ flex: 1 }} />
        <Btn icon='mdi:pencil-outline' onClick={() => onEdit(inv)}>Edit</Btn>
        <IconButton aria-label='More actions' onClick={e => setMenu(e.currentTarget)} sx={{ color: 'customColors.OnSurfaceVariant' }}><I i='mdi:dots-vertical' s={22} /></IconButton>
        <IconButton aria-label='Close' onClick={onClose} sx={{ p: 0, ml: '4px', color: 'customColors.OnSurfaceVariant' }}><I i='mdi:close' s={24} /></IconButton>
        <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem onClick={() => { setMenu(null); onDelete(inv) }} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><I i='mdi:delete-outline' s={20} /></ListItemIcon>Delete invoice
          </MenuItem>
        </Menu>
      </Box>

      {body(true)}
      {view != null && <DocViewer docs={inv.docs} index={view} onClose={() => setView(null)} />}
    </Box>} />
  )
}

export default InvoiceSheet
