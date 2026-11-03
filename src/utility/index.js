import moment from 'moment'
import toast from 'react-hot-toast'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import CustomAvatar from 'src/@core/components/mui/avatar'
import CryptoJS from 'crypto-js'

const formatDate = dateString => {
  if (dateString !== null) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } else {
    return ''
  }
}

function formatNumber(number) {
  if (number !== null && !isNaN(number)) {
    var formattedNumber = parseFloat(number).toFixed(2)
    formattedNumber = formattedNumber.replace(/\.0+$/, '')

    return formattedNumber
  } else {
    return ''
  }
}

function formattedPresentDate() {
  const date = new Date()

  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`

  return formattedDate
}

function formatDisplayDate(date) {
  if (date) {
    const result = moment(date).format('DD MMM YYYY')

    if (result === 'Invalid date') {
      return 'NA'
    } else {
      return result
    }
  } else {
    return 'NA'
  }

  // return moment(date).format('DD MMM YYYY')
}

function errorMessageExtractorFromObject(errorMessages) {
  for (const key in errorMessages) {
    if (Object.prototype.hasOwnProperty.call(errorMessages, key)) {
      const errorMessage = errorMessages[key]
      toast.error(errorMessage)

      // console.log(`${key}: ${errorMessage}`)
    }
  }
}

function exportToCSV(tableData, fileName) {
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  const fileExtension = '.xlsx'
  if (tableData?.length > 0) {
    const ws = XLSX.utils.json_to_sheet(tableData)
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] }
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: fileType })
    FileSaver.saveAs(data, fileName + fileExtension)
  }
}

function getPreviousDaysDate(todayDate, days) {
  const date = new Date(todayDate.getTime())
  date.setDate(date.getDate() - days)
  const previousDate = moment(date).format('YYYY-MM-DD')

  return previousDate
}
function getFeaturesDates(todayDate, days) {
  const date = new Date(todayDate.getTime())
  date.setDate(date.getDate() + days)
  const featureDate = moment(date).format('YYYY-MM-DD')

  return featureDate
}
function daysFromToday(inputDate) {
  const today = moment()
  const targetDate = moment(inputDate, 'YYYY-MM-DD')

  const differenceInDays = targetDate.diff(today, 'days')
  if (Math.abs(differenceInDays) === 0) {
    return 'Today'
  } else if (Math.abs(differenceInDays) === 1) {
    return `${Math.abs(differenceInDays)} Day`
  } else {
    return `${Math.abs(differenceInDays)} Days`
  }
}

function renderUserAvatar(image) {
  if (image) {
    return <CustomAvatar src={image} sx={{ mr: '16px', width: '40px', height: '40px' }} />
  } else {
    return <CustomAvatar sx={{ mr: '16px', width: '40px', height: '40px', fontSize: '.8rem' }}></CustomAvatar>
  }
}
function convertUTCToLocal(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('YYYY-MM-DD HH:mm:ss')

  return local
}

function convertUTCToLocalDateTime(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('DD MMM YYYY | hh:mm A')

  return local
}

function convertUTCToLocalDate(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('YYYY-MM-DD')

  return local
}

function convertUtcToLocalReadableDate(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('DD MMM YYYY')

  return local
}

function formatDateTimeDisplay(date) {
  if (!date) return ''

  return moment(date).format('DD MMM YYYY | hh:mm A')
}

function convertUTCToLocaltime(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('h:mm A')

  return local
}

function extractHoursAndMinutes(date) {
  //9:21 PM
  return moment(date).format('hh:mm A')
}

function formatNumberToDisplay(number) {
  if (number !== null && !isNaN(number)) {
    return Number.isInteger(number) ? number.toString() : number.toFixed(2)
  } else {
    return '0'
  }
}

function formatAmountToReadableDigit(value) {
  // debugger

  const num = parseFloat(value)
  if (isNaN(num)) return 'Invalid number'

  const roundedNum = num.toFixed(2) // Round to 2 decimal places

  if (num > 999) {
    return Number(roundedNum).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return `₹${Number(roundedNum)}`

  // if (value) {
  //   if (value > 10000) {
  //     return `₹ ${value.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ',')}.00`
  //   }

  //   return `₹ ${value}.00`

  //   // return value.toLocaleString('de-DE')
  // }

  // return '0'
}

const downloadFileFromURL = async (fileUrl, title = '') => {
  if (!fileUrl) {
    console.error('No file URL provided')

    return
  }
  try {
    // const fileType = fileUrl.split('.').pop()
    // const fileExtension = fileUrl.split('/')
    // const fetchResponse = await fetch(fileUrl)
    // if (!fetchResponse.ok) {
    //   throw new Error(`Failed to fetch file: ${fetchResponse.statusText}`)
    // }
    // const blob = await fetchResponse.blob()
    // const url = window.URL.createObjectURL(blob)

    // const fileName = `${
    //   title !== ''
    //     ? `${title.toLowerCase().replace(/\s+/g, '-')}-report.${fileType}`
    //     : fileExtension[fileExtension.length - 1]
    // }`
    const link = document.createElement('a')
    link.href = fileUrl

    // link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(fileUrl)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const downloadFileFromURLWithBlob = async (url, fileName) => {
  if (!url) return
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download failed:', error?.message)
  }
}

