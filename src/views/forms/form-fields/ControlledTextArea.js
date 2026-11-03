import React from 'react'
import { Controller } from 'react-hook-form'
import get from 'lodash/get'
import { FormControl, FormHelperText, TextField } from '@mui/material'

const ControlledTextArea = ({
  name,
  label,
  control,
  errors,
  required = false,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  rows = 4,
  placeholder,
  onChangeOverride,
  inputProps = {},
  onKeyDown,
  onPaste,
  onInput,
  sx = {},
  inputBackgroundColor
}) => {
  const error = get(errors, name) //  safely access nested error
  const helperText = error?.message || ''

  return (
    <FormControl fullWidth={true}>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth={fullWidth}
            value={field.value || ''}
            label={label}
            placeholder={placeholder}
            multiline
            rows={rows}
            disabled={disabled}
            error={Boolean(error)}
            // helperText={helperText}
            onChange={e => {
              field.onChange(e)
              if (onChangeOverride) onChangeOverride(e)
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onInput={onInput}
            sx={{
              ...sx,
              '& .MuiOutlinedInput-root, & .MuiFilledInput-root': {
                backgroundColor: inputBackgroundColor ? inputBackgroundColor : 'inherit'
              }
            }}
            slotProps={{
              input: { readOnly },
              htmlInput: inputProps
            }}
          />
        )}
      />
      {error && <FormHelperText sx={{ color: 'red' }}>{error?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledTextArea)
