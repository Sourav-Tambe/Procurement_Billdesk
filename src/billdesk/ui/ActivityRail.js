// An invoice's history as a vertical rail (Sourav, 2 Nov: "can activity become like a rail vertically? scrollable there
// itself, and view all can open a sidesheet to show it all"), in the stage rail's language (ui/InvoicePipeline.js):
// a marker per event joined by a dotted line, newest first. Done: a dark circle with a check; the newest wears the
// green ring; a send-back or a rejection: red with a cross; Antz AI: an outlined robot. The card list scrolls inside
// itself; ActivitySheet is the whole history in a right side sheet, grouped by day.
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { fmtDay } from '../logic'
import { I } from './ui'

const ROLE = { clerk: 'Accounts clerk', head: 'Bill Desk head', finance: 'Finance' }
const BAD = ['returned_to_clerk', 'returned_by_finance', 'rejected']
const kindOf = e => (BAD.includes(e.to) ? 'bad' : /Antz AI/.test(e.action || '') ? 'ai' : 'ok')
const timeOf = at => new Date(at).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
export const eventsOf = inv => [...(inv.trail || [])].reverse()

const Dot = ({ kind, first }) => (
  <Box sx={theme => ({ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, color: theme.palette.common.white,
    ...(kind === 'bad' ? { backgroundColor: theme.palette.error.main }
      : kind === 'ai' ? { border: `2px solid ${theme.palette.customColors.OutlineVariant}`, backgroundColor: theme.palette.common.white, color: theme.palette.customColors.OnSurfaceVariant }
      : first ? { border: `2px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.common.white, color: theme.palette.primary.main }
      : { backgroundColor: theme.palette.customColors.OnSurfaceVariant }) })}>
    <I i={kind === 'bad' ? 'mdi:close' : kind === 'ai' ? 'mdi:robot-outline' : 'mdi:check'} s={16} />
  </Box>
)

const Row = ({ e, first, last, dayless }) => {
  const kind = kindOf(e)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', columnGap: 3, position: 'relative', pb: last ? 0 : 4.5 }}>
      {!last && <Box sx={theme => ({ position: 'absolute', left: 13, top: 32, bottom: 4, width: 2, backgroundImage: `repeating-linear-gradient(180deg, ${theme.palette.customColors.OutlineVariant} 0 1.5px, transparent 1.5px 4px)` })} />}
      <Dot kind={kind} first={first} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant='body2' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{e.action}</Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', whiteSpace: 'nowrap', pt: '2px' }}>{dayless ? timeOf(e.at) : `${fmtDay(e.at)}, ${timeOf(e.at)}`}</Typography>
        </Box>
        <Typography variant='caption' sx={{ display: 'block', color: 'customColors.neutralSecondary' }}>{e.by}{ROLE[e.role] ? ` · ${ROLE[e.role]}` : ''}</Typography>
        {e.note && (
          <Box sx={theme => ({ mt: 1.5, px: 2.5, py: 2, borderRadius: '6px', fontSize: 13, lineHeight: 1.45, color: theme.palette.customColors.OnSurfaceVariant,
            backgroundColor: kind === 'bad' ? alpha(theme.palette.customColors.TertiaryContainer, 0.25) : alpha(theme.palette.customColors.displaybgPrimary, 0.7) })}>
            {kind === 'bad' ? `“${e.note}”` : e.note}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// the card's list: scrolls inside itself past about five events
export const ActivityRail = ({ inv, maxHeight = 330 }) => {
  const evs = eventsOf(inv)

  return (
    <Box sx={{ maxHeight, overflowY: 'auto', mr: -2, pr: 2, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'customColors.SurfaceVariant', borderRadius: 3 } }}>
      {evs.map((e, k) => <Row key={k} e={e} first={k === 0} last={k === evs.length - 1} />)}
    </Box>
  )
}

// the whole history in a right side sheet, one white box per day
export const ActivitySheet = ({ inv, open, onClose }) => {
  const evs = eventsOf(inv)
  const days = [...new Set(evs.map(e => String(e.at).slice(0, 10)))]

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: 520, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 6, py: 5, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>Activity</Typography>
          <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>{inv.invoiceNo} · {evs.length} {evs.length === 1 ? 'event' : 'events'}</Typography>
        </Box>
        <IconButton aria-label='Close' onClick={onClose} sx={{ color: 'customColors.OnSurfaceVariant' }}><I i='mdi:close' s={22} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 6, py: 5, backgroundColor: 'customColors.Background' }}>
        {days.map(d => {
          const list = evs.filter(e => String(e.at).slice(0, 10) === d)

          return (
            <Box key={d} sx={{ mb: 4.5 }}>
              <Typography variant='caption' sx={{ display: 'block', fontWeight: 600, color: 'customColors.neutralSecondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 3 }}>
                {new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Typography>
              <Box sx={{ backgroundColor: 'common.white', borderRadius: '10px', p: 4.5 }}>
                {list.map((e, k) => <Row key={k} e={e} first={e === evs[0]} last={k === list.length - 1} dayless />)}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Drawer>
  )
}