const formatText = text => {
  return text.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function toPascalSentenceCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(' ');
}

function formatAmountCompactDisplay(value) {
  // debugger

  const num = parseFloat(value)
  if (isNaN(num)) return 'Invalid number'

  const roundedNum = num.toFixed(2) // Round to 2 decimal places

  if (num > 999) {
    return Number(roundedNum).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      notation: 'compact',
      compactDisplay: 'short'
    })
  }

  return `${Number(roundedNum)}`
}

const SECRET_KEY = 'Antz-Vantara'

const encryptData = data => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}

const decryptData = cipherText => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY)

  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

function formatIdentifierType(type) {
  if (!type) return '' // handle empty/undefined cases

  return type
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' '); // Join back with spaces
}

function hexToHex8(hex, opacity) {
  debugger
  hex = hex.replace('#', '')

  let alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')

  return `#${hex}${alpha}`
}

const getUpcomingHours = (count = 6) => {
  const now = new Date()
  const hours = []
  const currentHour = now.getHours()

  for (let i = 0; i < count; i++) {
    const hour = (currentHour + i) % 24
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = ((hour + 11) % 12) + 1 // Convert to 12-hour format
    hours.push(`${formattedHour} ${ampm}`)
  }

  return hours
}

export const downloadPDF = async ({ apiCall, params, fileName, headers = {} }) => {
  try {
    // Call the API to get the download URL
    const response = await apiCall(params)

    // Handle both response formats:
    // 1. response.data.download_url (nested URL)
    // 2. response.data as direct URL string
    const downloadUrl = response?.data?.download_url || (typeof response?.data === 'string' ? response.data : null)

    if (response?.success && downloadUrl) {
      // Fetch the file as a blob
      const fileResponse = await fetch(downloadUrl, {
        method: 'GET',
        headers
      })

      if (!fileResponse.ok) {
        throw new Error(`HTTP error! status: ${fileResponse.status}`)
      }

      const blob = await fileResponse.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `download_${Date.now()}.pdf` // Default filename if not provided
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      console.error('Failed to download the file')
    }
  } catch (error) {
    console.error('Error while downloading the file:', error)
  }
}

