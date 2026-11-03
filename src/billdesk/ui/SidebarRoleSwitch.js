// Role switcher (from procure-web-lite): a person pill floating at the top right, over the Antz shell (Sourav, 2 Nov:
// "keep the shell as the Antz shell, move the switcher to top right floating"). It opens the three Bill Desk roles,
// plus Reset demo data (BD-16). It is the prototype's control, not part of the Antz screen, so it sits apart from it.
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Avatar, Box, ButtonBase, Divider, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { ROLES, useRole, setRole } from '../roles'
import { resetDemo } from '../store'

const SidebarRoleSwitch = () => {
  const router = useRouter()
  const [anchor, setAnchor] = useState(null)
  const role = useRole() // a link to another role's page switches it too
  const cur = ROLES.find(r => r.value === role) || ROLES[0]

  return (
    <Box sx={{ position: 'fixed', top: 14, right: 24, zIndex: 1150 /* above the app bar (1100), under drawers (1200) and dialogs (1300) */ }}>
      <ButtonBase onClick={e => setAnchor(e.currentTarget)} aria-haspopup='menu' aria-label={`Viewing as ${cur.label}. Change role`}
        sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: '6px 12px 6px 6px', borderRadius: '24px', textAlign: 'left', bgcolor: 'background.paper', boxShadow: theme => `0 0 0 1px ${theme.palette.customColors.SurfaceVariant}, 0 6px 20px rgba(0,0,0,0.10)` }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 600, bgcolor: 'customColors.OnBackground', color: 'customColors.OnSurface' }}>{cur.initials}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='body2' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant', lineHeight: 1.3 }} noWrap>{cur.person}</Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', lineHeight: 1.3, display: 'block' }}>{cur.label}</Typography>
        </Box>
        <Icon icon='mdi:unfold-more-horizontal' fontSize={18} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { width: 236, mt: 1, borderRadius: '10px' } } }}>
        <Typography variant='caption' sx={{ px: 4, py: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', color: 'customColors.neutralSecondary' }}>View as</Typography>
        {ROLES.map(r => (
          <MenuItem key={r.value} selected={r.value === role} sx={{ gap: 2.5 }}
            onClick={() => { setRole(r.value); setAnchor(null); router.push(r.home) }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 600, bgcolor: 'customColors.OnBackground', color: 'customColors.OnSurface' }}>{r.initials}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>{r.label}</Typography>
              <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>{r.person}</Typography>
            </Box>
            {r.value === role && <ListItemIcon sx={{ minWidth: 0, color: 'primary.main' }}><Icon icon='mdi:check' fontSize={18} /></ListItemIcon>}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem sx={{ gap: 2.5 }} onClick={() => { setAnchor(null); if (window.confirm('Reset Bill Desk to the sample data? Your changes in this browser are lost.')) { resetDemo(); toast.success('Sample data restored') } }}>
          <Icon icon='mdi:restore' fontSize={18} />
          <Typography variant='body2'>Reset demo data</Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default SidebarRoleSwitch
