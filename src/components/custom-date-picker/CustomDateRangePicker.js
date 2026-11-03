import { useState, forwardRef } from 'react'
import { Box, TextField } from '@mui/material'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { format } from 'date-fns/format'
import DatePicker from 'react-datepicker'
import { addMonths, subMonths } from 'date-fns'

const CustomDateRangePicker = ({
  label = 'Select Date Range',
  popperPlacement = 'bottom-start',
  monthsShown,
  shouldCloseOnSelect = true,
  initialStartDate = new Date(),
  initialEndDate = null,
  onChange = () => {},
  open,
  disableFutureDates,
  allowSingleDate = false,
  selectFutureDates = false
}) => {
  // ** States
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleOnChange = dates => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    onChange({ startDate: start, endDate: end })
  }

  const CustomInput = forwardRef(({ start, end, ...props }, ref) => {
    const startDateFormatted = start ? format(start, 'dd/MM/yyyy') : ''
    const endDateFormatted = end ? ` - ${format(end, 'dd/MM/yyyy')}` : ''
    const value = `${startDateFormatted}${endDateFormatted}`

    return <TextField inputRef={ref} label={props.label || ''} {...props} value={value} fullWidth />
  })

  // Calculate the initial month to display
  const currentDate = new Date()

  const initialMonth = selectFutureDates
    ? addMonths(currentDate, monthsShown - 2)
    : subMonths(currentDate, monthsShown - 1)

  return (
    <DatePickerWrapper>
      <Box
        sx={{
          p: 2,
          width: '100%'
        }}
      >
        <DatePicker
          selectsRange
          monthsShown={monthsShown}
          endDate={endDate}
          selected={startDate}
          startDate={startDate}
          shouldCloseOnSelect={shouldCloseOnSelect}
          onChange={handleOnChange}
          popperPlacement={popperPlacement}
          customInput={<CustomInput label={label} start={startDate} end={endDate} />}
          open={open ? open : false}
          minDate={selectFutureDates ? currentDate : null}
          maxDate={disableFutureDates ? disableFutureDates : null}
          showDisabledMonthNavigation
          openToDate={monthsShown ? initialMonth : null}
          showPreviousMonths={false}
          style={{ border: '1px solid red' }}
        />
      </Box>
    </DatePickerWrapper>
  )
}

export default CustomDateRangePicker
