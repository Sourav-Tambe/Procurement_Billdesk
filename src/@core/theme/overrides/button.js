// ** Theme Config Imports
import themeConfig from 'src/configs/themeConfig'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const Button = () => {
  return {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          borderRadius: 8,
          lineHeight: 1.715,

          '&.MuiButton-text.MuiButton-colorPrimary:hover': {
            backgroundColor: hexToRGBA(theme.palette.primary.main, 0.08)
          },
          '&.MuiButton-text.MuiButton-colorSecondary:hover': {
            backgroundColor: hexToRGBA(theme.palette.secondary.main, 0.08)
          },
          '&.MuiButton-text.MuiButton-colorSuccess:hover': {
            backgroundColor: hexToRGBA(theme.palette.success.main, 0.08)
          },
          '&.MuiButton-text.MuiButton-colorError:hover': {
            backgroundColor: hexToRGBA(theme.palette.error.main, 0.08)
          },
          '&.MuiButton-text.MuiButton-colorWarning:hover': {
            backgroundColor: hexToRGBA(theme.palette.warning.main, 0.08)
          },
          '&.MuiButton-text.MuiButton-colorInfo:hover': {
            backgroundColor: hexToRGBA(theme.palette.info.main, 0.08)
          },

          variants: [
            {
              props: {
                variant: 'text',
                size: 'medium'
              },

              style: {
                padding: `${theme.spacing(1.75, 3)}`
              }
            }
          ]
        }),
        contained: ({ theme }) => ({
          boxShadow: theme.shadows[3],
          padding: `${theme.spacing(1.75, 5.5)}`
        }),
        outlined: ({ theme }) => ({
          lineHeight: 1.572,
          padding: `${theme.spacing(1.75, 5.25)}`,
          '&.MuiButton-outlined.MuiButton-colorPrimary:hover': {
            backgroundColor: hexToRGBA(theme.palette.primary.main, 0.08)
          },
          '&.MuiButton-outlined.MuiButton-colorSecondary:hover': {
            backgroundColor: hexToRGBA(theme.palette.secondary.main, 0.08)
          },
          '&.MuiButton-outlined.MuiButton-colorSuccess:hover': {
            backgroundColor: hexToRGBA(theme.palette.success.main, 0.08)
          },
          '&.MuiButton-outlined.MuiButton-colorError:hover': {
            backgroundColor: hexToRGBA(theme.palette.error.main, 0.08)
          },
          '&.MuiButton-outlined.MuiButton-colorWarning:hover': {
            backgroundColor: hexToRGBA(theme.palette.warning.main, 0.08)
          },
          '&.MuiButton-outlined.MuiButton-colorInfo:hover': {
            backgroundColor: hexToRGBA(theme.palette.info.main, 0.08)
          }
        }),
        sizeSmall: ({ theme }) => ({
          lineHeight: 1.693,

          variants: [
            {
              props: {
                variant: 'text'
              },

              style: {
                padding: `${theme.spacing(1, 2.25)}`
              }
            },
            {
              props: {
                variant: 'contained'
              },

              style: {
                padding: `${theme.spacing(1, 3.25)}`
              }
            },
            {
              props: {
                variant: 'outlined'
              },

              style: {
                lineHeight: 1.539,
                padding: `${theme.spacing(1, 3)}`
              }
            }
          ]
        }),
        sizeLarge: ({ theme }) => ({
          lineHeight: 1.734,

          variants: [
            {
              props: {
                variant: 'text'
              },

              style: {
                padding: `${theme.spacing(2, 5.5)}`
              }
            },
            {
              props: {
                variant: 'contained'
              },

              style: {
                padding: `${theme.spacing(2, 6.5)}`
              }
            },
            {
              props: {
                variant: 'outlined'
              },

              style: {
                lineHeight: 1.6,
                padding: `${theme.spacing(2, 6.25)}`
              }
            }
          ]
        })
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: themeConfig.disableRipple
      }
    }
  }
}

export default Button
