// A read-only document row, from the Antz codebase's compliance DocViewRow (animal-exchanges/detail/_docRow.tsx):
// the Antz PDF icon on a light-peach tile (an image icon for a photo), the name, a sub-line of size · who attached it ·
// date, and a "View" text button. The whole row opens the document (Sourav, 2 Nov: "make the attachments look good").
import { Box, Button, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { I } from './ui'
import { isPdf } from './docStore'

const fmtSize = b => (!b ? undefined : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`)
const fmtDate = iso => { if (!iso) return undefined; try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return iso } }

const DocViewRow = ({ doc, onView }) => {
  const sub = [fmtSize(doc.size), doc.by, fmtDate(doc.at)].filter(Boolean).join(' · ')

  return (
    <Box onClick={onView} sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 4, py: 3, cursor: 'pointer', transition: 'background-color 0.15s', borderRadius: '8px', minWidth: 0,
      border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, backgroundColor: 'common.white', '&:hover': { backgroundColor: 'customColors.Surface' } }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme => alpha(theme.palette.customColors.TertiaryContainer, 0.3) }}>
        {isPdf(doc) ? <Box component='img' src='/icons/file-pdf.svg' alt='PDF' sx={{ width: 24, height: 24 }} /> : <I i='mdi:file-image-outline' s={24} c='#FA6140' />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='body2' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }} noWrap title={doc.name}>{doc.name}</Typography>
        {sub && <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', display: 'block', mt: 0.5 }} noWrap>{sub}</Typography>}
      </Box>
      <Button variant='text' size='small' startIcon={<I i='mdi:eye-outline' s={18} />} onClick={e => { e.stopPropagation(); onView() }} sx={{ color: 'primary.dark', fontWeight: 600, flexShrink: 0, fontSize: 14 }}>View</Button>
    </Box>
  )
}

export default DocViewRow
