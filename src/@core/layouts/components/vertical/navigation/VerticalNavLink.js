// ** Next Imports
import Link from 'next/link'
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'

// ** Configs Import
import themeConfig from 'src/configs/themeConfig'

// ** Custom Components Imports
import UserIcon from 'src/layouts/components/UserIcon'
import Translations from 'src/layouts/components/Translations'
import CanViewNavLink from 'src/layouts/components/acl/CanViewNavLink'

// ** Util Import
import { handleURLQueries } from 'src/@core/layouts/utils'
import { Avatar } from '@mui/material'

// ** Styled Components
const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
  width: '100%',
  borderRadius: 8,
  transition: 'padding-left .25s ease-in-out',
  '&.active': {
    '&, &:hover': {
      backgroundColor: theme.palette.primary.light,
      '&.Mui-focusVisible': {
        backgroundColor: theme.palette.primary.main
      }
    },
    '& .MuiTypography-root': {
      fontWeight: 500,
      color: `${theme.palette.common.white} !important`
    },
    '& .MuiListItemIcon-root': {
      color: `${theme.palette.common.white} !important`
    }
  }
}))

const MenuItemTextMetaWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  transition: 'opacity .25s ease-in-out',
  ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
}))

const VerticalNavLink = ({
  item,
  parent,
  navHover,
  settings,
  navVisible,
  isSubToSub,
  collapsedNavWidth,
  toggleNavVisibility,
  navigationBorderWidth
}) => {
  // ** Hooks
  const router = useSafeRouter()

  // ** Vars
  const { navCollapsed } = settings
  const icon = parent && !item.icon ? themeConfig.navSubItemIcon : item.icon

  // const isNavLinkActive = () => {
  //   if (router.pathname === item.path || handleURLQueries(router, item.path)) {
  //     return true
  //   } else {
  //     return false
  //   }
  // }
  const isNavLinkActive = () => {
    // Bill Desk (2 Nov): an item can say which pages it owns by their address, so its section stays lit on detail and
    // form pages too, and before the router has filled in its query
    if (typeof item.activeTest === 'function') return item.activeTest(String(router.asPath || '').split(/[?#]/)[0], router)
    // Check activeWhen array first if it exists
    if (item.activeWhen && Array.isArray(item.activeWhen)) {
      // Exact mode: compare against the route pattern only (query-proof in Pages Router).
      // Needed for items whose path is a prefix of sibling routes (e.g. a module root),
      // where handleURLQueries' startsWith check would false-positive on every subpage.
      if (item.activeWhenExact) {
        return item.activeWhen.some(path => router.pathname === path)
      }

      return item.activeWhen.some(path => router.pathname === path || handleURLQueries(router, path))
    }

    // Fall back to default behavior
    return router.pathname === item.path || handleURLQueries(router, item.path)
  }

  return (
    <CanViewNavLink navLink={item}>
      <ListItem
        disablePadding
        className='nav-link'
        disabled={item.disabled || false}
        sx={{
          mt: 1.5,
          transition: 'padding .25s ease-in-out',
          px: theme => (parent ? '0 !important' : `${theme.spacing(navCollapsed && !navHover ? 2 : 3)} !important`)
        }}
      >
        <MenuNavLink
          component={Link}
          {...(item.disabled && { tabIndex: -1 })}
          className={isNavLinkActive() ? 'active' : ''}
          href={item.path === undefined ? '/' : `${item.path}`}
          {...(item.openInNewTab ? { target: '_blank' } : null)}
          onClick={e => {
            if (item.path === undefined) {
              e.preventDefault()
              e.stopPropagation()
            }
            if (navVisible) {
              toggleNavVisibility()
            }
          }}
          sx={{
            py: 2.25,
            ...(item.disabled ? { pointerEvents: 'none', opacity: 0.45 } : { cursor: 'pointer' }),
            pr: navCollapsed && !navHover ? (collapsedNavWidth - navigationBorderWidth - 24 - 16) / 8 : 3,
            pl: navCollapsed && !navHover ? (collapsedNavWidth - navigationBorderWidth - 24 - 16) / 8 : 4
          }}
        >
          {isSubToSub ? null : (
            <ListItemIcon
              sx={{
                transition: 'margin .25s ease-in-out',
                color: parent ? 'text.secondary' : 'text.primary',
                ...(navCollapsed && !navHover ? { mr: 0 } : { mr: 2 }),
                ...(parent ? { ml: 2, mr: 4 } : {}),
                '& svg': {
                  ...(!parent ? { fontSize: '1.5rem' } : { fontSize: '0.5rem' }),
                  ...(parent && item.icon ? { fontSize: '0.875rem' } : {})
                }
              }}
            >
              {typeof icon === 'object' && Object.keys(icon).length ? (
                <Avatar
                  src={isNavLinkActive() ? item.activeIcon?.props?.src : item.icon?.props?.src}
                  alt={item.title}
                  style={{ width: '24px', height: '24px', borderRadius: 0 }}
                />
              ) : (
                <UserIcon icon={icon} />
              )}
            </ListItemIcon>
          )}

          <MenuItemTextMetaWrapper
            sx={{
              ...(isSubToSub ? { ml: 8 } : {}),
              ...(navCollapsed && !navHover ? { opacity: 0 } : { opacity: 1 })
            }}
          >
            <Typography
              {...((themeConfig.menuTextTruncate || (!themeConfig.menuTextTruncate && navCollapsed && !navHover)) && {
                noWrap: true
              })}
            >
              <Translations text={item.title} />
            </Typography>
            {item.badgeContent ? (
              <Chip
                size='small'
                label={item.badgeContent}
                color={item.badgeColor || 'primary'}
                sx={{ '& .MuiChip-label': { px: 2.5, lineHeight: 1.385, textTransform: 'capitalize' } }}
              />
            ) : null}
          </MenuItemTextMetaWrapper>
        </MenuNavLink>
      </ListItem>
    </CanViewNavLink>
  )
}

export default VerticalNavLink
