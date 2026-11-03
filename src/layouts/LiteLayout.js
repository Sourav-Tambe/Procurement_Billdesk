// Bill Desk layout (from procure-web-lite): the Antz core layout with the Bill Desk menu for the role and a slim app
// bar (menu button). The role switcher floats at the top right, over the bar (2 Nov).
import { useEffect, useState } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Layout from 'src/@core/layouts/Layout'
import Icon from 'src/@core/components/icon'
import billDeskNavigation from 'src/billdesk/nav'
import SidebarRoleSwitch from 'src/billdesk/ui/SidebarRoleSwitch'
import { useRole } from 'src/billdesk/roles'
import { useBillDesk } from 'src/billdesk/store'
import { useSettings } from 'src/@core/hooks/useSettings'

const Bar = ({ hidden, toggleNavVisibility }) => {
  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>{hidden ? <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}><Icon icon='mdi:menu' /></IconButton> : null}</Box>
    </Box>
  )
}

const LiteLayout = ({ children, contentHeightFixed }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { settings, saveSettings } = useSettings()
  useBillDesk() // redraw when the data changes, so the menu counts stay current
  useRole() // and when the role changes
  const navItems = billDeskNavigation()
  const hidden = useMediaQuery(theme => theme.breakpoints.down('lg'))
  if (settings.layout === 'horizontal') settings.layout = 'vertical'
  return (
    <Layout hidden={hidden} settings={settings} saveSettings={saveSettings} contentHeightFixed={contentHeightFixed}
      verticalLayoutProps={{ navMenu: { navItems: mounted ? navItems : [] }, appBar: { content: props => <Bar hidden={hidden} toggleNavVisibility={props.toggleNavVisibility} /> } }}>
      {children}
      {mounted && <SidebarRoleSwitch />}
    </Layout>
  )
}
export default LiteLayout
