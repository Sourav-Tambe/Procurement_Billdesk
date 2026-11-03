import { FC, ReactNode } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { alpha, Button, Theme, useTheme } from '@mui/material'

import Icon from 'src/@core/components/icon'

interface CommonMastersDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: string
  iconAlt?: string
  children: ReactNode
  onSubmit?: () => void // why Optional? because in some cases we might want to use this drawer just for display purposes without any action button in the footer.
  submitLabel?: string
  submitLoading?: boolean
  submitDisabled?: boolean
  drawerWidth?: number | string
  showIcon?: boolean
  showFooter?: boolean
  flat?: boolean // one white surface: no tinted body, no card inside the drawer (Procure Budgets)
}

const CommonMastersDrawer: FC<CommonMastersDrawerProps> = ({
  // Required props
  open,
  onClose,
  title,
  children,

  // Optional props
  icon = '/icons/activity_icon.png',
  iconAlt,

  onSubmit,
  submitLabel = 'Submit',
  submitLoading = false,
  submitDisabled = false,
  drawerWidth = 562,
  showIcon = true,
  showFooter = true,
  flat = false
}) => {
  const theme: Theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {showIcon && icon && <img src={icon} style={{ width: '30px', height: '30px' }} alt={iconAlt || title} />}
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {title}
          </Typography>
        </Box>

        <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          backgroundColor: flat ? theme.palette.background.paper : theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16,
          overflowY: 'auto'
        }}
      >
        {flat ? (
          children
        ) : (
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            {children}
          </Card>
        )}
      </Box>

      {/* Footer */}
      {showFooter && (
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark as string, 0.1)}`,
            bottom: 0,
            position: 'sticky',
            zIndex: 1
          }}
        >
          <Button
            variant='contained'
            onClick={onSubmit}
            loading={submitLoading}
            sx={{ flex: 1, py: 4 }}
            disabled={submitDisabled || submitLoading}
          >
            {submitLabel}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

export default CommonMastersDrawer