const capitalizeFirstLetter = string => {
  if (!string) return ''

  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Scrolls to a specific form field by name, id, or data-field attribute
 * @param {string} fieldName - The name/id/data-field of the field to scroll to
 * @param {Object} options - Scroll options
 * @param {string} options.behavior - Scroll behavior ('smooth' | 'instant' | 'auto'), default 'smooth'
 * @param {string} options.block - Vertical alignment ('start' | 'center' | 'end' | 'nearest'), default 'center'
 * @param {boolean} options.focus - Whether to focus the element after scrolling, default true
 * @param {number} options.focusDelay - Delay in ms before focusing, default 300
 */
const scrollToField = (fieldName, options = {}) => {
  const { behavior = 'smooth', block = 'center', focus = true, focusDelay = 300 } = options

  const element =
    document.querySelector(`[name="${fieldName}"]`) ||
    document.querySelector(`#${fieldName}`) ||
    document.querySelector(`[data-field="${fieldName}"]`)

  if (element) {
    element.scrollIntoView({ behavior, block })

    if (focus && typeof element.focus === 'function') {
      setTimeout(() => element.focus(), focusDelay)
    }

    return true
  }

  return false
}

/**
 * Scrolls to the first field with a validation error (for react-hook-form)
 * @param {Object} errors - The errors object from react-hook-form's formState
 * @param {Object} options - Scroll options (same as scrollToField)
 * @returns {string|null} - The name of the first error field, or null if no errors
 */
const scrollToFirstError = (errors, options = {}) => {
  const errorFields = Object.keys(errors || {})

  if (errorFields.length > 0) {
    const firstErrorField = errorFields[0]
    scrollToField(firstErrorField, options)

    return firstErrorField
  }

  return null
}

export const AgeConverter = recorded_date_time => {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s',
      s: 'sec',
      ss: '%dsec',
      m: '%dm',
      mm: '%dm',
      h: '%dh',
      hh: '%dh',
      d: '%dd',
      dd: '%dd',
      w: 'a week',
      ww: '%d weeks',
      M: '%d months',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    }
  })

  if (!recorded_date_time) {
    return ''
  }

  let recordedAge
  const now = moment()
  const recorded = moment(recorded_date_time, 'YYYY-MM-DD HH:mm:ss')
  if (!recorded.isValid()) {
    return ''
  }

  const diffInMinutes = now.diff(recorded, 'minutes')
  const diffInHours = now.diff(recorded, 'hours')
  const diffInDays = now.diff(recorded, 'days')
  const nowYear = now.year()
  const recordedYear = recorded.year()

  if (diffInMinutes < 1) {
    return 'Just now'
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute ago`
  }

  if (diffInHours < 24) {
    return `${diffInHours} hour ago`
  }

  if (diffInDays < 30) {
    return `${diffInDays} day ago`
  }

  if (nowYear === recordedYear) {
    return recorded.format('D MMM')
  }

  return recorded.format('D MMM YYYY')
}

export const extractTextFromHtml = html => {
  if (!html) return ''

  // Pre-strip script/style tags and their content via regex before DOM parsing
  const sanitized = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '').replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')

  const parser = new DOMParser()
  const doc = parser?.parseFromString(sanitized, 'text/html')
  doc?.querySelectorAll('script, style, iframe, object, embed')?.forEach(el => {
    el?.remove()
  })
  doc?.querySelectorAll('br')?.forEach(br => {
    br?.replaceWith(' ')
  })

  doc?.querySelectorAll('li')?.forEach(li => {
    li?.appendChild(document.createTextNode(' '))
  })

  doc?.querySelectorAll('p')?.forEach(p => {
    p.appendChild(document.createTextNode(' '))
  })

  // Strip any HTML-encoded tags that became plain text (e.g. &lt;script&gt; → <script>)
  return (doc?.body?.textContent || '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const createEmptyRichTextValue = () => {
  const delta = { ops: [{ insert: '\n' }] }

  return {
    delta,
    html: '<></>',
    text: '',
    ops: delta.ops
  }
}

export const getRichTextContent = note => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map(op => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

export const getRichTextHtmlValue = note => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map(op => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const Utility = {
  formatDate,
  formatNumber,
  formattedPresentDate,
  formatDisplayDate,
  errorMessageExtractorFromObject,
  exportToCSV,
  getFeaturesDates,
  getPreviousDaysDate,
  daysFromToday,
  convertUTCToLocal,
  convertUTCToLocalDate,
  convertUTCToLocaltime,
  convertUtcToLocalReadableDate,
  convertUTCToLocalDateTime,
  extractHoursAndMinutes,
  formatNumberToDisplay,
  formatAmountToReadableDigit,
  downloadFileFromURL,
  downloadFileFromURLWithBlob,
  formatText,
  toPascalSentenceCase,
  renderUserAvatar,
  formatAmountCompactDisplay,
  encryptData,
  decryptData,
  formatIdentifierType,
  hexToHex8,
  getUpcomingHours,
  downloadPDF,
  capitalizeFirstLetter,
  scrollToField,
  scrollToFirstError,
  AgeConverter,
  extractTextFromHtml,
  formatDateTimeDisplay,
  createEmptyRichTextValue,
  getRichTextContent,
  getRichTextHtmlValue
}

export default Utility
