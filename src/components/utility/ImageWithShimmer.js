import React, { useState } from 'react'
import { Box, Skeleton } from '@mui/material'

const ImageWithShimmer = ({ src, alt, height = 32, width = 32 }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {!isLoaded && <Skeleton variant='circular' width={width} height={height} sx={{ marginRight: 2 }} />}
      <Box
        component='img'
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        sx={{
          display: isLoaded ? 'block' : 'none',
          width: height,
          height: width,
          borderRadius: '50%',
          objectFit: 'cover',
          marginRight: 2
        }}
      />
    </Box>
  )
}

export default ImageWithShimmer