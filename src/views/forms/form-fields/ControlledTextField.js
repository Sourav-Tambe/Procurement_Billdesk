import React from 'react'
import { Controller } from 'react-hook-form'
import { FormHelperText, TextField } from '@mui/material'
import Utility from 'src/utility'

const ControlledTextField = ({
  name,
  label,
  control,
  errors,
  required = false,
  fullWidth = true,
  type = 'text',
  disabled = false,
  readOnly = false,
  onChangeOverride,
  inputSlotProps = {},
  inputProps = {},
  onKeyDown,
  onPaste,
  onInput,
  dateReader = false,
  formHelperTextBackgroundColor = 'inherit',
  inputBackgroundColor = 'inherit',
  borderRadius = '10px',
  placeholder = '',
  sx = {},
  size = 'large'
}) => {
  // const error = get(errors, name)
  // const helperText = error?.message || ''

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => {
        const error = fieldState.error
        const helperText = error?.message || ''

        return (
          <TextField
            {...field}
            fullWidth={fullWidth}
            value={dateReader && field.value ? Utility?.formatDisplayDate(field.value) : field.value}
            type={type}
            label={label}
            placeholder={placeholder}
            onWheel={event => event.target.blur()}
            disabled={disabled}
            error={Boolean(error)}
            helperText={helperText}
            onChange={e => {
              let value = e?.target ? e.target.value : e
              if (type === 'number') {
                // disable negative values
                if (value === '' || Number(value) >= 0) {
                  field.onChange(e)
                  if (onChangeOverride) onChangeOverride(e)
                }

                return
              }
              field.onChange(e)
              if (onChangeOverride) onChangeOverride(e)
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onInput={onInput}
            slotProps={{
              input: {
                readOnly,
                ...inputSlotProps
              },
              htmlInput: inputProps,
              formHelperText: {
                sx: {
                  // backgroundColor: formHelperTextBackgroundColor,
                  margin: 0,
                  px: '14px',
                  pt: '3px'
                }
              }
            }}
            sx={{
              ...sx,
              '& .MuiFormControl-root .MuiTextField-root': {
                borderRadius: borderRadius
              },
              '& .MuiInputBase-input': {
                borderRadius: borderRadius,
                backgroundColor: inputBackgroundColor ? inputBackgroundColor : 'inherit'
              },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0
              },

              /* Firefox */
              '& input[type=number]': {
                MozAppearance: 'textfield'
              },

              '& .MuiInputBase-input': {
                borderRadius: borderRadius,
                backgroundColor: inputBackgroundColor || 'inherit'
              }
            }}
          />
        )
      }}
    />
  )
}

export default React.memo(ControlledTextField)
