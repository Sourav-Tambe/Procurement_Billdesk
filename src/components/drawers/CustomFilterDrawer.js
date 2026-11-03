import React from 'react'
import { Drawer, Box, Typography, IconButton, List, ListItemText, Button, Badge, ListItemButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

const CustomFilterDrawer = ({
  open,
  onClose,
  title = 'Filter',
  onApply,
  onClearAll,
  filterLists = [],
  filterLabels,
  selectedOptions,
  children,
  isSubmitting,
  selectedItem,
  onSelectItem,
  zIndex
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const getMenuBadgeCount = menuName => {
    return selectedOptions[menuName]?.length || 0
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ ...(zIndex && { zIndex }) }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: theme.palette.customColors.Background,
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 3 }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVarient }}>
            {title === 'Filter' ? t('filter') : title}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      {/* Content Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flex: 1,
          overflow: 'hidden',
          px: 5
        }}
      >
        {/* Filter List Section */}
        <Box
          sx={{
            width: { xs: '100%', sm: 200 },
            flexShrink: 0,
            overflowY: 'auto'
          }}
        >
          <List sx={{ p: 0 }}>
            {filterLists?.map(item => (
              <ListItemButton
                key={item}
                onClick={() => onSelectItem(item)}
                sx={{
                  color: 'primary.light',
                  fontSize: '16px',
                  fontWeight: 400,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  backgroundColor: selectedItem === item ? theme.palette.customColors.OnPrimary : 'transparent',
                  '&:hover': {
                    backgroundColor:
                      selectedItem === item
                        ? theme.palette.customColors.OnPrimary
                        : alpha(theme.palette.customColors.OnPrimary, 0.8)
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '16px', color: theme.palette.primary.OnSurface }}>{filterLabels?.[item] || item}</Typography>
                      <Badge badgeContent={getMenuBadgeCount(item)} color='primary' sx={{ ml: 2 }} />
                    </Box>
                  }
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: theme.palette.customColors.OnSurfaceVarient,
                      fontSize: '16px'
                    }
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Main Content Section */}
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.customColors.OnPrimary,
            borderTopRightRadius: '8px',
            p: '24px',
            pb: 0,
            flex: 1
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Footer Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: theme.palette.customColors.OnPrimary,
          px: 4,
          py: 6,
          boxShadow: `0px 4px 21px 0px ${alpha(theme.palette.primary.deepDark, 0.4)}`,
          gap: 2,
          flexShrink: 0
        }}
      >
        <Button size='large' variant='outlined' fullWidth onClick={onClearAll}>
          {t('clear_all')}
        </Button>
        <Button size='large' variant='contained' fullWidth onClick={onApply} disabled={isSubmitting}>
          {t('apply_filter')}
        </Button>
      </Box>
    </Drawer>
  )
}

export default CustomFilterDrawer
