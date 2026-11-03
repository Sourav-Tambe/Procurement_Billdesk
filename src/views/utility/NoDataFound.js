import React from 'react'
import { Box, Stack } from '@mui/material'

const imageSources = {
  Meerkat: '/images/no-data/meerkat.png',
  Seal: '/images/no-data/seal.png',
  Sloth: '/images/no-data/sloth.png'
}

const NoDataFound = ({ variant = 'Meerkat', height = 150, width = 150 }) => {
  const src = imageSources[variant] || imageSources.Meerkat

  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        padding: 2
      }}
    >
      <Box
        component='img'
        src={src}
        alt='No data found'
        sx={{
          height,
          width,
          objectFit: 'contain'
        }}
      />
    </Stack>
  )
}

export default React.memo(NoDataFound)
