import React from 'react'
import { TextField, InputAdornment, IconButton, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { useTheme } from '@mui/material/styles'

const Search = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  width = 300,
  sx = {},
  textFielsSX = {},
  backgroundColor,
  borderRadius,
  inputStyle,
  disabled = false,
  ref = null
}) => {
  const theme = useTheme()
  const iconColor = theme.palette.customColors.neutralSecondary

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: backgroundColor || 'transparent',
        borderRadius: borderRadius || '8px',
        ...sx
      }}
    >
      <TextField
        ref={ref} // Pass ref directly to TextField
        variant='outlined'
        size='small'
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        sx={{
          width: width,
          '& .MuiBox-root': {
            backgroundColor: 'transparent'
          },
          '& .MuiInputBase-root': {
            backgroundColor: backgroundColor || 'transparent',
            borderRadius: borderRadius || '8px',
            height: textFielsSX?.height || 'auto', // allow height from parent
            minHeight: textFielsSX?.height || 'auto',
            paddingRight: '4px'
          },
          '& .MuiInputBase-input': {
            height: '100%',
            boxSizing: 'border-box',
            padding: '10px 8px',
            ...inputStyle
          },
          ...textFielsSX
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
    </Box>
  )
}

export default React.memo(Search)