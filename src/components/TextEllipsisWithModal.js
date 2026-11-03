import React, { useState } from 'react'
import { Typography, CardContent, Grid, Button, CardActions, Divider, Tooltip } from '@mui/material'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import Icon from 'src/@core/components/icon'

const truncateText = (text, limit) => {
  return text?.length > limit ? text.slice(0, limit) + '...' : text
}

const TextEllipsisWithModal = ({ enableDialog = true, placement = 'bottom', arrow = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    if (enableDialog) setIsOpen(true)
  }

  const handleClose = () => setIsOpen(false)

  return (
    <>
      <Grid
        onClick={handleOpen}
        sx={{
          display: 'flex',
          color: 'customColors.neutralSecondary',
          cursor: enableDialog ? 'pointer' : 'text',
          alignItems: 'center'
        }}
      >
        {props?.icon && (
          <Icon
            icon={props?.icon}
            style={{ fontSize: '20px', color: props?.iconColor ? props?.iconColor : '#00000066', flexShrink: 0 }}
          />
        )}
        <Tooltip title={props?.text} placement={placement} arrow={arrow}>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              cursor: enableDialog ? 'pointer' : 'text',
              maxWidth: '100px',
              ...props?.style
            }}
          >
            {truncateText(props?.text, props?.limit)}
          </Typography>
        </Tooltip>
      </Grid>

      <ConfirmDialogBox
        open={isOpen}
        closeDialog={handleClose}
        action={handleClose}
        title='Comment'
        content={
          <>
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12 }}>
                  <Grid sx={{ mt: 2, position: 'relative', right: 8 }}>
                    <Typography sx={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: 500 }}>
                      {props?.text}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions style={{ justifyContent: 'flex-end', position: 'relative', marginTop: '-2px' }}>
              <Button
                sx={{ position: 'relative', bottom: '-40px', left: '25px' }}
                variant='contained'
                onClick={handleClose}
              >
                Cancel
              </Button>
            </CardActions>
          </>
        }
      />
    </>
  )
}

export default TextEllipsisWithModal
