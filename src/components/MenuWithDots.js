import { useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material'

const MenuWithDots = ({ options, disabled = false, showBorder = false, borderColor, menuSx, menuItemSx, iconSx }) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <IconButton sx={iconSx} onClick={handleClick}>
        <Icon icon='mdi:dots-vertical' />
      </IconButton>
      <Menu
        sx={{
          minWidth: '400px',
          width: '400px',
          minHeight: '124px',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
          gap: '8px',
          '& .MuiPaper-root': {
            ...(showBorder && {
              border: `2px solid ${theme.palette.customColors.Outline || borderColor}`
            })
          },
          ...menuSx
        }}
        keepMounted
        id='long-menu'
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {options?.length > 0
          ? options?.map((option, index) => (
              <Box key={index}>
                <MenuItem
                  sx={{
                    color: 'customColors.neutralSecondary',
                    fontSize: '14px',
                    fontWeight: 400,
                    padding: '12px',
                    '&:hover': {
                      backgroundColor: 'customColors.displaybgPrimary'
                    },
                    borderBottom:
                      showBorder && index < options.length - 1
                        ? `1px solid ${borderColor || theme.palette.customColors?.OutlineVariant}`
                        : 'none',

                    ...menuItemSx
                  }}
                  disabled={disabled}
                  onClick={() => {
                    option.action()
                    handleClose()
                  }}
                >
                  {option.icon && <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>{option.icon}</Box>}
                  {option.label}
                </MenuItem>
              </Box>
            ))
          : null}
      </Menu>
    </Box>
  )
}

export default MenuWithDots
