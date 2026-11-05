// Add GRN (Sourav, 5 Nov: "In to group, i should have option to Add GRN"): the Challans page's header action for the
// clerk. A 562px right sheet in the Add challans sheet's shape: the vendor, then that vendor's challans still to group as
// picker cards (white, green border when picked, the tick box in a tinted panel on the right), Make GRN at the foot.
// Ticking rows on Challans › To Group stays the other way in.
import { useState } from 'react'
import { Box, Checkbox, Drawer, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import { FIELD_SX } from '../ui/fieldStyle'
import { vendorOf, itemOf, whOf } from '../store'
import { fmtDay } from '../logic'
import { C, I, Btn } from '../ui/ui'

// grn: adding to that GRN (its vendor fixed, 5 Nov) instead of making a new one
const AddGrnSheet = ({ s, free, onClose, onMake, onPeek, grn }) => {
  const vendors = [...new Set(free.map(d => d.vendorId))].map(v => vendorOf(s, v)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const [vendor, setVendor] = useState(grn ? grn.vendorId : vendors.length === 1 ? vendors[0].id : '')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState([])
  const t = q.trim().toLowerCase()
  const list = free.filter(d => d.vendorId === vendor)
    .filter(d => !t || d.dcNumber.toLowerCase().includes(t) || d.lines.some(l => (itemOf(s, l.itemId)?.name || '').toLowerCase().includes(t)))
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const all = list.length > 0 && list.every(d => pick.includes(d.dcNumber))

  return (
    <Drawer anchor='right' open onClose={onClose} slotProps={{ paper: { sx: { width: 562, maxWidth: '100vw' } } }}><Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={[{ p: '20px 24px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 'none' }, FIELD_SX]}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant='h6' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{grn ? `Add challans to ${grn.id}` : 'Add GRN'}</Typography>{grn && <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{vendorOf(s, grn.vendorId)?.name}</Typography>}</Box>
          <IconButton aria-label='Close' size='small' onClick={onClose}><I i='mdi:close' s={22} /></IconButton>
        </Box>
        {/* a GRN holds one vendor's challans (BD-72), so the vendor comes first */}
        {!grn && <TextField select label='Vendor' value={vendor} onChange={e => { setVendor(e.target.value); setPick([]) }} fullWidth
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, renderValue: v => vendorOf(s, v)?.name || <Box component='span' sx={{ color: C.quiet }}>Pick the vendor</Box> } }} sx={{ '& .MuiInputBase-root': { bgcolor: C.white } }}>
          {vendors.map(v => { const n = free.filter(d => d.vendorId === v.id).length; return (
            <MenuItem key={v.id} value={v.id} sx={{ display: 'flex', gap: 4 }}><Box component='span' sx={{ flex: 1 }}>{v.name}</Box><Box component='span' sx={{ color: C.quiet }}>{n} to group</Box></MenuItem>
          ) })}
        </TextField>}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'customColors.Background', borderTop: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, p: '16px 24px' }}>
        {!vendor
          ? <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', textAlign: 'center', py: 10 }}>Pick the vendor to see their challans still to group.</Typography>
          : <>
              <Box sx={FIELD_SX}>
                <TextField value={q} onChange={e => setQ(e.target.value)} placeholder='Search challan number or item' fullWidth sx={{ mb: 4, '& .MuiInputBase-root': { bgcolor: C.white, height: 56 } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position='start'><I i='mdi:magnify' c={C.quiet} /></InputAdornment> } }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', flex: 1 }}>Challans to group ({list.length})</Typography>
                {list.length > 1 && <Btn kind='ghost' onClick={() => setPick(all ? [] : list.map(d => d.dcNumber))}>{all ? 'Clear all' : 'Select all'}</Btn>}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {list.map(d => {
                  const on = pick.includes(d.dcNumber)
                  const items = d.lines.map(l => itemOf(s, l.itemId)?.name).filter(Boolean)

                  return (
                    <Box key={d.dcNumber} onClick={() => setPick(p => (on ? p.filter(x => x !== d.dcNumber) : [...p, d.dcNumber]))}
                      sx={{ display: 'flex', alignItems: 'stretch', borderRadius: '10px', overflow: 'hidden', bgcolor: 'common.white', cursor: 'pointer', transition: 'border-color .15s',
                        border: theme => `1.5px solid ${on ? theme.palette.primary.main : theme.palette.customColors.SurfaceVariant}`, '&:hover': { borderColor: on ? 'primary.main' : 'customColors.Outline' } }}>
                      <Box sx={{ px: 4, py: 3, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant='body1' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{d.dcNumber}</Typography>
                          <Typography variant='body2' noWrap sx={{ color: 'customColors.neutralSecondary' }}>{fmtDay(d.receivedAt)} · {whOf(s, d.warehouseId)} · {items.slice(0, 2).join(', ')}{items.length > 2 ? ` +${items.length - 2}` : ''}</Typography>
                        </Box>
                        <IconButton aria-label={`View ${d.dcNumber}`} size='small' onClick={e => { e.stopPropagation(); onPeek(d.dcNumber) }} sx={{ color: 'customColors.neutralSecondary' }}><I i='mdi:eye-outline' s={20} /></IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, bgcolor: on ? 'customColors.OnBackground' : 'customColors.Surface' }}>
                        <Checkbox checked={on} size='small' tabIndex={-1} sx={{ p: 0, pointerEvents: 'none' }} />
                      </Box>
                    </Box>
                  )
                })}
                {!list.length && <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', textAlign: 'center', py: 6 }}>No challans match.</Typography>}
              </Box>
            </>}
      </Box>
      <Box sx={{ p: '16px 24px', flex: 'none', display: 'flex', justifyContent: 'flex-end', gap: '12px', bgcolor: 'common.white' }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind='pri' icon={grn ? 'mdi:plus' : 'mdi:file-document-plus-outline'} disabled={!pick.length} onClick={() => onMake(pick)}>{grn ? (pick.length ? `Add ${pick.length} ${pick.length === 1 ? 'challan' : 'challans'}` : 'Add challans') : pick.length ? `Make GRN (${pick.length} ${pick.length === 1 ? 'challan' : 'challans'})` : 'Make GRN'}</Btn>
      </Box>
    </Box></Drawer>
  )
}

export default AddGrnSheet
