// The compliance build's upload attachment (compliance-lite drawers/_scaffold.tsx UploadZone, with the saved-file rows
// of UploadPlaceField): a dashed full-width "Upload document" button with a paperclip, and one white 52px row per
// file with its icon, name, size and a red trash. Several photos or PDFs at once, no categories (Sourav, 31 Oct).
// A row opens the viewer.
import { useRef, useState } from 'react'
import { Box, Button, IconButton, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { fileToDoc, isPdf } from './docStore'

const fmtSize = n => (n ? (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : '')

// one file: icon, name over size, remove. Sized to its two lines with even padding (Sourav, 2 Nov: "spacing looks off")
export const UploadRow = ({ doc, onOpen, onRemove }) => (
  <Box onClick={onOpen} sx={{ display: 'flex', alignItems: 'center', gap: 3, minHeight: 56, py: '8px', pl: 3, pr: 1.5, borderRadius: '8px', border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, bgcolor: 'common.white', ...(onOpen && { cursor: 'pointer', '&:hover': { borderColor: 'customColors.OutlineVariant' } }) }}>
    <Icon icon={isPdf(doc) ? 'mdi:file-pdf-box' : 'mdi:file-image-outline'} fontSize='1.5rem' color={isPdf(doc) ? '#FA6140' : undefined} />
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <Typography variant='body2' sx={{ color: 'customColors.OnSurfaceVariant', lineHeight: 1.3 }} noWrap title={doc.name}>{doc.name}</Typography>
      {doc.size ? <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', lineHeight: 1.3 }}>{fmtSize(doc.size)}</Typography> : null}
    </Box>
    {onRemove && <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', flexShrink: 0 }}><IconButton size='small' color='error' title='Remove' onClick={onRemove}><Icon icon='mdi:trash-can-outline' fontSize='1.15rem' /></IconButton></Box>}
  </Box>
)

// fill: the zone takes the height it is given (the paper half of a split form), the button growing into what is left
const UploadZone = ({ label = 'Upload document', docs = [], by, onAdd, onRemove, onOpen, accept = 'image/*,application/pdf', fill = false, pdfOnly = false, bad = false, across = false }) => {
  const up = useRef(null)
  const [busy, setBusy] = useState(false)
  const pick = async e => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    const made = []
    for (const f of files) {
      if (pdfOnly && !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) { toast.error(`${f.name}: only PDF files`); continue }
      try { made.push(await fileToDoc(f, 'doc', by)) } catch (err) { toast.error(err.message) }
    }
    setBusy(false)
    if (made.length) onAdd(made)
  }

  const input = <input ref={up} hidden type='file' accept={accept} multiple onChange={pick} />
  // with files in, adding another is a square + beside them (Sourav, 2 Nov: "a plus button beside, and not below")
  // across (Sourav, 2 Nov: "attachments should be sideways"): with `across`, the files sit in a row of three, each a third
  // of the width like the challan cards, and the + follows the last file
  if (docs.length && across) return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '16px' }}>
      {docs.map((d, i) => <Box key={d.id} sx={{ width: 'calc((100% - 32px) / 3)', minWidth: 0 }}><UploadRow doc={d} onOpen={onOpen ? () => onOpen(i) : undefined} onRemove={onRemove ? () => onRemove(d.id) : undefined} /></Box>)}
      {/* a labelled button, as tall as a file row (Sourav, 2 Nov: "have add attachment text") */}
      <Button variant='outlined' disabled={busy} onClick={() => up.current?.click()} startIcon={<Icon icon={busy ? 'mdi:loading' : 'mdi:plus'} />}
        sx={{ height: 56, flex: 'none', px: 5, borderStyle: 'dashed', borderColor: 'customColors.OutlineVariant', color: 'primary.main', '&:hover': { borderStyle: 'dashed' } }}>Add attachment</Button>
      {input}
    </Box>
  )
  if (docs.length) return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {docs.map((d, i) => <UploadRow key={d.id} doc={d} onOpen={onOpen ? () => onOpen(i) : undefined} onRemove={onRemove ? () => onRemove(d.id) : undefined} />)}
      </Box>
      <IconButton aria-label='Add another file' title='Add another file' disabled={busy} onClick={() => up.current?.click()}
        sx={{ width: 56, height: 56, flex: 'none', borderRadius: '8px', border: theme => `1px dashed ${theme.palette.customColors.OutlineVariant}`, color: 'primary.main' }}>
        <Icon icon={busy ? 'mdi:loading' : 'mdi:plus'} fontSize='1.4rem' />
      </IconButton>
      {input}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...(fill && { height: '100%' }), ...(across && { width: 'calc((100% - 32px) / 3)' }) }}>
      <Button component='label' variant='outlined' color='inherit' disabled={busy} startIcon={<Icon icon={busy ? 'mdi:loading' : 'mdi:paperclip'} />} fullWidth
        sx={{ borderStyle: 'dashed', color: 'primary.main', borderColor: bad ? 'error.main' : 'customColors.OutlineVariant', height: 56, justifyContent: 'center' }}>
        {label}
        <input hidden type='file' accept={accept} multiple onChange={pick} />
      </Button>
    </Box>
  )
}

export default UploadZone
