// Where an invoice is in its journey (Sourav, 2 Nov: "an option to show the stage/pipeline of this invoice", then "make
// that stage rail like this", a stepper reference): six steps on a soft rounded strip, each a circle joined to the next
// by a dotted rail, with the stage name and a line under it. Done: a dark filled circle with a check and who moved it
// and when. Now: a green ring and the state. A return or a rejection: a red circle with a cross and the state in red.
// Waiting: an empty grey ring. Stages follow the invoice pipeline (docs/mock/invoice-pipeline.html) and map today's
// statuses onto them.
import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { fmtDay } from '../logic'
import { isReading, isFailed } from '../antzAi'
import { I } from './ui'

const STAGES = [
  { key: 'upload', label: 'Uploaded' },
  { key: 'match', label: 'Challans linked' }, // not "Matched", which is also the match result (2 Nov)
  { key: 'review', label: 'Head review' },
  { key: 'verify', label: 'Finance check' },
  { key: 'approval', label: 'Approval' },
  { key: 'paid', label: 'Payment' }
]
// status → [index of the current stage, its state, whether it is a problem]. Correction needed sits on the head's
// step, as in the pipeline (2 Nov); an invoice Antz AI is still reading, or failed to read, sits on Uploaded
const NOW = {
  to_connect: [1, 'Pending Match'],
  draft: [1, 'Pending Match'],
  returned_to_clerk: [2, 'Correction Needed', true],
  with_head: [2, 'Under Review'],
  checked: [3, 'In Verification'],
  with_finance: [3, 'In Verification'],
  returned_by_finance: [2, 'Returned by Finance', true],
  sent_for_approval: [4, 'Awaiting Approval'],
  approved: [5, 'Payment Pending'],
  paid: [6, 'Paid'],
  rejected: [4, 'Rejected', true]
}
// the trail event that closed each stage: [stage key, test on the event]
const CLOSED_BY = {
  upload: e => true,
  match: e => e.to === 'draft' || /DCs connected|Invoice added/.test(e.action || ''),
  review: e => e.to === 'checked' || e.to === 'with_finance',
  verify: e => e.to === 'sent_for_approval',
  approval: e => e.to === 'approved',
  paid: e => e.to === 'paid'
}

const InvoicePipeline = ({ inv }) => {
  const [now, state, bad] = inv.status === 'to_connect' && isReading(inv) ? [0, 'Reading'] : inv.status === 'to_connect' && isFailed(inv) ? [0, 'Read failed', true] : NOW[inv.status] || [0, inv.status]
  const when = key => { const e = inv.trail.find(CLOSED_BY[key] || (() => false)); return e ? `${e.by} · ${fmtDay(e.at)}` : '' }
  // the dotted rail: short ticks, dark behind a done step, light ahead
  const rail = color => ({ flex: 1, height: 8, mx: 3, backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 1.5px, transparent 1.5px 4px)` })

  return (
    <Box sx={{ display: 'flex', px: 6, py: 5, borderRadius: '16px', border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, backgroundColor: theme => alpha(theme.palette.customColors.displaybgPrimary, 0.4) }}>
      {STAGES.map((st, k) => {
        const done = k < now, cur = k === now, last = k === STAGES.length - 1
        const sub = done ? when(st.key) : cur ? state : ''

        return (
          <Box key={st.key} sx={{ flex: last ? 'none' : 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={theme => ({ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', color: theme.palette.common.white,
                ...(done ? { backgroundColor: theme.palette.customColors.OnSurfaceVariant }
                  : cur && bad ? { backgroundColor: theme.palette.error.main }
                  : cur ? { border: `2px solid ${theme.palette.primary.main}`, backgroundColor: theme.palette.common.white }
                  : { border: `2px solid ${theme.palette.customColors.OutlineVariant}`, backgroundColor: 'transparent' }) })}>
                {done && <I i='mdi:check' s={20} />}
                {cur && bad && <I i='mdi:close' s={20} />}
                {cur && !bad && <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'primary.main' }} />}
              </Box>
              {!last && <Box sx={theme => rail(done ? theme.palette.customColors.OnSurfaceVariant : theme.palette.customColors.OutlineVariant)} />}
            </Box>
            <Box sx={{ pr: last ? 0 : 4, minWidth: 0 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 500, color: done || cur ? 'customColors.OnSurfaceVariant' : 'customColors.neutralSecondary' }} noWrap>{st.label}</Typography>
              <Typography sx={{ fontSize: 14, mt: 0.5, minHeight: 20, color: cur && bad ? 'error.main' : cur ? 'primary.dark' : 'customColors.neutralSecondary' }} noWrap title={sub}>{sub}</Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default InvoicePipeline
