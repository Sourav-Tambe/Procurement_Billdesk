export const assessment_type_string_id = 'weight'

export const DOCUMENT_TYPE_ID = 5

export const visitTypeOptions = [
  { value: '', label: 'All visit' },
  { value: 'checkup', label: 'Checkup' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'opd', label: 'Outpatients' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'planned', label: 'Planned' }
]

// Maps file extensions to their respective media categories
export const EXTENSION_TYPE_MAP = {
  // image
  jpeg: 'image',
  jpg: 'image',
  png: 'image',
  heic: 'image',
  heif: 'image',
  svg: 'image',
  avif: 'image',
  gif: 'image',
  bmp: 'image',
  webp: 'image',

  // pdf
  pdf: 'pdf',

  // xls (excel)
  xls: 'xls',
  xlsx: 'xls',
  ods: 'xls',

  // document
  doc: 'document',
  docx: 'document',
  odt: 'document',

  // audio
  mp3: 'audio',
  m4a: 'audio',
  ogg: 'audio',
  wav: 'audio',
  aac: 'audio',

  // video
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mkv: 'video',
  '3gpp': 'video',
  '3gp': 'video',
  ogv: 'video',
  avi: 'video',
  m4v: 'video'
}
