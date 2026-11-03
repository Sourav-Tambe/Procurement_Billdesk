// Proof documents on screen (30 Oct): the attach zone used when a receipt or a bill is recorded (camera or upload →
// staged documents), the strip of thumbnails a record shows, and the viewer that opens the paper full size so the
// numbers on screen can be checked against it. Procurement look (newreq/ui).
import { useEffect, useRef, useState } from 'react'
import { Box, ButtonBase, Dialog, IconButton } from '@mui/material'
import toast from 'react-hot-toast'
import { C, Txt, I, Btn } from './ui'
import { fileToDoc, kindLabel, isPdf, useDocUrl } from './docStore'

const full = d => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')
const kb = n => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : '')

// one thumbnail: the image, a PDF mark, or a "no file" mark for a stub left by the old build
export const DocTile = ({ meta, size = 72, onClick, onRemove, sx }) => {
  const { url, missing } = useDocUrl(meta.legacy ? null : meta)
  const pdf = isPdf(meta)
  const gone = meta.legacy || missing

  return (
    <Box sx={{ position: 'relative', flex: 'none', ...sx }}>
      <ButtonBase onClick={onClick} disabled={!onClick || gone} title={`${kindLabel(meta.kind)} · ${meta.name}`} aria-label={`Open ${kindLabel(meta.kind)} ${meta.name}`} sx={{ width: size, height: size, borderRadius: '8px', border: `1px solid ${gone ? C.tert : C.line}`, bgcolor: '#FBFAF6', overflow: 'hidden', display: 'grid', placeItems: 'center', color: gone ? C.tert : C.outline, '&:hover': onClick && !gone ? { borderColor: C.outline } : {} }}>
        {gone
          ? <Box sx={{ display: 'grid', placeItems: 'center', gap: '2px' }}><I i='mdi:image-off-outline' s={Math.round(size * 0.34)} /><Txt t='sub' sx={{ fontSize: 12, fontWeight: 600 }}>No file</Txt></Box>
          : pdf
            ? <Box sx={{ display: 'grid', placeItems: 'center', gap: '2px' }}><I i='mdi:file-pdf-box' s={Math.round(size * 0.42)} c={C.tert} /><Txt t='sub' sx={{ fontSize: 12, fontWeight: 600, color: C.text }}>PDF</Txt></Box>
            : url
              ? <Box component='img' src={url} alt='' sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <I i='mdi:image-outline' s={Math.round(size * 0.34)} />}
      </ButtonBase>
      {onRemove && <IconButton aria-label={`Remove ${meta.name}`} size='small' onClick={onRemove} sx={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, bgcolor: 'rgba(0,0,0,.55)', color: C.white, '&:hover': { bgcolor: 'rgba(0,0,0,.7)' } }}><I i='mdi:close' s={14} /></IconButton>}
    </Box>
  )
}

// a record's documents in a row; a tile opens the viewer
export const DocStrip = ({ docs = [], size = 72, label = true, empty = 'No document attached', sx }) => {
  const [open, setOpen] = useState(null)
  if (!docs.length) return <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', ...sx }}><Box component='span' sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.tert, flex: 'none' }} /><Txt t='body' c={C.tert}>{empty}</Txt></Box>

  return (
    <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', ...sx }}>
      {docs.map((d, i) => (
        <Box key={d.id} sx={{ display: 'flex', flexDirection: 'column', gap: '6px', width: size }}>
          <DocTile meta={d} size={size} onClick={() => setOpen(i)} />
          {label && <Txt t='sub' c={C.quiet} noWrap title={d.name}>{kindLabel(d.kind)}</Txt>}
        </Box>
      ))}
      {open != null && <DocViewer docs={docs.filter(d => !d.legacy)} index={docs.filter(d => !d.legacy).indexOf(docs[open])} onClose={() => setOpen(null)} />}
    </Box>
  )
}

