import React from 'react'
import { Controller } from 'react-hook-form'
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material'
import get from 'lodash/get'

const ControlledSelect = ({
  name,
  label,
  control,
  errors,
  options = [],
  required = false,
  fullWidth = true,
  size = 'large',
  getOptionLabel = option => option,
  getOptionValue = option => option,
  isOptionDisabled = () => false,
  onChangeExtra = () => {},
  disabled = false,
  sx = {
    color: 'text.primary',
    '.MuiSelect-select': {
      color: 'text.primary'
    }
  },
  formControlSx = {}
}) => {
  const fieldError = get(errors, name)

  return (
    <FormControl size={size} fullWidth={fullWidth} error={Boolean(fieldError)} sx={formControlSx}>
      <InputLabel
        id={`${name}-label`}
        sx={{
          color: fieldError ? 'error.main' : 'text.secondary',
          '&.Mui-focused': {
            color: fieldError ? 'error.main' : 'primary.main'
          }
        }}
      >
        {label}
      </InputLabel>
      <Controller
        name={name}
        control={control}
        rules={{ required }}
        render={({ field }) => (
          <Select
            {...field}
            labelId={`${name}-label`}
            label={label}
            disabled={disabled}
            error={Boolean(fieldError)}
            sx={sx}
            onChange={e => {
              field.onChange(e)
              onChangeExtra(e)
            }}
          >
            {options.map((option, index) => (
              <MenuItem key={index} value={getOptionValue(option)} disabled={isOptionDisabled(option)}>
                {getOptionLabel(option)}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {fieldError && <FormHelperText>{fieldError?.message}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledSelect)

// Updated code

// import React from 'react'
// import { Controller } from 'react-hook-form'
// import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material'

// const ControlledSelect = ({
//   name,
//   label,
//   control,
//   errors,
//   options = [],
//   required = false,
//   fullWidth = true,
//   size = 'large',
//   getOptionLabel = option => option,
//   getOptionValue = option => option,
//   isOptionDisabled = () => false,
//   onChangeExtra = () => {},
//   disabled = false,
//   sx = {}
// }) => {
//   return (
//     <Controller
//       name={name}
//       control={control}
//       rules={{ required }}
//       render={({ field, fieldState }) => {
//         const error = fieldState.error
//         const helperText = error?.message || ''

//         return (
//           <FormControl size={size} fullWidth={fullWidth} error={Boolean(error)}>
//             <InputLabel
//               id={`${name}-label`}
//               sx={{
//                 color: error ? 'error.main' : 'text.primary',
//                 '&.Mui-focused': {
//                   color: error ? 'error.main' : 'primary.main'
//                 }
//               }}
//             >
//               {label}
//             </InputLabel>
//             <Select
//               {...field}
//               labelId={`${name}-label`}
//               label={label}
//               disabled={disabled}
//               error={Boolean(error)}
//               sx={sx}
//               onChange={e => {
//                 field.onChange(e)
//                 onChangeExtra(e)
//               }}
//             >
//               {options.map((option, index) => (
//                 <MenuItem key={index} value={getOptionValue(option)} disabled={isOptionDisabled(option)}>
//                   {getOptionLabel(option)}
//                 </MenuItem>
//               ))}
//             </Select>
//             {helperText && <FormHelperText sx={{ ml: '14px' }}>{helperText}</FormHelperText>}
//           </FormControl>
//         )
//       }}
//     />
//   )
// }

// export default React.memo(ControlledSelect)
