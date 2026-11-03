// ** To use core palette, uncomment the below import
// import { PaletteMode } from '@mui/material'
// ** To use core palette, uncomment the below import
// import corePalette from 'src/@core/theme/palette'
// ** To use mode (light/dark/semi-dark), skin(default/bordered), direction(ltr/rtl), etc. for conditional styles, uncomment below line
import { borderBottom, borderBottomColor, borderColor } from '@mui/system'
import { useSettings } from 'src/@core/hooks/useSettings'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { useSafeRouter } from 'src/hooks/useSafeRouter'
import { useState, useEffect, useCallback } from 'react'

const UserThemeOptions = () => {
  // ** To use mode (light/dark/semi-dark), skin(default/bordered), direction(ltr/rtl), etc. for conditional styles, uncomment below line
  const { settings } = useSettings()
  const { selectedPharmacy } = usePharmacyContext()
  const router = useSafeRouter()

  // ** To use mode (light/dark/semi-dark), skin(default/bordered), direction(ltr/rtl), etc. for conditional styles, uncomment below line
  const { mode, skin } = settings

  // ** To use core palette, uncomment the below line
  // const palette = corePalette(mode as PaletteMode, skin)
  const [bgColor, setBgColor] = useState('')

  //Theme related default function
  // const defaultBgColor = () => {
  //   if (skin === 'bordered' && mode === 'light') {
  //     return whiteColor
  //   } else if (skin === 'bordered' && mode === 'dark') {
  //     return '#30334E'
  //   } else if (mode === 'light' ) {
  //     // return '#EFF5F2'
  //     return '#E8F4F2'
  //   }  else return '#E8F4F2'

  //   // return '#282A42'
  // }

  const defaultBgColor = useCallback(() => {
    if (skin === 'bordered' && mode === 'light') {
      return whiteColor
    } else if (skin === 'bordered' && mode === 'dark') {
      return '#30334E'
    } else if (mode === 'light' && selectedPharmacy?.type === 'central') {
      return '#E8F4F2'
    } else if (mode === 'light' && selectedPharmacy?.type === 'local' && router?.asPath?.includes('pharmacy')) {
      return '#F1F8E8'
    } else {
      return '#E8F4F2'
    }
  }, [skin, mode, selectedPharmacy, router?.asPath])

  useEffect(() => {
    setBgColor(defaultBgColor())
  }, [defaultBgColor])

  return {
    palette: {
      customColors: {
        darkBg: '#282A42',
        lightBg: '#EFF5F2',
        bodyBg: '#EFF5F2',
        trackBg: '#F2F2F4',
        avatarBg: '#F1F1F3',
        tooltipBg: '#262732',
        OnTertiaryContainer: '#250E01',
        displaybgPrimary: '#E8F4F2',
        tableHeaderBg: '#E8F4F2',
        cardHeaderBg: '#F2F2F2',
        Secondary: '#00D6C9',
        Surface: '#F2FFF8',
        Outline: '#839D8D',

        // *** name required

        atnzS: '#7A8684',
        secondaryBg: '#7A8684',
        secondaryBg70: '#dae7df',
        mdAntzNeutral: '#0000000D',
        antzNotes: '#FCF4AE',
        antzNotesLight: '#FCF4AEB2',
        antzNotes80: '#FFE86E',
        antzNotes40: '#fdfad7',
        OnSurfaceVariant: '#44544A',
        OnSurfaceVariant60: '#44544A99',
        neutralSecondary: '#7A8684',
        antzNeturalBg: '#6F7F75',
        textLabel: '#00ABAB',

        // **
        OnSurfaceVariant: '#44544A',
        LightTypographyBody1: '#44544A61',

        // *** name required
        customTableCellBg: '#FCF4AE33',

        // **
        neutral05: '#0000000D',
        customCardBorder: '#00ABAB',
        OnSecondaryContainer: '#1F415B',
        neutralSecondary: '#7A8684',
        neutralTeritary: '#00000033',
        antzInfoLight: '#AFEFEB4D',
        antzInfo70: '#AFEFEBB2',
        antzInfo60: '#32bfdd',
        customHeadingTextColor: '#44544A',
        customTextColorGray2: '#44544ADE',
        PrimaryContainer: '#52F990',
        OnPrimary50: '#FFFFFFBF',

        // *** name required
        customTableHeaderBg: '#C1D3D0',

        customTableBorderBg: '#DAE7DF',
        customDropdownColor: '#FA6140',

        errorText: '#FF4D49',
        shadowColor: '#0000001A',
        avatarBackground: '#FFD3D34D',

        // **
        moderateSecondary: '#E4B819',

        // antzNotesLight: '#FCF4AEB2',
        // antzNotes80: '#FFE86E',
        // antzNotes40: '#fdfad7',

        // neutralTeritary: '#00000033',
        // antzInfoLight: '#AFEFEB4D',
        // antzInfoText: '#32bfdd',
        // antzInfo70: '#AFEFEBB2',

        TertiaryLight: '#FFD3D399',
        Tertiary30: '#FFBDA84D',
        Tertiary20: '#FFBDA833',
        OnBackground: '#E1F9ED',
        BgTeritary: '#ffebe5',
        Primary10: '#37BD691A',

        // border
        InnerAlignment: '#006D354D',

        deepDark: '#000000',
        neutral_50: '#00000066',
        Tertiary: '#FA6140',
        neutralPrimary: '#000000',
        OnPrimaryContainer: '#1F515B',
        TertiaryContainer: '#FFBDA8',
        OutlineVariant: '#C3CEC7',
        MuiFieldBorder: '#4c4e6438',
        OutlineSecondary: '#D8D8DD',
        OnPrimarycontainer10: '#1F515B0D',
        Notes: '#FCF4AE',
        Background: '#EFF5F2',
        SecondaryDark: '#00ABAB',
        SecondaryContainer: '#AFEFEB',
        Error: '#E93353',
        ErrorContainer: '#FFD3D3',
        AntzTertiary: '#FFD3D3',
        addPrimary: '#00AFD6',
        displaybgSecondary: '#DDEBE9',
        SurfaceVariant: '#DAE7DF',
        OnPrimary: '#FFFFFF',
        mainBg: '#20DE67',
        antzSecondaryBg: '#dff9f7',
        statusText: '#7A7A7A',
        Antz_Body_Medium: '#FFC300',
        grey700: 'grey.700',
        grey800: 'grey.800',
        OnSurface: '#006D35',
        rusticRed: '#4A0415', // Custom color name as not found color name in figma
        amber: '#FFC107', // Custom color name as not found color name in figma
        amberReduced: '#B26A00', // reduced-count status text (search approvals) — meaningful exception only
        paginationLabel: '#4C4E64DE'
      },
      primary: {
        // light: '#20DE67',
        light: '#1F515B',
        main: '#37BD69',
        deepDark: '#000000',
        dark: '#006D35',
        OnSurface: '#006D35',
        contrastText: '#FFF'
      },
      formContent: {
        tertiary: '#FA6140',
        bg: '#666cff14'
      },
      secondary: {
        light: '#669494',
        main: '#00AEA4',
        dark: '#1F415B',
        contrastText: '#FFF'
      },
      background: {
        paper: mode === 'light' ? '#FFFFFF' : '#30334E',

        // default: defaultBgColor()
        default: bgColor,
        OnBackground: '#E1F9ED'
      },

      // Antz text branding (operator 2026-07-05): the @core template ships Material
      // blue-grey text (rgba(76,78,100,…)), so every unstyled Typography, tab label,
      // page header and grid cell rendered off-brand. Overriding text.* here re-brands
      // ALL theme-driven text app-wide; components no longer need per-cell color for
      // plain body text (explicit tokens still win where set).
      text: {
        primary: '#44544A', // customColors.OnSurfaceVariant
        secondary: '#7A8684', // customColors.neutralSecondary
        disabled: '#44544A61' // customColors.LightTypographyBody1 (38% OnSurfaceVariant)
      },
      divider: '#DAE7DF' // customColors.SurfaceVariant — the brand border/divider token
    },
    components: {
      MuiCardHeader: {
        styleOverrides: {
          root: {},
          title: ({ theme }) => ({
            color: theme.palette.text.primary,
            lineHeight: 1.6,
            fontWeight: 500,
            fontSize: '1.125rem',
            letterSpacing: '0.15px',
            '@media (min-width: 600px)': {
              fontSize: '1.25rem'
            }
          })
        }
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 0,
            color: '#1F415B',
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none'
            }
          },
          cell: {
            // Your styles for the DataGrid cells...
            // borderBottom: 'none',
            // marginBottom: '5px',
            // paddingLeft: '1.25rem',
            // paddingRight: '1rem',
            borderBottom: '0.5px solid #839D8D',

            '&:focus': {
              outline: 'none'
            }
          },
          row: {
            '&:hover': {
              backgroundColor: '#F2FFF8',
              boxShadow: '0px 1px 8px 0px #0000001A'
            }
          },
          columnHeaders: {
            backgroundColor: '#C1D3D0'
          }

          // virtualScrollerContent: {
          //   height: '672px!important'
          // }
        }
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            // backgroundColor: 'rgba(0, 0, 0, 0.5)' // Example background color
          }
        }
      },
      MuiModal: {
        styleOverrides: {
          backdrop: {
            backgroundColor: '#1f515b99'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#EFF5F2'
          },
          backdrop: {
            backgroundColor: '#1f515bb5'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          outlined: {
            color: '#38bd69',
            border: '1px solid #8080806b'
          }
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: '#F2FFF8',
              boxShadow: '0px 1px 8px 0px #0000001A'
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '0.5px solid #839D8D'
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#C1D3D0' // Ensures the header row gets the background color
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: '#C6C6CE'
            },

            ':not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: '#D8D8DD'
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF4D49'
            },
            '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF4D49'
            }
          }
        }
      }
    }

    // breakpoints: {
    //   values: {
    //     xs: 0,
    //     sm: 768,
    //     md: 992,
    //     lg: 1200,
    //     xl: 1920
    //   }
    // }

    // components: {
    //   MuiButton: {
    //     defaultProps: {
    //       disableElevation: true
    //     },
    //     styleOverrides: {
    //       root: {
    //         textTransform: 'none'
    //       },
    //       sizeSmall: {
    //         padding: '6px 16px'
    //       },
    //       sizeMedium: {
    //         padding: '8px 20px'
    //       },
    //       sizeLarge: {
    //         padding: '11px 24px'
    //       },
    //       textSizeSmall: {
    //         padding: '7px 12px'
    //       },
    //       textSizeMedium: {
    //         padding: '9px 16px'
    //       },
    //       textSizeLarge: {
    //         padding: '12px 16px'
    //       }
    //     }
    //   },
    //   MuiCardActions: {
    //     styleOverrides: {
    //       root: {
    //         padding: '16px 24px'
    //       }
    //     }
    //   },
    //   MuiCardContent: {
    //     styleOverrides: {
    //       root: {
    //         padding: '32px 24px',
    //         '&:last-child': {
    //           paddingBottom: '32px'
    //         }
    //       }
    //     }
    //   },
    //   MuiCssBaseline: {
    //     styleOverrides: {
    //       '*': {
    //         boxSizing: 'border-box'
    //       },
    //       html: {
    //         MozOsxFontSmoothing: 'grayscale',
    //         WebkitFontSmoothing: 'antialiased',
    //         display: 'flex',
    //         flexDirection: 'column',
    //         minHeight: '100%',
    //         width: '100%'
    //       },
    //       body: {
    //         display: 'flex',
    //         flex: '1 1 auto',
    //         flexDirection: 'column',
    //         minHeight: '100%',
    //         width: '100%'
    //       },
    //       '#__next': {
    //         display: 'flex',
    //         flex: '1 1 auto',
    //         flexDirection: 'column',
    //         height: '100%',
    //         width: '100%'
    //       }
    //     }
    //   }
    // },
    // shape: {
    //   borderRadius: 8
    // },
    // typography: {
    //   fontFamily:
    //     '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
    // },
    // shadows:
    //   mode === 'light'
    //     ? [
    //         'none',
    //         '0px 2px 1px -1px rgba(76, 78, 100, 0.2), 0px 1px 1px 0px rgba(76, 78, 100, 0.14), 0px 1px 3px 0px rgba(76, 78, 100, 0.12)',
    //         '0px 3px 1px -2px rgba(76, 78, 100, 0.2), 0px 2px 2px 0px rgba(76, 78, 100, 0.14), 0px 1px 5px 0px rgba(76, 78, 100, 0.12)',
    //         '0px 4px 8px -4px rgba(76, 78, 100, 0.42)',
    //         '0px 6px 18px -8px rgba(76, 78, 100, 0.56)',
    //         '0px 3px 5px -1px rgba(76, 78, 100, 0.2), 0px 5px 8px 0px rgba(76, 78, 100, 0.14), 0px 1px 14px 0px rgba(76, 78, 100, 0.12)',
    //         '0px 2px 10px 0px rgba(76, 78, 100, 0.1)',
    //         '0px 4px 5px -2px rgba(76, 78, 100, 0.2), 0px 7px 10px 1px rgba(76, 78, 100, 0.14), 0px 2px 16px 1px rgba(76, 78, 100, 0.12)',
    //         '0px 5px 5px -3px rgba(76, 78, 100, 0.2), 0px 8px 10px 1px rgba(76, 78, 100, 0.14), 0px 3px 14px 2px rgba(76, 78, 100, 0.12)',
    //         '0px 5px 6px -3px rgba(76, 78, 100, 0.2), 0px 9px 12px 1px rgba(76, 78, 100, 0.14), 0px 3px 16px 2px rgba(76, 78, 100, 0.12)',
    //         '0px 6px 6px -3px rgba(76, 78, 100, 0.2), 0px 10px 14px 1px rgba(76, 78, 100, 0.14), 0px 4px 18px 3px rgba(76, 78, 100, 0.12)',
    //         '0px 6px 7px -4px rgba(76, 78, 100, 0.2), 0px 11px 15px 1px rgba(76, 78, 100, 0.14), 0px 4px 20px 3px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 8px -4px rgba(76, 78, 100, 0.2), 0px 12px 17px 2px rgba(76, 78, 100, 0.14), 0px 5px 22px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 8px -4px rgba(76, 78, 100, 0.2), 0px 13px 19px 2px rgba(76, 78, 100, 0.14), 0px 5px 24px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 9px -4px rgba(76, 78, 100, 0.2), 0px 14px 21px 2px rgba(76, 78, 100, 0.14), 0px 5px 26px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 5px 6px -3px rgba(76, 78, 100, 0.2), 0px 9px 12px 1px rgba(76, 78, 100, 0.14), 0px 3px 16px 2px rgba(76, 78, 100, 0.12)',
    //         '0px 6px 6px -3px rgba(76, 78, 100, 0.2), 0px 10px 14px 1px rgba(76, 78, 100, 0.14), 0px 4px 18px 3px rgba(76, 78, 100, 0.12)',
    //         '0px 6px 7px -4px rgba(76, 78, 100, 0.2), 0px 11px 15px 1px rgba(76, 78, 100, 0.14), 0px 4px 20px 3px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 8px -4px rgba(76, 78, 100, 0.2), 0px 12px 17px 2px rgba(76, 78, 100, 0.14), 0px 5px 22px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 8px -4px rgba(76, 78, 100, 0.2), 0px 13px 19px 2px rgba(76, 78, 100, 0.14), 0px 5px 24px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 7px 9px -4px rgba(76, 78, 100, 0.2), 0px 14px 21px 2px rgba(76, 78, 100, 0.14), 0px 5px 26px 4px rgba(76, 78, 100, 0.12)',
    //         '0px 8px 9px -5px rgba(76, 78, 100, 0.2), 0px 15px 22px 2px rgba(76, 78, 100, 0.14), 0px 6px 28px 5px rgba(76, 78, 100, 0.12)',
    //         '0px 8px 10px -5px rgba(76, 78, 100, 0.2), 0px 16px 24px 2px rgba(76, 78, 100, 0.14), 0px 6px 30px 5px rgba(76, 78, 100, 0.12)',
    //         '0px 8px 11px -5px rgba(76, 78, 100, 0.2), 0px 17px 26px 2px rgba(76, 78, 100, 0.14), 0px 6px 32px 5px rgba(76, 78, 100, 0.12)',
    //         '0px 9px 11px -5px rgba(76, 78, 100, 0.2), 0px 18px 28px 2px rgba(76, 78, 100, 0.14), 0px 7px 34px 6px rgba(76, 78, 100, 0.12)',
    //         '0px 9px 12px -6px rgba(76, 78, 100, 0.2), 0px 19px 29px 2px rgba(76, 78, 100, 0.14), 0px 7px 36px 6px rgba(76, 78, 100, 0.12)',
    //         '0px 10px 13px -6px rgba(76, 78, 100, 0.2), 0px 20px 31px 3px rgba(76, 78, 100, 0.14), 0px 8px 38px 7px rgba(76, 78, 100, 0.12)',
    //         '0px 10px 13px -6px rgba(76, 78, 100, 0.2), 0px 21px 33px 3px rgba(76, 78, 100, 0.14), 0px 8px 40px 7px rgba(76, 78, 100, 0.12)',
    //         '0px 10px 14px -6px rgba(76, 78, 100, 0.2), 0px 22px 35px 3px rgba(76, 78, 100, 0.14), 0px 8px 42px 7px rgba(76, 78, 100, 0.12)',
    //         '0px 11px 14px -7px rgba(76, 78, 100, 0.2), 0px 23px 36px 3px rgba(76, 78, 100, 0.14), 0px 9px 44px 8px rgba(76, 78, 100, 0.12)',
    //         '0px 11px 15px -7px rgba(76, 78, 100, 0.2), 0px 24px 38px 3px rgba(76, 78, 100, 0.14), 0px 9px 46px 8px rgba(76, 78, 100, 0.12)'
    //       ]
    //     : [
    //         'none',
    //         '0px 2px 1px -1px rgba(20, 21, 33, 0.2), 0px 1px 1px 0px rgba(20, 21, 33, 0.14), 0px 1px 3px 0px rgba(20, 21, 33, 0.12)',
    //         '0px 3px 1px -2px rgba(20, 21, 33, 0.2), 0px 2px 2px 0px rgba(20, 21, 33, 0.14), 0px 1px 5px 0px rgba(20, 21, 33, 0.12)',
    //         '0px 4px 8px -4px rgba(20, 21, 33, 0.42)',
    //         '0px 6px 18px -8px rgba(20, 21, 33, 0.56)',
    //         '0px 3px 5px -1px rgba(20, 21, 33, 0.2), 0px 5px 8px 0px rgba(20, 21, 33, 0.14), 0px 1px 14px 0px rgba(20, 21, 33, 0.12)',
    //         '0px 2px 10px 0px rgba(20, 21, 33,  0.1)',
    //         '0px 4px 5px -2px rgba(20, 21, 33, 0.2), 0px 7px 10px 1px rgba(20, 21, 33, 0.14), 0px 2px 16px 1px rgba(20, 21, 33, 0.12)',
    //         '0px 5px 5px -3px rgba(20, 21, 33, 0.2), 0px 8px 10px 1px rgba(20, 21, 33, 0.14), 0px 3px 14px 2px rgba(20, 21, 33, 0.12)',
    //         '0px 5px 6px -3px rgba(20, 21, 33, 0.2), 0px 9px 12px 1px rgba(20, 21, 33, 0.14), 0px 3px 16px 2px rgba(20, 21, 33, 0.12)',
    //         '0px 6px 6px -3px rgba(20, 21, 33, 0.2), 0px 10px 14px 1px rgba(20, 21, 33, 0.14), 0px 4px 18px 3px rgba(20, 21, 33, 0.12)',
    //         '0px 6px 7px -4px rgba(20, 21, 33, 0.2), 0px 11px 15px 1px rgba(20, 21, 33, 0.14), 0px 4px 20px 3px rgba(20, 21, 33, 0.12)',
    //         '0px 7px 8px -4px rgba(20, 21, 33, 0.2), 0px 12px 17px 2px rgba(20, 21, 33, 0.14), 0px 5px 22px 4px rgba(20, 21, 33, 0.12)',
    //         '0px 7px 8px -4px rgba(20, 21, 33, 0.2), 0px 13px 19px 2px rgba(20, 21, 33, 0.14), 0px 5px 24px 4px rgba(20, 21, 33, 0.12)',
    //         '0px 7px 9px -4px rgba(20, 21, 33, 0.2), 0px 14px 21px 2px rgba(20, 21, 33, 0.14), 0px 5px 26px 4px rgba(20, 21, 33, 0.12)',
    //         '0px 8px 9px -5px rgba(20, 21, 33, 0.2), 0px 15px 22px 2px rgba(20, 21, 33, 0.14), 0px 6px 28px 5px rgba(20, 21, 33, 0.12)',
    //         '0px 8px 10px -5px rgba(20, 21, 33, 0.2), 0px 16px 24px 2px rgba(20, 21, 33, 0.14), 0px 6px 30px 5px rgba(20, 21, 33, 0.12)',
    //         '0px 8px 11px -5px rgba(20, 21, 33, 0.2), 0px 17px 26px 2px rgba(20, 21, 33, 0.14), 0px 6px 32px 5px rgba(20, 21, 33, 0.12)',
    //         '0px 9px 11px -5px rgba(20, 21, 33, 0.2), 0px 18px 28px 2px rgba(20, 21, 33, 0.14), 0px 7px 34px 6px rgba(20, 21, 33, 0.12)',
    //         '0px 9px 12px -6px rgba(20, 21, 33, 0.2), 0px 19px 29px 2px rgba(20, 21, 33, 0.14), 0px 7px 36px 6px rgba(20, 21, 33, 0.12)',
    //         '0px 10px 13px -6px rgba(20, 21, 33, 0.2), 0px 20px 31px 3px rgba(20, 21, 33, 0.14), 0px 8px 38px 7px rgba(20, 21, 33, 0.12)',
    //         '0px 10px 13px -6px rgba(20, 21, 33, 0.2), 0px 21px 33px 3px rgba(20, 21, 33, 0.14), 0px 8px 40px 7px rgba(20, 21, 33, 0.12)',
    //         '0px 10px 14px -6px rgba(20, 21, 33, 0.2), 0px 22px 35px 3px rgba(20, 21, 33, 0.14), 0px 8px 42px 7px rgba(20, 21, 33, 0.12)',
    //         '0px 11px 14px -7px rgba(20, 21, 33, 0.2), 0px 23px 36px 3px rgba(20, 21, 33, 0.14), 0px 9px 44px 8px rgba(20, 21, 33, 0.12)',
    //         '0px 11px 15px -7px rgba(20, 21, 33, 0.2), 0px 24px 38px 3px rgba(20, 21, 33, 0.14), 0px 9px 46px 8px rgba(20, 21, 33, 0.12)'
    //       ],
    // zIndex: {
    //   appBar: 1200,
    //   drawer: 1100
    // }
  }
}

export default UserThemeOptions