// camera / upload zone (record receipt, record bill): files become staged documents through onAdd(docs)
export const AttachZone = ({ docs = [], kind, by, onAdd, onRemove, accept = 'image/*,application/pdf', camera = true, title = 'Take photo', upload = 'Upload', hint, size = 72, sx }) => {
  const cam = useRef(null), up = useRef(null)
  const [busy, setBusy] = useState(false)
  const take = async e => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    const made = []
    for (const f of files) { try { made.push(await fileToDoc(f, kind, by)) } catch (err) { toast.error(err.message) } }
    setBusy(false)
    if (made.length) onAdd(made)
  }
  const inputs = <>
    {camera && <input ref={cam} type='file' accept='image/*' capture='environment' hidden onChange={take} />}
    <input ref={up} type='file' accept={accept} multiple hidden onChange={take} />
  </>

  if (docs.length) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', ...sx }}>
      <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {docs.map(d => <DocTile key={d.id} meta={d} size={size} onRemove={onRemove ? () => onRemove(d.id) : null} />)}
        <ButtonBase onClick={() => up.current?.click()} disabled={busy} aria-label='Add another document' sx={{ width: size, height: size, borderRadius: '8px', border: `1px dashed ${C.line}`, color: C.text }}><I i={busy ? 'mdi:loading' : 'mdi:plus'} s={24} /></ButtonBase>
        {camera && <Btn icon='mdi:camera-outline' onClick={() => cam.current?.click()} disabled={busy} sx={{ height: 40 }}>{title}</Btn>}
      </Box>
      {hint && <Txt t='sub' c={C.quiet}>{hint}</Txt>}
      {inputs}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', ...sx }}>
      <Box sx={{ display: 'flex', height: 72, borderRadius: '10px', border: `1px dashed ${C.line}`, bgcolor: '#F7FAF9', color: C.text, overflow: 'hidden' }}>
        {camera && <><ButtonBase onClick={() => cam.current?.click()} disabled={busy} sx={{ flex: 1, gap: '8px', color: 'inherit' }}><I i='mdi:camera-outline' s={22} /><Txt t='bodyMedium'>{title}</Txt></ButtonBase><Box sx={{ width: '1px', my: '24px', bgcolor: C.line }} /></>}
        <ButtonBase onClick={() => up.current?.click()} disabled={busy} sx={{ flex: 1, gap: '8px', color: 'inherit' }}><I i={busy ? 'mdi:loading' : 'mdi:tray-arrow-up'} s={22} /><Txt t='bodyMedium'>{busy ? 'Reading…' : upload}</Txt></ButtonBase>
      </Box>
      {hint && <Txt t='sub' c={C.quiet}>{hint}</Txt>}
      {inputs}
    </Box>
  )
}

// the document fit to a frame (the match view's paper); click → full size
export const DocPaper = ({ meta, onOpen, ratio = '1 / 1.3', sx }) => {
  const { url, missing } = useDocUrl(meta)
  const pdf = isPdf(meta)

  return (
    <ButtonBase onClick={onOpen} disabled={!url} sx={{ width: '100%', aspectRatio: ratio, borderRadius: '10px', overflow: 'hidden', bgcolor: '#3A403D', display: 'grid', placeItems: 'center', ...sx }}>
      {url && !pdf && <Box component='img' src={url} alt={meta?.name || ''} sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />}
      {url && pdf && <Box component='iframe' title={meta?.name} src={`${url}#toolbar=0`} sx={{ width: '100%', height: '100%', border: 0, bgcolor: C.white, pointerEvents: 'none' }} />}
      {!url && <Box sx={{ display: 'grid', placeItems: 'center', gap: '6px', color: C.white }}><I i={missing || !meta ? 'mdi:image-off-outline' : 'mdi:loading'} s={28} /><Txt t='sub'>{!meta ? 'No paper on this record' : missing ? 'File not in this browser' : 'Loading'}</Txt></Box>}
      {url && <Box sx={{ position: 'absolute', right: 10, bottom: 10, height: 28, px: '10px', borderRadius: '14px', bgcolor: 'rgba(0,0,0,.6)', color: C.white, display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, fontWeight: 600 }}><I i='mdi:magnify-plus-outline' s={16} />Open</Box>}
    </ButtonBase>
  )
}

