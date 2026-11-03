// ** MUI Imports
import { useEffect } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import NProgress from 'nprogress'

import Image from 'next/image'

import logoAlt from 'public/images/branding/Antz_logomark_h_color.svg'
import vantaraLogoAlt from 'public/branding/vantara/Weblogo_vantara_V.png'

NProgress.configure({ showSpinner: false })

const FallbackSpinner = ({ sx }) => {
  // Show the top progress bar while this fallback is mounted (matches the route-change UX in _app.js).
  useEffect(() => {
    NProgress.start()

    return () => {
      NProgress.done()
    }
  }, [])

  return (
    <Box // Layout via inline style so centering applies immediately on the SSR HTML — // before Emotion injects its CSS-in-JS classes. Avoids the "logo flashes at // top-left, then jumps to center" artifact on slow networks.
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 9999
      }}
      sx={{
        backgroundColor: 'background.default',
        ...sx
      }}
    >
      <Image
        src={process.env.NEXT_PUBLIC_BRANDING == 'vantara' ? vantaraLogoAlt : logoAlt}
        height={60}
        alt='Antz Systems'
      />
      {/* <svg width={80} fill='none' height={44} viewBox='0 0 268 150' xmlns='http://www.w3.org/2000/svg'>
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fill={theme.palette.primary.main}
          transform='matrix(-0.865206 0.501417 0.498585 0.866841 195.571 0)'
        />
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fillOpacity='0.4'
          fill='url(#paint0_linear_7821_79167)'
          transform='matrix(-0.865206 0.501417 0.498585 0.866841 196.084 0)'
        />
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fill={theme.palette.primary.main}
          transform='matrix(0.865206 0.501417 -0.498585 0.866841 173.147 0)'
        />
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fill={theme.palette.primary.main}
          transform='matrix(-0.865206 0.501417 0.498585 0.866841 94.1973 0)'
        />
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fillOpacity='0.4'
          fill='url(#paint1_linear_7821_79167)'
          transform='matrix(-0.865206 0.501417 0.498585 0.866841 94.1973 0)'
        />
<rect
          rx='25.1443'
          width='50.2886'
          height='143.953'
          fill={theme.palette.primary.main}
          transform='matrix(0.865206 0.501417 -0.498585 0.866841 71.7728 0)'
        />
<defs>
<linearGradient
            y1='0'
            x1='25.1443'
            x2='25.1443'
            y2='143.953'
            id='paint0_linear_7821_79167'
            gradientUnits='userSpaceOnUse'
>
<stop />
<stop offset='1' stopOpacity='0' />
</linearGradient>
<linearGradient
            y1='0'
            x1='25.1443'
            x2='25.1443'
            y2='143.953'
            id='paint1_linear_7821_79167'
            gradientUnits='userSpaceOnUse'
>
<stop />
<stop offset='1' stopOpacity='0' />
</linearGradient>
</defs>
</svg> */}
      <CircularProgress disableShrink sx={{ mt: 6 }} />
    </Box>
  )
}

export default FallbackSpinner
