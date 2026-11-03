import React, { useRef, useState, useEffect } from 'react'
import { Box, Typography, IconButton, useTheme, CircularProgress } from '@mui/material'
import { Controller, useWatch } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import FileDialog from 'src/components/utility/FileDialog'

// File type configuration
const EXT_ICON_MAP = {
  image: ['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'],
  pdf: ['pdf'],
  xls: ['xls', 'xlsx'],
  document: ['doc', 'docx'],
  audio: ['mp3', 'wav', 'ogg'],
  video: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  ppt: ['ppt', 'pptx'],
  text: ['txt'],
  csv: ['csv'],
  zip: ['zip', 'rar', '7z']
}

/**
 * Maps keyword to MIME types/extensions for file input accept attribute
 * @param {string} type - File type keyword (e.g., 'images', 'pdf', 'excel')
 * @returns {string} MIME type or extension string
 */
const getAcceptedMimeTypes = type => {
  const typeMap = {
    all: '*',
    images: 'image/*',
    image: 'image/*',
    documents: '.doc,.docx',
    document: '.doc,.docx',
    word: '.doc,.docx',
    pdf: '.pdf',
    videos: 'video/*',
    video: 'video/*',
    audio: 'audio/*',
    excel: '.xls,.xlsx',
    powerpoint: '.ppt,.pptx',
    ppt: '.ppt,.pptx',
    text: '.txt',
    csv: '.csv',
    zip: '.zip,.rar,.7z',
    compressed: '.zip,.rar,.7z'
  }

  return typeMap[type.toLowerCase()] || ''
}

/**
 * Converts comma-separated type string to accept attribute value
 * @param {string} acceptedFileTypes - Comma-separated file types (e.g., 'images,pdf,excel')
 * @returns {string} Formatted accept attribute value
 */
const parseAcceptedTypes = acceptedFileTypes => {
  if (acceptedFileTypes === '*' || acceptedFileTypes === 'all') return '*'

  const types = acceptedFileTypes
    .split(',')
    .map(type => getAcceptedMimeTypes(type.trim()))
    .filter(Boolean)

  return [...new Set(types)].join(',')
}

/**
 * ControlledMultiFileUpload - A React Hook Form controlled file upload component
 * Supports drag & drop, file preview, validation, and multiple file types
 */
