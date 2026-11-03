import { Avatar, Button, CircularProgress, Dialog, Typography } from '@mui/material'
import React from 'react'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const ConfirmationDialog = ({
  image,
  icon,
  iconColor,
  title,
  loading = false,
  description,
  additionalDescription,
  dialogBoxStatus,
  onClose = () => {},
  formComponent,
  ConfirmationText,
  confirmAction = () => {},
  cancelText,
  confirmBtnStyle,
  cancelBtnStyle,
  imgStyle,
  imgHeight = '70px',
  imgWidth = '70px',
  allowCancel = true
}) => {
  const theme = useTheme()

  return (
    <Dialog
      open={dialogBoxStatus}
      maxWidth='sm'
      height='auto'
      scroll='body'
      disableEscapeKeyDown
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      // onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#fff',
          padding: 8,
          textAlign: 'center'
        }
      }}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return
        onClose()
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',

          // padding: '40px',
          alignItems: 'center'
        }}
      >
        {icon ? (
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.palette.customColors.mdAntzNeutral
            }}
          >
            <Icon width={imgWidth} height={imgHeight} color={iconColor ? iconColor : null} icon={icon} />
          </Box>
        ) : null}
        {image ? (
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.palette.customColors.mdAntzNeutral,
              ...imgStyle
            }}
          >
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: imgWidth,
                height: imgHeight
              }}
              variant='rounded'
              alt={image}
              src={image}
            />
          </Box>
        ) : null}
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center' }}>{title ? title : null}</Typography>
          <Typography sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center' }}>
            {description ? description : null}
          </Typography>
          {additionalDescription ? (
            <Typography sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center' }}>{additionalDescription}</Typography>
          ) : null}
        </Box>
        {formComponent ? <Box sx={{ width: '100%' }}>{formComponent} </Box> : null}
        <Box sx={{ display: 'flex', justifyContent: allowCancel ? 'space-between' : 'center', width: '100%', gap: 5 }}>
          {allowCancel && (
            <Button
              disabled={loading}
              onClick={() => onClose()}
              variant='outlined'
              sx={{
                color: 'gray',
                width: '45%',
                ...cancelBtnStyle
              }}
            >
              {cancelText ? cancelText : 'Cancel'}
            </Button>
          )}
          <Button
            sx={{
              width: '45%',
              ...confirmBtnStyle
            }}
            disabled={loading}
            variant='contained'
            onClick={confirmAction}
          >
            {loading ? <CircularProgress size={16} /> : <>{ConfirmationText ? ConfirmationText : 'Yes'}</>}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default ConfirmationDialog
