import React, { useEffect, useState, useRef } from 'react'
import { Box } from '@mui/material'

const isSafari =
  typeof window !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent)


const SignedMediaPlayer = ({
  src,
  type, // 'video' | 'audio'
  width = '100%',
  height = 'auto',
  controls = true,
  preload = 'metadata',
  playsInline = true,
  muted = false,
  onError,
  onLoad,
  style = {}
}) => {
  const [blobUrl, setBlobUrl] = useState(null)
  const blobRef = useRef(null)

  // Signed URL → Blob URL (Safari safe)
  const getSignedMediaBlobUrl = async url => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-' },
        credentials: 'omit'
      })

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      blobRef.current = objectUrl

      return objectUrl
    } catch (error) {
      console.error('Failed to load media:', error?.message)
      onError?.(error)

      return null
    }
  }

  useEffect(() => {
    if (!src) return
    if (type === 'audio' && !isSafari) return

    let active = true

    getSignedMediaBlobUrl(src).then(url => {
      if (active && url) {
        setBlobUrl(url)
      }
    })

    return () => {
      active = false

      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }
    }
  }, [src])

  if (!blobUrl) return null

  const commonProps = {
    src: blobUrl,
    controls,
    preload,
    muted,
    style: {
      width,
      height,
      ...style
    },
    onError
  }

  return (
    <Box sx={{ width, height }}>
      {type === 'video' ? (
        <video {...commonProps} playsInline={playsInline} onCanPlay={() => onLoad?.()} />
      ) : isSafari ? (

        // Safari → blob audio
        (<audio {...commonProps} onCanPlay={() => onLoad?.()} />)
      ) : (

        // Chrome / others → direct URL audio
        (<audio
          src={src}
          controls
          preload='auto'
          style={{ width: '100%' }}
          onError={onError}
          onCanPlay={() => onLoad?.()}
        />)
      )}
    </Box>
  );
}

export default SignedMediaPlayer