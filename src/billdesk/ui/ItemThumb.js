// A product's photo (Sourav, 2 Nov: "use proper product images"): public/images/items/<item code>.jpg, from Wikimedia
// Commons with each photo's licence and author in CREDITS.json beside it. An item without a photo keeps the package icon.
import { useState } from 'react'
import { Box } from '@mui/material'
import { C, I } from './ui'

const ItemThumb = ({ item, size = 36 }) => {
  const [failed, setFailed] = useState(false)
  const box = { width: size, height: size, borderRadius: '8px', flex: 'none', overflow: 'hidden' }
  if (!item?.code || failed) return <Box sx={{ ...box, bgcolor: 'customColors.OnBackground', display: 'grid', placeItems: 'center' }}><I i='mdi:package-variant-closed' s={Math.round(size / 2)} c={C.text} /></Box>

  return <Box component='img' src={`/images/items/${item.code}.jpg`} alt='' onError={() => setFailed(true)} sx={{ ...box, objectFit: 'cover', display: 'block', border: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }} />
}

export default ItemThumb
