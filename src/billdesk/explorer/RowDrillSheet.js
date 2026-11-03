// The row drill-down sheet of Finance's Data Explorer, ported from the compliance explorer
// (components/animal-exchanges/explorer/RowDrillSheet.tsx, PillTabs.tsx, drawers/_scaffold.tsx DrawerShell + Panel):
// a 562px right sheet on the Antz background. Its header names the row with "n invoices · ₹value"; pill tabs re-slice
// the row by the other dimensions (rank, value, share), and an Invoices tab lists the invoices, each opening its
// Invoice details.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { I } from '../ui/ui'
import { DIMS, computePivot, fmtDimKey, fmtMeasure, filterRecordsForRow, MEASURE_LABEL } from './pivotEngine'
import { inr, r2, fmtDay } from '../logic'

const INVOICES = '__invoices'

// the module's pill tabs: OnPrimaryContainer fill for the picked one, arrows in the gutters when they overflow
const PillTabs = ({ tabs, value, onChange }) => {
  const ref = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const sync = () => { const el = ref.current; if (!el) return; const max = el.scrollWidth - el.clientWidth - 1; setEdges({ start: el.scrollLeft <= 0, end: max <= 0 || el.scrollLeft >= max }) }
  useEffect(() => { sync() }, [tabs])
  const Arrow = ({ dir, hidden }) => (
    <Box component='button' onClick={() => ref.current?.scrollBy({ left: dir * 180, behavior: 'smooth' })} aria-hidden={hidden}
      sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 28, border: 'none', background: 'none', p: 0, cursor: hidden ? 'default' : 'pointer', visibility: hidden ? 'hidden' : 'visible', color: 'customColors.OnSurfaceVariant' }}>
      <I i={dir < 0 ? 'mdi:chevron-left' : 'mdi:chevron-right'} s={22} />
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Arrow dir={-1} hidden={edges.start} />
      <Box ref={ref} onScroll={sync} sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', gap: 1, overflowX: 'auto', py: '2px', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {tabs.map(t => {
          const active = t.key === value

          return (
            <Box key={t.key} component='button' onClick={() => onChange(t.key)}
              sx={{ flexShrink: 0, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 600 : 500, lineHeight: 1, px: 4, py: 2.25, borderRadius: '999px',
                ...(active ? { backgroundColor: 'customColors.OnPrimaryContainer', color: 'common.white', border: theme => `1px solid ${theme.palette.customColors.OnPrimaryContainer}` }
                  : { backgroundColor: 'transparent', color: 'customColors.OnSurfaceVariant', border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`, '&:hover': { backgroundColor: 'customColors.Surface' } }) }}>
              {t.label}
            </Box>
          )
        })}
      </Box>
      <Arrow dir={1} hidden={edges.end} />
    </Box>
  )
}

// rank · label · value · share, as the compliance lens rows
const LensRow = ({ rank, label, sub, value, share, top, onClick }) => (
  <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, px: 3.5, py: 2.5, cursor: onClick ? 'pointer' : 'default', borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, '&:last-of-type': { borderBottom: 'none' }, '&:hover': { backgroundColor: 'customColors.Surface' } }}>
    <Typography component='span' sx={{ flexShrink: 0, minWidth: 22, fontSize: 13, color: 'customColors.neutralSecondary', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{rank}</Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 14, color: 'customColors.OnSurfaceVariant', fontWeight: top ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>{label}</Typography>
      {sub && <Typography variant='caption' sx={{ display: 'block', color: 'customColors.neutralSecondary' }} noWrap>{sub}</Typography>}
    </Box>
    <Typography sx={{ flexShrink: 0, minWidth: 48, textAlign: 'right', fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{value}</Typography>
    {share != null && <Typography sx={{ flexShrink: 0, minWidth: 40, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'customColors.neutralSecondary' }}>{share}%</Typography>}
    {onClick && <Box sx={{ color: 'customColors.Outline', display: 'flex' }}><I i='mdi:chevron-right' s={18} /></Box>}
  </Box>
)

const RowDrillSheet = ({ open, onClose, records, rowDim, rowKey, measure, filters }) => {
  const router = useRouter()
  const lenses = DIMS.filter(d => d.key !== rowDim)
  const [tab, setTab] = useState(lenses[0]?.key)
  useEffect(() => { setTab(DIMS.filter(d => d.key !== rowDim)[0]?.key) }, [rowDim, rowKey])
  if (!open) return null
  const subset = filterRecordsForRow(records, rowDim, rowKey).filter(r => !(filters?.from && r.invoiceDate < filters.from) && !(filters?.to && r.invoiceDate > filters.to))
  const invoices = [...new Map(subset.map(r => [r.invoiceId, r])).values()]
  const value = r2(subset.reduce((s, r) => s + r.value, 0))
  const lens = tab !== INVOICES ? computePivot(subset, { rowDim: tab, colDim: 'none', measure, filters: {} }) : null

  return (
    <Drawer anchor='right' open onClose={(_e, reason) => reason !== 'backdropClick' && onClose()}
      PaperProps={{ sx: { width: 562, maxWidth: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: 'customColors.Background' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 6, py: 4, backgroundColor: 'common.white', borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{fmtDimKey(rowDim, rowKey)}</Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>{invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} · {inr(value)}</Typography>
        </Box>
        <IconButton onClick={onClose} size='small' aria-label='Close'><I i='mdi:close' s={22} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 6 }}>
        <Box sx={{ p: 5, borderRadius: '10px', backgroundColor: 'common.white', border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
          <Box sx={{ mx: -5, mt: -5, px: 5, pt: 5, pb: 4, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <PillTabs tabs={[...lenses, { key: INVOICES, label: 'Invoices' }]} value={tab} onChange={setTab} />
          </Box>
          <Box sx={{ mt: 4 }}>
            {tab === INVOICES
              ? invoices.sort((a, b) => (a.invoiceDate || '').localeCompare(b.invoiceDate || '')).map((r, k) => {
                const inv = subset.filter(x => x.invoiceId === r.invoiceId)

                return <LensRow key={r.invoiceId} rank={k + 1} label={`${r.invoiceNo} · ${r.vendor}`} sub={`${r.invoiceId} · ${fmtDay(r.invoiceDate)} · ${r.stage}`} value={inr(r2(inv.reduce((s, x) => s + x.value, 0)))} onClick={() => { onClose(); router.push(`/bill-desk/invoice-details?id=${r.invoiceId}`) }} />
              })
              : (
                <>
                  <Typography variant='caption' sx={{ display: 'block', mb: 2, color: 'customColors.neutralSecondary' }}>{MEASURE_LABEL[measure]} by {lenses.find(d => d.key === tab)?.label}</Typography>
                  {lens.rowKeys.map((k, i) => (
                    <LensRow key={k} rank={i + 1} label={fmtDimKey(tab, k)} value={fmtMeasure(lens.rowTotals[k], measure)} top={i === 0}
                      share={lens.grandTotal > 0 ? Math.round((lens.rowTotals[k] / lens.grandTotal) * 100) : 0} />
                  ))}
                </>
              )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default RowDrillSheet