const ControlledMultiFileUpload = ({
  name,
  control,
  label = 'Drop your files here',
  uploadIcon = '/images/housing/gallery-add.svg',
  iconPosition = 'left',
  preview = true,
  previewPlacement = 'top',
  maxFileSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
  acceptedFileTypes = '*',
  previewVariant = 'rectangular',
  enableImageFullScreen = false,
  showProgress = false,
  defaultValue = [],
  rules = {},
  required = false,
  sx = {}
}) => {
  const theme = useTheme()
  const fileInputRef = useRef()
  const { userData } = useAuth()

  const [localError, setLocalError] = useState('')
  const [previewFile, setPreviewFile] = useState(null)

  const watchedValue = useWatch({ control, name, defaultValue })
  // lite build (no signed-in user settings): file-type icons fall back to these
  const FALLBACK_ICONS = { pdf: { icon: 'mdi:file-pdf-box', bg_color: '#FFD3D3', icon_color: '#E93353' }, xls: { icon: 'mdi:file-excel-box', bg_color: '#DAE7DF', icon_color: '#006D35' }, document: { icon: 'mdi:file-word-box', bg_color: '#E8F4F2', icon_color: '#1F515B' }, default: { icon: 'mdi:file-outline', bg_color: '#E8F4F2', icon_color: '#1F515B' } }
  const imgPath = userData?.settings?.DEFAULT_IMAGE_MASTER || FALLBACK_ICONS
  const acceptedTypes = parseAcceptedTypes(acceptedFileTypes)

  // Clear error when form resets
  useEffect(() => {
    if (Array.isArray(watchedValue) && watchedValue.length === 0) {
      setLocalError('')
    }
  }, [watchedValue])

  /**
   * Gets appropriate icon configuration for file type
   * @param {File|Object|string} file - File object, file data, or URL
   * @returns {Object} Icon configuration with image_path/icon, bg_color, icon_color
   */
  const getFileIcon = file => {
    if (!file || (typeof file === 'string' && !file.trim())) return imgPath.default

    // Extract filename from different sources
    const fileName =
      typeof file === 'string'
        ? file.split('/').pop().split('?')[0].toLowerCase()
        : (file?.name || file?.file_original_name || '').toLowerCase()

    if (!fileName || fileName.startsWith('.') || !fileName.includes('.')) {
      return imgPath.default
    }

    const extension = fileName.split('.').pop().trim()

    // Find matching icon type
    for (const [key, extList] of Object.entries(EXT_ICON_MAP)) {
      if (extList.includes(extension)) {
        // Handle video files with fallback icon
        if (key === 'video' && !imgPath.video) {
          return { icon: 'mdi:play-circle', bg_color: '#d0eff7ff', icon_color: '#1976d2' }
        }

        return imgPath[key] || imgPath.default
      }
    }

    return imgPath.default
  }

  // Validates files based on count, size, type, and duplication rules
  const validateFiles = (existingFiles, newFiles) => {
    // Ensure existingFiles is always an array
    const filesArray = Array.isArray(existingFiles) ? existingFiles : existingFiles ? [existingFiles] : []
    const validFiles = []
    const errors = []
    const existingNames = new Set(filesArray.map(f => f.name?.toLowerCase()).filter(Boolean))

    // Improved file type check to handle wildcards like 'image/*'
    const acceptedArray = acceptedTypes === '*' ? ['*'] : acceptedTypes.split(',').map(t => t.trim().toLowerCase())

    for (const file of newFiles) {
      // Check max files limit
      if (maxFiles && filesArray.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed. Some files were not added.`)
        break
      }

      const fileName = file.name.toLowerCase()

      // Skip duplicates
      if (existingNames.has(fileName)) {
        errors.push(`"${file.name}" is a duplicate file name.`)
        continue
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`"${file.name}" exceeds the ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB limit.`)
        continue
      }

      // Check file type
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`
      const fileMimeType = file.type.toLowerCase()

      const isAccepted = acceptedArray.some(type => {
        if (type === '*') return true
        if (type.endsWith('/*')) {
          // e.g. 'image/*' should match 'image/png', 'image/jpeg', etc.
          return fileMimeType.startsWith(type.replace('/*', '/'))
        }
        if (type.startsWith('.')) {
          // e.g. '.pdf'
          return fileExtension === type
        }

        // Exact match
        return fileMimeType === type
      })

      if (!isAccepted) {
        // Use EXT_ICON_MAP for user-friendly type label based on uploaded file type
        const ext = file.name.split('.').pop().toLowerCase()
        const mime = file.type.toLowerCase()

        let typeLabel = ''

        if (mime.startsWith('image/')) {
          typeLabel = 'image'
        } else if (mime.startsWith('video/')) {
          typeLabel = 'video'
        } else if (mime.startsWith('audio/')) {
          typeLabel = 'audio'
        } else {
          let found = false
          for (const [label, extList] of Object.entries(EXT_ICON_MAP)) {
            if (extList.includes(ext)) {
              typeLabel = label
              found = true
              break
            }
          }
          if (!found) typeLabel = ext
        }

        errors.push(`${typeLabel} is not an accepted file type.`)
        continue
      }

      validFiles.push(file)
      existingNames.add(fileName)
    }

    return {
      isValid: validFiles.length > 0,
      files: [...filesArray, ...validFiles],
      message: errors.length > 0 ? errors[0] : ''
    }
  }

  /** Checks if file object is valid */
  const isValidFile = file => {
    if (!file) return false
    if (typeof file === 'string') return file.trim() !== ''
    if (typeof file === 'object') {
      return file instanceof File || !!file?.file_path || !!file?.name
    }

    return false
  }

  /**
   * Determines preview type based on file extension
   */
  const getPreviewType = ext => {
    for (const [type, extList] of Object.entries(EXT_ICON_MAP)) {
      if (extList.includes(ext)) return type
    }

    return 'other'
  }

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={
        required || Object.keys(rules).length > 0
          ? { ...(required && { required: 'This field is required' }), ...rules }
          : undefined
      }
      render={({ field: { value = [], onChange }, fieldState: { error } }) => {
        // Normalize and filter valid files
        const normalizedValueRaw = Array.isArray(value) ? value : value == null ? [] : [value]
        const normalizedValue = normalizedValueRaw.filter(isValidFile)

        const handleFilesChange = async selectedFiles => {
          if (!selectedFiles || selectedFiles.length === 0) {
            setLocalError('Please select at least one file.')

            return
          }

          const newFiles = Array.from(selectedFiles)
          const validation = validateFiles(value, newFiles)

          // Only update the field if there are valid files to add
          if (validation.isValid) {
            onChange(validation.files)
          }

          // Show error if any
          if (validation.message) {
            setLocalError(validation.message)
          } else {
            setLocalError('')
          }

          // Re-validate the field
          if (control?.trigger) {
            await control.trigger(name)
          }
        }

        const handleRemoveFile = index => {
          const normalizedValue = Array.isArray(value) ? value : value == null ? [] : [value]
          const updatedFiles = normalizedValue.filter((_, i) => i !== index)
          onChange(updatedFiles)
        }

        const renderFilePreview = (file, index) => {
          const isEmptyString = typeof file === 'string' && file.trim() === ''

          const isInvalidObject = typeof file === 'object' && !(file instanceof File) && !file?.file_path && !file?.name

          if (!file || isEmptyString || isInvalidObject) {
            return null
          }

          // Determine extension for preview type
          const ext = (typeof file === 'string' ? file : file?.name)?.split('.').pop()?.toLowerCase()
          const isImage = ['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'].includes(ext) || file?.type?.startsWith('image/')

          const fileURL =
            file instanceof File ? URL.createObjectURL(file) : typeof file === 'string' ? file : file?.file_path

          return (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: 100,
                height: 100,
                borderRadius: 1,
                backgroundColor: theme.palette.customColors.displaybgPrimary || '#E8F4F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(sx.previewImageContainer || {})
              }}
            >
              {/* Image preview */}
              {isImage ? (
                <img
                  src={fileURL}
                  alt={`file-${index}`}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: previewVariant === 'rounded' ? '50%' : '8px',
                    cursor: enableImageFullScreen ? 'pointer' : 'default',
                    ...(sx.previewImage || {})
                  }}
                  onClick={() =>
                    enableImageFullScreen && setPreviewFile({ src: fileURL, type: 'image', name: file?.name })
                  }
                />
              ) : getFileIcon(file)?.image_path ? (
                /* Icon image preview */
                (<Box
                  component='img'
                  src={getFileIcon(file)?.image_path}
                  alt='file icon'
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: getFileIcon(file)?.bg_color || '#ccc',
                    borderRadius: '4px',
                    cursor: enableImageFullScreen ? 'pointer' : 'default'
                  }}
                  onClick={() =>
                    enableImageFullScreen &&
                    setPreviewFile({ src: fileURL, type: getPreviewType(ext), name: file?.name })
                  }
                />)
              ) : getFileIcon(file)?.icon ? (
                /* Icon font preview */
                (<Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: getFileIcon(file)?.bg_color || '#ccc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: enableImageFullScreen ? 'pointer' : 'default'
                  }}
                  onClick={() =>
                    enableImageFullScreen &&
                    setPreviewFile({ src: fileURL, type: getPreviewType(ext), name: file?.name })
                  }
                >
                  <Icon
                    icon={getFileIcon(file)?.icon}
                    fontSize={40}
                    color={getFileIcon(file)?.icon_color || '#1976d2'}
                  />
                </Box>)
              ) : null}
              {/* Remove button */}
              <IconButton
                size='small'
                sx={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  backgroundColor: theme.palette.customColors?.secondaryBg || '#979797',
                  color: theme.palette.customColors?.OnPrimary || '#fff',
                  width: 24,
                  height: 24,
                  zIndex: 1,
                  '&:hover': { backgroundColor: theme.palette.customColors?.OnSurfaceVariant || '#757575' }
                }}
                onClick={e => {
                  e.stopPropagation()
                  handleRemoveFile(index)
                }}
              >
                <Icon icon='mdi:close' fontSize={18} />
              </IconButton>
            </Box>
          );
        }

        return (
          <Box>
            {/* Full screen preview dialog */}
            {previewFile && (
              <FileDialog
                open={!!previewFile}
                onClose={() => setPreviewFile(null)}
                src={previewFile.src}
                type={previewFile.type}
                title={previewFile.name}
              />
            )}

            {/* Top previews */}
            {preview && previewPlacement === 'top' && normalizedValue.length > 0 && (
              <Box sx={{ mb: 4, display: 'flex', gap: { xs: 2, sm: '1.125rem' }, flexWrap: 'wrap' }}>
                {normalizedValue.map((file, index) => renderFilePreview(file, index))}
              </Box>
            )}

            {/* Dropzone */}
            <Box
              sx={{
                border: `2px dashed ${
                  error || localError ? theme.palette.error.main : theme.palette.customColors?.OutlineVariant
                }`,
                borderRadius: '8px',
                padding: 3.5,
                cursor: showProgress ? 'not-allowed' : 'pointer',
                '&:hover': { backgroundColor: showProgress ? 'transparent' : theme.palette.customColors.lightBg },
                ...(sx.dropZone || {})
              }}
              onClick={() => !showProgress && fileInputRef.current?.click()}
              onDrop={e => {
                if (!showProgress) {
                  e.preventDefault()
                  handleFilesChange(e.dataTransfer.files)
                }
              }}
              onDragOver={e => e.preventDefault()}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {showProgress ? (
                  <CircularProgress size={24} color='primary' />
                ) : (
                  <>
                    {iconPosition === 'left' && (
                      <img src={uploadIcon} alt='Upload Icon' style={{ width: 24, ...(sx.uploadIcon || {}) }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 400,
                        color: theme.palette?.customColors?.OnSurfaceVariant60,
                        ...(sx.label || {})
                      }}
                    >
                      {label}
                    </Typography>
                    {iconPosition === 'right' && (
                      <img src={uploadIcon} alt='Upload Icon' style={{ width: 24, ...(sx.uploadIcon || {}) }} />
                    )}
                  </>
                )}
              </Box>
              <input
                type='file'
                accept={acceptedTypes}
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                disabled={showProgress}
                onChange={e => {
                  handleFilesChange(e.target.files)
                  e.target.value = null // Allow re-selection of same file
                }}
              />
            </Box>

            {/* Bottom previews */}
            {preview && previewPlacement === 'bottom' && normalizedValue.length > 0 && (
              <Box sx={{ mt: 4, display: 'flex', gap: { xs: 2, sm: '1.125rem' }, flexWrap: 'wrap' }}>
                {normalizedValue.map((file, index) => renderFilePreview(file, index))}
              </Box>
            )}

            {/* Error message */}
            <Typography variant='caption' color='error.main' sx={{ mt: 1, display: 'block' }}>
              {localError || error?.message}
            </Typography>
          </Box>
        )
      }}
    />
  );
}

export default ControlledMultiFileUpload
