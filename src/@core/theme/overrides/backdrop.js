// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const Backdrop = () => {
  return {
    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: hexToRGBA('#101121', 0.87),

          ...theme.applyStyles('light', {
            backgroundColor: `rgba(${theme.palette.customColors.main}, 0.5)`
          })
        }),
        invisible: {
          backgroundColor: 'transparent'
        }
      }
    }
  }
}

export default Backdrop
