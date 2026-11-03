// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'

const Accordion = () => {
  // Hook & Var
  const { settings } = useSettings()
  const { skin } = settings

  return {
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: theme.shadows[skin === 'bordered' ? 0 : 1],

          '&:first-of-type': {
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          },

          '&:last-of-type': {
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          },

          ...(skin === 'bordered' && {
            '&:before': { display: 'none' },
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&:first-of-type': { borderTop: `1px solid ${theme.palette.divider}` }
          }),

          variants: [
            {
              props: {
                disabled: true
              },

              style: {
                backgroundColor: `rgba(${theme.palette.customColors.main}, 0.12)`
              }
            },
            {
              props: {
                expanded: true
              },

              style: {
                boxShadow: theme.shadows[skin === 'bordered' ? 0 : 3],
                '&:not(:first-of-type)': { borderTop: `1px solid ${theme.palette.divider}` },
                ...(skin === 'bordered' && {
                  '& + .MuiAccordion-root': { borderTop: `1px solid ${theme.palette.divider}` }
                })
              }
            }
          ]
        })
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 50,
          borderRadius: 'inherit',
          padding: `0 ${theme.spacing(5)}`,

          '& + .MuiCollapse-root': {
            '& .MuiAccordionDetails-root:first-child': {
              paddingTop: 0
            }
          },

          variants: [
            {
              props: {
                expanded: true
              },

              style: {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }
            }
          ]
        }),
        content: ({ theme }) => ({
          margin: `${theme.spacing(2.5)} 0`
        })
      }
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(5),
          '& + .MuiAccordionDetails-root': {
            paddingTop: 0
          }
        })
      }
    }
  }
}

export default Accordion
