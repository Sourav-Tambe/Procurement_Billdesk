import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Typography,
  Stack,
  Divider
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { addDays, addMonths, format, subDays, subMonths } from 'date-fns'
import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@emotion/react'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import CustomDateRangePicker from './CustomDateRangePicker'

const CommonDateRangePickers = ({
  onChange,
  filterDates,
  showFutureDates = false,
  showAllTime = false,
  useCustomText = false,
  customText = ''
}) => {
  const theme = useTheme()
  const router = useSafeRouter()
  const today = new Date()
  const [anchorEl, setAnchorEl] = useState(null)
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const initialSelectedRange = () => {
    if (useCustomText) {
      return customText
    } else if (showFutureDates) {
      return `All time - From - ${format(today, 'dd MMM yyyy')}`
    } else {
      return `All time - Upto - ${format(today, 'dd MMM yyyy')}`
    }
  }

  const [selectedRange, setSelectedRange] = useState(initialSelectedRange)
  const [tempRange, setTempRange] = useState({})
  const open = Boolean(anchorEl)

  const getDateRanges = showFutureDates => {
    const today = new Date()

    const futureDateRanges = [
      {
        label: 'Tomorrow',
        subLabel: format(addDays(today, 1), 'dd MMM yyyy'),
        startDate: addDays(today, 1),
        endDate: addDays(today, 1)
      },
      {
        label: 'Next 7 days',
        subLabel: `${format(today, 'dd MMM yyyy')} - ${format(addDays(today, 7), 'dd MMM yyyy')}`,
        startDate: today,
        endDate: addDays(today, 7)
      },
      {
        label: 'Next 1 month',
        subLabel: `${format(today, 'dd MMM yyyy')} - ${format(addMonths(today, 1), 'dd MMM yyyy')}`,
        startDate: today,
        endDate: addMonths(today, 1)
      },
      {
        label: 'Next 6 months',
        subLabel: `${format(today, 'dd MMM yyyy')} - ${format(addMonths(today, 6), 'dd MMM yyyy')}`,
        startDate: today,
        endDate: addMonths(today, 6)
      }
    ]

    const pastDateRanges = [
      {
        label: 'Yesterday',
        subLabel: format(subDays(today, 1), 'dd MMM yyyy'),
        startDate: subDays(today, 1),
        endDate: subDays(today, 1)
      },
      {
        label: 'Last 7 days',
        subLabel: `${format(subDays(today, 7), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
        startDate: subDays(today, 7),
        endDate: today
      },
      {
        label: 'Last 1 month',
        subLabel: `${format(subMonths(today, 1), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
        startDate: subMonths(today, 1),
        endDate: today
      },
      {
        label: 'Last 6 months',
        subLabel: `${format(subMonths(today, 6), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
        startDate: subMonths(today, 6),
        endDate: today
      }
    ]

    const initialRanges = []

    if (useCustomText) {
      initialRanges.push({
        label: customText,
        subLabel: '',
        startDate: null,
        endDate: null
      })
    } else {
      const allTimeLabel = showFutureDates
        ? `From - ${format(today, 'dd MMM yyyy')}`
        : `Upto - ${format(today, 'dd MMM yyyy')}`

      initialRanges.push({
        label: 'All time',
        subLabel: allTimeLabel,
        startDate: null,
        endDate: null
      })
    }

    return [
      ...initialRanges,
      {
        label: 'Today',
        subLabel: format(today, 'dd MMM yyyy'),
        startDate: today,
        endDate: today
      },
      ...(showFutureDates ? futureDateRanges : pastDateRanges),
      {
        label: 'Custom range',
        subLabel: 'Select a custom range',
        hasChevron: true
      }
    ]
  }

  const [dateRanges, setDateRanges] = useState(getDateRanges(showFutureDates))

  useEffect(() => {
    setDateRanges(getDateRanges(showFutureDates))
  }, [showFutureDates, useCustomText, customText])

  useEffect(() => {
    // Use a function to determine the initial range
    const getInitialRange = () => {
      if (useCustomText) {
        return customText
      } else {
        return `All time - ${showFutureDates ? 'From' : 'Upto'} - ${format(today, 'dd MMM yyyy')}`
      }
    }

    if (!filterDates || (!filterDates.startDate && !filterDates.endDate)) {
      // When filterDates is cleared or is All time
      setSelectedRange(getInitialRange())
    } else {
      // Proceed if dates are present
      const { startDate: startDateProp, endDate: endDateProp } = filterDates

      if (startDateProp && endDateProp) {
        const startDate = startDateProp instanceof Date ? startDateProp : new Date(startDateProp)
        const endDate = endDateProp instanceof Date ? endDateProp : new Date(endDateProp)

        // Check predefined ranges except All time and Custom
        const predefinedRanges = dateRanges.slice(1, -1)
        let matchedRange = null

        for (const range of predefinedRanges) {
          const rangeStart = range.startDate
          const rangeEnd = range.endDate

          if (
            rangeStart &&
            rangeEnd &&
            startDate.toDateString() === rangeStart.toDateString() &&
            endDate.toDateString() === rangeEnd.toDateString()
          ) {
            matchedRange = range
            break
          }
        }

        if (matchedRange) {
          setSelectedRange(`${matchedRange.label} - ${matchedRange.subLabel}`)
        } else {
          // Check if it's a single day
          if (startDate.toDateString() === endDate.toDateString()) {
            // Check if it's today
            if (startDate.toDateString() === today.toDateString()) {
              setSelectedRange(`Today - ${format(today, 'dd MMM yyyy')}`)
            } else {
              // Single day, not today
              const formattedDate = format(startDate, 'dd MMM yyyy')
              setSelectedRange(`Custom Range - ${formattedDate} - ${formattedDate}`)
            }
          } else {
            // Custom range
            const formattedStart = format(startDate, 'dd MMM yyyy')
            const formattedEnd = format(endDate, 'dd MMM yyyy')
            setSelectedRange(`Custom Range - ${formattedStart} - ${formattedEnd}`)
          }
        }
      }
    }
  }, [filterDates, showFutureDates, useCustomText, customText, today, dateRanges])

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = range => {
    if (range.label === 'Custom range') {
      setCustomDialogOpen(true)
    } else if (useCustomText && range.label === customText) {
      setSelectedRange(customText)
      onChange?.('', '')
    } else if (!useCustomText && range.label === 'All time') {
      const allTimeLabel = showFutureDates
        ? `All time - From - ${format(today, 'dd MMM yyyy')}`
        : `All time - Upto - ${format(today, 'dd MMM yyyy')}`
      setSelectedRange(allTimeLabel)
      onChange?.('', '')
    } else if (range.startDate && range.endDate) {
      setSelectedRange(`${range.label} - ${range.subLabel}`)
      onChange?.(range.startDate, range.endDate)
    }
    handleClose()
  }

  const handleDateChange = range => {
    setTempRange(range)
  }

  const handleApply = () => {
    if (tempRange.startDate && tempRange.endDate) {
      const newRange = `Custom Range - ${format(tempRange.startDate, 'dd MMM yyyy')} - ${format(
        tempRange.endDate,
        'dd MMM yyyy'
      )}`
      setSelectedRange(newRange) // Update selectedRange
      onChange?.(tempRange.startDate, tempRange.endDate)
    }
    setCustomDialogOpen(false) // Close dialog
  }

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          backgroundColor: 'customColors.Background',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pr: 2,
          width: '100%',
          '&:hover': {
            backgroundColor: '#E8EBE8'

            // customColors.neutral05
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: 'customColors.Outline',

            // borderRadius: '4px',
            borderRadius: '4px 0 0 4px',
            width: '40px',
            minHeight: '40px',
            maxHeight: '200px',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CalendarTodayIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography
          component='div'
          sx={{
            color: 'customColors.OnSurfaceVariant',
            fontSize: '16px',
            fontWeight: 500,
            flex: 1
          }}
        >
          <Box sx={{ display: { xs: 'block', md: 'inline' } }}>
            {selectedRange.split(' - ')[0]}
            <Box component='span' sx={{ display: { xs: 'none', md: 'inline' }, mx: 1 }}>
              -
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'block', md: 'inline' } }}>{selectedRange.split(' - ').slice(1).join(' - ')}</Box>
        </Typography>
      </Box>
      <Menu
        id='date-range-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        // eslint-disable-next-line lines-around-comment
        // PaperProps={{
        //   elevation: 3,
        //   sx: {
        //     width: '300px',
        //     maxHeight: 'none',
        //     mt: 1,
        //     '& .MuiList-root': {
        //       padding: 0
        //     }

        //     // borderRadius: '8px'
        //     // border: '1px solid #E0E0E0'
        //   }
        // }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              width: '300px',
              maxHeight: 'none',
              mt: 1,
              '& .MuiList-root': {
                padding: 0
              }

              // borderRadius: '8px'
              // border: '1px solid #E0E0E0'
            }
          },
          list: {
            'aria-labelledby': 'date-range-button'
          }
        }}
      >
        {dateRanges.map((range, index) => (
          <Box key={range.label}>
            <MenuItem
              key={range.label}
              onClick={() => {
                if (!(useCustomText && range.label === customText)) {
                  handleSelect(range)
                }
              }}
              disabled={useCustomText && range.label === customText}
              sx={{
                py: 3,
                px: 6,
                '&:hover': {
                  backgroundColor: useCustomText && range.label === customText ? 'none' : '#F8FAFB'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography
                    variant='body1'
                    sx={{
                      fontWeight: 500,
                      color: 'customColors.OnPrimaryContainer',
                      fontSize: '16px'
                    }}
                  >
                    {range.label}
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 400,
                      color: 'customColors.Outline',
                      fontSize: '14px'
                    }}
                  >
                    {range.subLabel}
                  </Typography>
                </Stack>
                {range.hasChevron && (
                  <ChevronRightIcon
                    sx={{
                      color: 'customColors.OnSurfaceVariant',
                      ml: 1
                    }}
                  />
                )}
              </Box>
            </MenuItem>
            {index < dateRanges.length - 1 && <Divider sx={{ m: 4, color: 'customColors.SurfaceVariant' }} />}
          </Box>
        ))}
      </Menu>
      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              height: { xs: '400px', sm: '460px', md: '490px' },
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            Select Date Range
          </Typography>
          <IconButton
            aria-label='close'
            onClick={() => {
              setCustomDialogOpen(false)
              setTempRange({})
            }}
            sx={{
              color: 'customColors.OnPrimaryContainer'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 2,
            overflow: 'hidden',
            flexGrow: 1,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              px: 2,
              pb: 4,

              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px'
              }
            }}
          >
            <CustomDateRangePicker
              label='Date Range'
              monthsShown={2}
              shouldCloseOnSelect={false}
              onChange={handleDateChange}
              open={true}
              disableFutureDates={!showFutureDates ? today : null}
              allowSingleDate={true}
              selectFutureDates={showFutureDates}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            mt: 2
          }}
        >
          <Button
            onClick={() => {
              setCustomDialogOpen(false)
              setTempRange({})
            }}
            variant='outlined'
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            variant='contained'
            color='primary'
            sx={{ ml: 2 }}
            disabled={!tempRange.startDate || !tempRange.endDate}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CommonDateRangePickers

// import { useEffect, useState } from 'react'
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Menu,
//   MenuItem,
//   Typography,
//   Stack,
//   Divider
// } from '@mui/material'
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
// import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// import { format, subDays, subMonths } from 'date-fns'
// import CloseIcon from '@mui/icons-material/Close'
// import IconButton from '@mui/material/IconButton'
// import { useTheme } from '@emotion/react'
// import { useRouter } from 'next/router'
// import CustomDateRangePicker from './CustomDateRangePicker'

// const CommonDateRangePickers = ({ onChange, filterDates }) => {
//   const theme = useTheme()
//   const router = useRouter()
//   const today = new Date()
//   const [anchorEl, setAnchorEl] = useState(null)
//   const [customDialogOpen, setCustomDialogOpen] = useState(false)
//   const [selectedRange, setSelectedRange] = useState(`All time - Upto - ${format(today, 'dd MMM yyyy')}`)
//   const [tempRange, setTempRange] = useState({})
//   const open = Boolean(anchorEl)

//   const dateRanges = [
//     {
//       label: 'All time',
//       subLabel: `Upto - ${format(today, 'dd MMM yyyy')}`,
//       startDate: today,
//       endDate: today
//     },
//     {
//       label: 'Today',
//       subLabel: format(today, 'dd MMM yyyy'),
//       startDate: today,
//       endDate: today
//     },
//     {
//       label: 'Yesterday',
//       subLabel: format(subDays(today, 1), 'dd MMM yyyy'),
//       startDate: subDays(today, 1),
//       endDate: subDays(today, 1)
//     },
//     {
//       label: 'Last 7 days',
//       subLabel: `${format(subDays(today, 7), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
//       startDate: subDays(today, 7),
//       endDate: today
//     },
//     {
//       label: 'Last 1 month',
//       subLabel: `${format(subMonths(today, 1), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
//       startDate: subMonths(today, 1), // Start date is 1 month ago from today
//       endDate: today // End date is today
//     },

//     {
//       label: 'Last 6 months',
//       subLabel: `${format(subMonths(today, 6), 'dd MMM yyyy')} - ${format(today, 'dd MMM yyyy')}`,
//       startDate: subMonths(today, 6),
//       endDate: today
//     },
//     {
//       label: 'Custom range',
//       subLabel: 'Select a custom range',
//       hasChevron: true
//     }
//   ]

//   useEffect(() => {
//     if (!filterDates) return
//     const { startDate: startDateProp, endDate: endDateProp } = filterDates

//     // Handle All time case (no dates)
//     if (!startDateProp && !endDateProp) {
//       setSelectedRange(`All time - Upto - ${format(today, 'dd MMM yyyy')}`)

//       return
//     }

//     // Proceed if dates are present
//     if (startDateProp && endDateProp) {
//       const startDate = startDateProp instanceof Date ? startDateProp : new Date(startDateProp)
//       const endDate = endDateProp instanceof Date ? endDateProp : new Date(endDateProp)

//       // Check predefined ranges except All time and Custom
//       const predefinedRanges = dateRanges.slice(1, -1)
//       let matchedRange = null

//       for (const range of predefinedRanges) {
//         const rangeStart = range.startDate
//         const rangeEnd = range.endDate

//         if (
//           startDate.toDateString() === rangeStart.toDateString() &&
//           endDate.toDateString() === rangeEnd.toDateString()
//         ) {
//           matchedRange = range
//           break
//         }
//       }

//       if (matchedRange) {
//         setSelectedRange(`${matchedRange.label} - ${matchedRange.subLabel}`)
//       } else {
//         // Check if it's a single day
//         if (startDate.toDateString() === endDate.toDateString()) {
//           // Check if it's today
//           if (startDate.toDateString() === today.toDateString()) {
//             setSelectedRange(`Today - ${format(today, 'dd MMM yyyy')}`)
//           } else {
//             // Single day, not today
//             const formattedDate = format(startDate, 'dd MMM yyyy')
//             setSelectedRange(`Custom Range - ${formattedDate} - ${formattedDate}`)
//           }
//         } else {
//           // Custom range
//           const formattedStart = format(startDate, 'dd MMM yyyy')
//           const formattedEnd = format(endDate, 'dd MMM yyyy')
//           setSelectedRange(`Custom Range - ${formattedStart} - ${formattedEnd}`)
//         }
//       }
//     }
//   }, [filterDates])

//   // useEffect(() => {
//   //   const { from_date, to_date } = router.query

//   //   if (from_date && to_date) {
//   //     const fromDate = new Date(from_date)
//   //     const toDate = new Date(to_date)

//   //     // Check if from_date and to_date are the same
//   //     if (fromDate.toDateString() === toDate.toDateString()) {
//   //       setSelectedRange(`Today - ${format(today, 'dd MMM yyyy')}`)
//   //       onChange?.(fromDate, toDate)
//   //     } else {
//   //       // Find the matching range in dateRanges
//   //       const matchingRange = dateRanges.find(
//   //         range =>
//   //           range.startDate &&
//   //           range.endDate &&
//   //           range.startDate.toDateString() === fromDate.toDateString() &&
//   //           range.endDate.toDateString() === toDate.toDateString()
//   //       )

//   //       if (matchingRange) {
//   //         // If a predefined range matches, use its label and subLabel
//   //         setSelectedRange(`${matchingRange.label} - ${matchingRange.subLabel}`)
//   //       } else {
//   //         // set a custom range
//   //         const customRangeLabel = `Custom Range - ${format(fromDate, 'dd MMM yyyy')} - ${format(
//   //           toDate,
//   //           'dd MMM yyyy'
//   //         )}`
//   //         setSelectedRange(customRangeLabel)
//   //       }
//   //       onChange?.(fromDate, toDate)
//   //     }
//   //   }
//   // }, [router.query.tab])

//   const handleClick = event => {
//     setAnchorEl(event.currentTarget)
//   }

//   const handleClose = () => {
//     setAnchorEl(null)
//   }

//   const handleSelect = range => {
//     if (range.label === 'Custom range') {
//       setCustomDialogOpen(true)
//     } else if (range.label === 'All time') {
//       setSelectedRange(`${range.label} - ${range.subLabel}`)
//       onChange?.('', '')
//     } else if (range.startDate && range.endDate) {
//       setSelectedRange(`${range.label} - ${range.subLabel}`)
//       onChange?.(range.startDate, range.endDate)
//     }
//     handleClose()
//   }

//   const handleDateChange = range => {
//     setTempRange(range)
//     console.log('Selected Range:', range)
//   }

//   const handleApply = () => {
//     if (tempRange.startDate && tempRange.endDate) {
//       const newRange = `Custom Range - ${format(tempRange.startDate, 'dd MMM yyyy')} - ${format(
//         tempRange.endDate,
//         'dd MMM yyyy'
//       )}`
//       setSelectedRange(newRange) // Update selectedRange
//       onChange?.(tempRange.startDate, tempRange.endDate)
//     }
//     setCustomDialogOpen(false) // Close dialog
//   }

//   return (
//     <>
//       <Box
//         onClick={handleClick}
//         sx={{
//           cursor: 'pointer',
//           backgroundColor: 'customColors.Background',
//           borderRadius: '4px',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 2,
//           pr: 2,
//           width: '100%',
//           '&:hover': {
//             backgroundColor: '#E8EBE8'

//             // customColors.neutral05
//           }
//         }}
//       >
//         <Box
//           sx={{
//             backgroundColor: 'customColors.Outline',

//             // borderRadius: '4px',
//             borderRadius: '4px 0 0 4px',
//             width: '40px',
//             height: '40px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center'
//           }}
//         >
//           <CalendarTodayIcon sx={{ color: 'white', fontSize: 24 }} />
//         </Box>
//         <Typography
//           sx={{
//             color: 'customColors.OnSurfaceVariant',
//             fontSize: '16px',
//             fontWeight: 500,
//             flex: 1
//           }}
//         >
//           {selectedRange}
//         </Typography>
//         {/* <KeyboardArrowDownIcon
//           sx={{
//             color: '#64748B',
//             transition: 'transform 0.2s ease',
//             transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
//           }}
//         /> */}
//       </Box>

//       <Menu
//         id='date-range-menu'
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleClose}
//         MenuListProps={{
//           'aria-labelledby': 'date-range-button'
//         }}
//         PaperProps={{
//           elevation: 3,
//           sx: {
//             width: '300px',
//             maxHeight: 'none',
//             mt: 1,
//             '& .MuiList-root': {
//               padding: 0
//             }

//             // borderRadius: '8px'
//             // border: '1px solid #E0E0E0'
//           }
//         }}
//         transformOrigin={{ horizontal: 'left', vertical: 'top' }}
//         anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
//       >
//         {dateRanges.map((range, index) => (
//           <Box key={range.label}>
//             <MenuItem
//               key={range.label}
//               onClick={() => handleSelect(range)}
//               // eslint-disable-next-line lines-around-comment
//               // divider={index < dateRanges.length - 1}
//               sx={{
//                 py: 3,
//                 px: 6,
//                 '&:hover': {
//                   backgroundColor: '#F8FAFB'
//                 }
//               }}
//             >
//               <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                 <Stack spacing={0.5} sx={{ flex: 1 }}>
//                   <Typography
//                     variant='body1'
//                     sx={{
//                       fontWeight: 500,
//                       color: 'customColors.OnPrimaryContainer',
//                       fontSize: '16px'
//                     }}
//                   >
//                     {range.label}
//                   </Typography>
//                   <Typography
//                     variant='body2'
//                     sx={{
//                       fontWeight: 400,
//                       color: 'customColors.Outline',
//                       fontSize: '14px'
//                     }}
//                   >
//                     {range.subLabel}
//                   </Typography>
//                 </Stack>
//                 {range.hasChevron && (
//                   <ChevronRightIcon
//                     sx={{
//                       color: 'customColors.OnSurfaceVariant',
//                       ml: 1
//                     }}
//                   />
//                 )}
//               </Box>
//             </MenuItem>
//             {index < dateRanges.length - 1 && <Divider sx={{ m: 4, color: 'customColors.SurfaceVariant' }} />}
//           </Box>
//         ))}
//       </Menu>
//       <Dialog
//         open={customDialogOpen}
//         onClose={() => setCustomDialogOpen(false)}
//         maxWidth='sm'
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: '12px',
//             height: { xs: '400px', sm: '460px', md: '490px' },
//             maxHeight: '90vh',
//             display: 'flex',
//             flexDirection: 'column',
//             overflow: 'hidden'
//           }
//         }}
//       >
//         <DialogTitle
//           sx={{
//             borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
//             p: 3,
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexShrink: 0
//           }}
//         >
//           <Typography
//             variant='h6'
//             sx={{
//               fontWeight: 600,
//               color: 'customColors.OnPrimaryContainer'
//             }}
//           >
//             Select Date Range
//           </Typography>
//           <IconButton
//             aria-label='close'
//             onClick={() => {
//               setCustomDialogOpen(false)
//               setTempRange({})
//             }}
//             sx={{
//               color: 'customColors.OnPrimaryContainer'
//             }}
//           >
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>

//         <DialogContent
//           sx={{
//             p: 2,
//             overflow: 'hidden',
//             flexGrow: 1,
//             position: 'relative'
//           }}
//         >
//           <Box
//             sx={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               overflowY: 'auto',
//               px: 2,
//               pb: 4,

//               '&::-webkit-scrollbar': {
//                 width: '8px'
//               },
//               '&::-webkit-scrollbar-thumb': {
//                 backgroundColor: 'rgba(0,0,0,0.2)',
//                 borderRadius: '4px'
//               }
//             }}
//           >
//             <CustomDateRangePicker
//               label='Date Range'
//               monthsShown={2}
//               shouldCloseOnSelect={false}
//               onChange={handleDateChange}
//               open={true}
//               disableFutureDates={today}
//               allowSingleDate={true}
//             />
//           </Box>
//         </DialogContent>

//         <DialogActions
//           sx={{
//             p: 3,
//             flexShrink: 0,
//             position: 'relative',
//             zIndex: 1,
//             mt: 2
//           }}
//         >
//           <Button
//             onClick={() => {
//               setCustomDialogOpen(false)
//               setTempRange({})
//             }}
//             variant='outlined'
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleApply}
//             variant='contained'
//             color='primary'
//             sx={{ ml: 2 }}
//             disabled={!tempRange.startDate || !tempRange.endDate}
//           >
//             Apply
//           </Button>
//         </DialogActions>
//       </Dialog>
//       {/* <Dialog
//         open={customDialogOpen}
//         onClose={() => setCustomDialogOpen(false)}
//         maxWidth='sm'
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: '12px',
//             height: { xs: '400px', sm: '500px', md: '510px' },
//             maxHeight: '90vh'
//           }
//         }}
//       >
//         <DialogTitle
//           sx={{
//             borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
//             p: 3,
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center'
//           }}
//         >
//           <Typography
//             variant='h6'
//             sx={{
//               fontWeight: 600,
//               color: 'customColors.OnPrimaryContainer'
//             }}
//           >
//             Select Date Range
//           </Typography>
//           <IconButton
//             aria-label='close'
//             onClick={() => setCustomDialogOpen(false)}
//             sx={{
//               color: 'customColors.OnPrimaryContainer'
//             }}
//           >
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent sx={{ mt: 6, p: 2 }}>
//           <Box>
//             <CustomDateRangePicker
//               label='Date Range'
//               monthsShown={2}
//               shouldCloseOnSelect={false}
//               onChange={handleDateChange}
//               open={true}
//               disableFutureDates={today}
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 3 }}>
//           <Button onClick={() => setCustomDialogOpen(false)} variant='outlined'>
//             Cancel
//           </Button>
//           <Button onClick={handleApply} variant='contained' color='primary'>
//             Apply
//           </Button>
//         </DialogActions>
//       </Dialog> */}
//     </>
//   )
// }

// export default CommonDateRangePickers
