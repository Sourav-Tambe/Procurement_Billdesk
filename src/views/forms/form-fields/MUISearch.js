import React from 'react'
import { TextField, InputAdornment, IconButton, FormControl } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { useTheme } from '@mui/material/styles'

const MUISearch = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'small',

  // width = '100%',
  sx = {},
  textFieldSX = {},
  backgroundColor,
  borderRadius,
  inputStyle,
  disabled = false
}) => {
  const theme = useTheme()
  const iconColor = theme.palette.customColors.neutralSecondary

  return (
    <FormControl fullWidth sx={{ ...sx }}>
      <TextField
        variant='outlined'
        size={size}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        sx={{
          width: '100%',
          '& .MuiBox-root': {
            backgroundColor: 'transparent'
          },
          '& .MuiInputBase-root': {
            backgroundColor: backgroundColor || 'transparent',
            borderRadius: borderRadius || '8px',
            height: textFieldSX?.height || 'auto', // allow height from parent
            minHeight: textFieldSX?.height || 'auto',
            paddingRight: '4px'
          },
          '& .MuiInputBase-input': {
            height: '100%',
            boxSizing: 'border-box',
            padding: '10px 8px',
            ...inputStyle
          },
          ...textFieldSX
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' color={iconColor} />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={onClear} aria-label='clear search' disabled={disabled}>
                  <ClearIcon fontSize='small' color={iconColor} />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        }}
      />
    </FormControl>
  )
}

export default MUISearch