// the paper full size: image (click to zoom) or PDF, with what it is, who attached it and when; ← → between documents
export const DocViewer = ({ docs = [], index = 0, onClose, side = null }) => {
  const [i, setI] = useState(Math.max(0, index))
  const [zoom, setZoom] = useState(false)
  const meta = docs[i]
  const { url, missing } = useDocUrl(meta)
  useEffect(() => { setZoom(false) }, [i])
  useEffect(() => {
    const onKey = e => { if (e.key === 'ArrowRight') setI(x => Math.min(docs.length - 1, x + 1)); if (e.key === 'ArrowLeft') setI(x => Math.max(0, x - 1)) }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [docs.length])
  if (!meta) return null
  const pdf = isPdf(meta)

  return (
    <Dialog open onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: side ? 1280 : 960, maxWidth: 'calc(100vw - 32px)', height: 'min(860px, calc(100vh - 48px))', borderRadius: '16px', bgcolor: C.white, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
      <Box sx={{ p: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${C.n05}` }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Txt t='medium' c={C.black} sx={{ fontWeight: 600 }}>{kindLabel(meta.kind)}</Txt>
          <Txt t='body' c={C.quiet} noWrap>{meta.name}{meta.size ? ` · ${kb(meta.size)}` : ''}{meta.by ? ` · attached by ${meta.by}` : ''}{meta.at ? ` · ${full(meta.at)}` : ''}</Txt>
        </Box>
        {docs.length > 1 && <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconButton aria-label='Previous document' disabled={i === 0} onClick={() => setI(i - 1)}><I i='mdi:chevron-left' s={22} /></IconButton><Txt t='body' c={C.text}>{i + 1} of {docs.length}</Txt><IconButton aria-label='Next document' disabled={i === docs.length - 1} onClick={() => setI(i + 1)}><I i='mdi:chevron-right' s={22} /></IconButton></Box>}
        {!pdf && url && <Btn icon={zoom ? 'mdi:magnify-minus-outline' : 'mdi:magnify-plus-outline'} onClick={() => setZoom(z => !z)} sx={{ height: 40 }}>{zoom ? 'Fit' : 'Zoom'}</Btn>}
        {url && <Btn icon='mdi:open-in-new' component='a' href={url} target='_blank' rel='noreferrer' sx={{ height: 40 }}>Open</Btn>}
        <IconButton aria-label='Close' onClick={onClose} sx={{ color: C.quiet, mr: '-8px' }}><I i='mdi:close' s={22} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: side ? 'minmax(0,1fr) 420px' : 'minmax(0,1fr)' }}>
        <Box sx={{ minHeight: 0, overflow: 'auto', bgcolor: '#2B3330', display: 'grid', placeItems: zoom ? 'start' : 'center', p: zoom ? 0 : '24px' }}>
          {missing && <Txt t='body' c={C.white}>This file is not in this browser. Documents live where they were attached.</Txt>}
          {!missing && !url && <I i='mdi:loading' s={28} c={C.white} />}
          {url && pdf && <Box component='iframe' title={meta.name} src={url} sx={{ width: '100%', height: '100%', border: 0, bgcolor: C.white }} />}
          {url && !pdf && <Box component='img' src={url} alt={meta.name} onClick={() => setZoom(z => !z)} sx={zoom ? { width: '100%', height: 'auto', cursor: 'zoom-out', display: 'block' } : { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-in', boxShadow: '0 8px 30px rgba(0,0,0,.35)', borderRadius: '4px' }} />}
        </Box>
        {side && <Box sx={{ minHeight: 0, overflowY: 'auto', borderLeft: `1px solid ${C.n05}`, bgcolor: 'customColors.Background' }}>{side}</Box>}
      </Box>
    </Dialog>
  )
}
