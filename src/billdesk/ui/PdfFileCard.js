// A document card, from the Antz codebase's compliance PdfFileCard (views/pages/compliance/documents/exports): a white
// card with a 1px grey border, the file-type icon on a tinted 100px tile, and the file name under it, as on the export
// permit details (Figma CITES Animal Shipment Documents 5881:50571). The ⋮ beside the name is the Figma card's and
// holds View and Download. A photo shows its own thumbnail. The codebase reads the icon and tile colour from the
// user's settings; here they are the PDF icon and the light-peach tile DocViewRow uses.
import { useState } from 'react'
import { Box, Card, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { I } from './ui'
import { isPdf, useDocUrl } from './docStore'

const PdfFileCard = ({ doc, onView, width = 150 }) => {
  const [menu, setMenu] = useState(null)
  const { url } = useDocUrl(doc)
  const pdf = isPdf(doc)
  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name || 'document'
    a.click()
  }

  return (
    <Card onClick={onView} sx={theme => ({ width, bgcolor: theme.palette.common.white, cursor: 'pointer', border: `1px solid ${theme.palette.grey[300]}`, boxShadow: 'none', '&:hover': { borderColor: theme.palette.customColors.OutlineVariant } })}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100, borderRadius: 1, m: 2, overflow: 'hidden', bgcolor: theme => alpha(theme.palette.customColors.TertiaryContainer, 0.3) }}>
        {pdf
          ? <Box component='img' src='/icons/file-pdf.svg' alt='PDF' sx={{ width: 40, height: 40 }} />
          : url ? <Box component='img' src={url} alt={doc.name || ''} sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : <I i='mdi:file-image-outline' s={40} c='#FA6140' />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 1, pb: 2 }}>
        <Tooltip title={doc.name} arrow>
          <Typography variant='caption' sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'customColors.OnSurfaceVariant' }}>{doc.name}</Typography>
        </Tooltip>
        <IconButton aria-label='Document actions' size='small' onClick={e => { e.stopPropagation(); setMenu(e.currentTarget) }} sx={{ p: 0.5, flexShrink: 0, color: 'customColors.OnSurfaceVariant' }}><I i='mdi:dots-vertical' s={16} /></IconButton>
      </Box>
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} onClick={e => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 170, borderRadius: '10px', boxShadow: theme => theme.shadows[3], border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` } } }}>
        <MenuItem onClick={() => { setMenu(null); onView() }} sx={{ py: 2, px: 3, gap: 1, color: 'customColors.OnSurfaceVariant' }}>
          <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}><I i='mdi:eye-outline' s={18} /></ListItemIcon><Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>View</Typography>
        </MenuItem>
        <MenuItem disabled={!url} onClick={() => { setMenu(null); download() }} sx={{ py: 2, px: 3, gap: 1, color: 'customColors.OnSurfaceVariant' }}>
          <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}><I i='mdi:download-outline' s={18} /></ListItemIcon><Typography variant='body2' sx={{ fontWeight: 500, color: 'inherit' }}>Download</Typography>
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default PdfFileCard
