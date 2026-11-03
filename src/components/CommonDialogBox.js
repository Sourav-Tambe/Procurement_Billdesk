// ** MUI Imports
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Fade from '@mui/material/Fade'
import { CardContent, CardHeader, CircularProgress } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const CommonDialogBox = ({
  title,
  dialogBoxStatus,
  formComponent,
  close,
  noWidth,
  style,
  dialogWithMaxWidth,
  loader,

  // optional: padding for the header and content (default: the theme's card padding, as before)
  padding,
  // Bill Desk lite addition: extra paper styles, e.g. a wider modal (default: none, as before)
  paperSx
}) => {
  return (
    <Dialog
      fullWidth={noWidth ? false : true}
      open={dialogBoxStatus}
      maxWidth={dialogWithMaxWidth ? 'lg' : 'md'}
      height='auto'
      scroll='body'
      slots={{ transition: Fade }}
      {...(paperSx && { slotProps: { paper: { sx: paperSx } } })}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          close()
        }
      }}
    >
      <Card sx={{ bgcolor: style }}>
        {title && (
          <>
            <CardHeader
              sx={padding != null ? { p: padding } : undefined}
              title={title ? title : null}
              action={
                <>
                  {loader ? (
                    <CircularProgress color='success' size={20} />
                  ) : (
                    <IconButton size='small' onClick={() => close()} sx={{ mx: 4 }}>
                      <Icon icon='mdi:close' />
                    </IconButton>
                  )}
                </>
              }
            />
            {/* <Divider variant='middle' /> */}
          </>
        )}

        <CardContent sx={padding != null ? { px: padding, pb: padding, '&:last-of-type': { pb: padding }, ...(title ? {} : { pt: padding }) } : undefined}>
          <>{formComponent ? formComponent : null}</>
        </CardContent>
      </Card>
    </Dialog>
  )
}

export default CommonDialogBox
