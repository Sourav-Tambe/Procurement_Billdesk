// The challan card of the Add invoice form (BD-44 option B): the challan's truck tile,
// the number, "n items · area" and "date · receiver", an eye to open the goods receipt, and an optional action on the
// right. Shared so the invoice sheet shows challans the same way as the form (Sourav, 2 Nov: "match with existing ui").
import { Box, ButtonBase, IconButton, Typography } from '@mui/material'
import { itemOf, whOf } from '../store'
import { fmtDay } from '../logic'
import { C, I } from './ui'

const quiet = { color: 'customColors.neutralSecondary' }

// a challan's icon wherever one is listed: the truck tile of the challan sheet's header (Sourav, 3 Nov: "everywhere
// for challans, i need that truck icon instead of the paper icon")
export const PagePlaceholder = ({ onClick, label }) => (
  <ButtonBase onClick={onClick} aria-label={label} sx={{ width: 48, height: 48, flex: 'none', borderRadius: '8px', bgcolor: C.tint, display: 'grid', placeItems: 'center' }}>
    <I i='mdi:truck-check-outline' s={24} c={C.greenDark} />
  </ButtonBase>
)

const ChallanCard = ({ s, d, onView, right, sub, dashed }) => {
  const n = d.lines.length

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', p: '14px 8px 14px 16px', borderRadius: '12px', bgcolor: 'common.white',
      border: theme => `1px ${dashed ? 'dashed' : 'solid'} ${dashed ? theme.palette.customColors.OutlineVariant : theme.palette.customColors.SurfaceVariant}`,
      transition: 'border-color .15s', '&:hover': { borderColor: 'customColors.Outline' } }}>
      <PagePlaceholder onClick={onView} label={`Open ${d.dcNumber}`} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='subtitle1' noWrap sx={{ fontWeight: 600, lineHeight: 1.4, color: 'customColors.OnSurfaceVariant' }}>{d.dcNumber}</Typography>
        <Typography variant='body2' noWrap sx={quiet}>{n} {n === 1 ? 'item' : 'items'} · {whOf(s, d.warehouseId)}</Typography>
        <Typography variant='body2' noWrap sx={quiet}>{sub || `${fmtDay(d.receivedAt)} · ${d.receivedBy || 'received'}`}</Typography>
      </Box>
      <IconButton aria-label={`View ${d.dcNumber}`} size='small' onClick={onView} sx={quiet}><I i='mdi:eye-outline' s={20} /></IconButton>
      {right}
    </Box>
  )
}

export const itemNames = (s, d) => d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean)
export default ChallanCard
