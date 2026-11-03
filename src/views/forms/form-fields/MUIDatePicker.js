import React from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { CircularProgress, InputAdornment } from '@mui/material'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en' // Import more locales as needed

// Extend dayjs with plugins
dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)

const locale = 'en' // e.g., 'fr', 'de', 'hi', etc.

const MUIDatePicker = ({
  value,
  onChange,
  onAccept,
  label = 'Select Date',
  minDate,
  maxDate,
  format = 'Do MMM YYYY',
  views,
  disabled = false,
  error = false,
  helperText = '',
  sx = {},
  size = 'medium',
  loader = false
}) => {
  dayjs.locale(locale)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      <DatePicker
        value={value}
        onChange={onChange}
        onAccept={onAccept}
        label={label}
        disabled={disabled}
        views={views && views}
        format={format}
        minDate={minDate}
        maxDate={maxDate}
        loading={loader}
        slotProps={{
          textField: {
            fullWidth: true,
            size: size,
            error,
            helperText,
            sx: {
              '& .MuiInputAdornment-root .MuiIconButton-root': {
                alignSelf: 'center'
              },
              '& .MuiInputBase-root': {
                alignItems: 'center'
              },
              ...sx
            },
            ...(loader && {
              InputProps: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }
            })
          }
        }}
        sx={{
          width: '100%',
          ...sx
        }}
      />
    </LocalizationProvider>
  )
}

export default React.memo(MUIDatePicker)
