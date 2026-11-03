import React from 'react'
import { Typography, Box, Tooltip, useTheme } from '@mui/material'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Utility from 'src/utility'

function UserAvatarDetails({
  profile_image,
  user_name,
  date,
  text_color = '',
  description = '',
  role = '',
  crby_width = '',
  size = 'large',
  show_time = false,
  dateType = ''
}) {
  const theme = useTheme()

  const avatarSizes = {
    small: {
      profile_picture: { width: '24px', height: '24px' },
      gap: '8px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '10px', fontWeight: 500 }
    },
    medium: {
      profile_picture: { width: '32px', height: '32px' },
      gap: '8px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '14px' }
    },
    large: {
      profile_picture: { width: '40px', height: '40px' },
      gap: '12px',
      user_name: { fontSize: '14px', fontWeight: 500 },
      date: { fontSize: '12px', fontWeight: 400, lineHeight: '21px' }
    }
  }
  const selectedAvatarSize = avatarSizes[size] || avatarSizes[size]

  return (
    <>
      {user_name ? (
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', cursor: 'default', minWidth: 0 }}>
          {profile_image ? (
            <CustomAvatar
              src={profile_image}
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            />
          ) : (
            <CustomAvatar
              sx={{
                mr: avatarSizes[size].gap,
                ...(selectedAvatarSize?.profile_picture || {})
              }}
            ></CustomAvatar>
          )}
          <Box sx={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
            {user_name && (
              <>
                <Tooltip title={user_name}>
                  <Typography
                    variant='subtitle2'
                    sx={{
                      color: text_color ?? 'text.primary',
                      width: crby_width ? crby_width : 'auto',
                      maxWidth: '100%',

                      // fontSize: fontSize,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      ...(selectedAvatarSize?.user_name || {})
                    }}
                  >
                    {user_name ? user_name : 'NA'}
                  </Typography>
                </Tooltip>

                {description && (
                  <Box sx={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
                    <Tooltip title={description}>
                      <Typography
                        sx={{
                          maxWidth: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: theme => text_color ?? theme.palette.common.white
                        }}
                        variant='body2'
                      >
                        {description}
                      </Typography>
                    </Tooltip>
                  </Box>
                )}
              </>
            )}

            {role && (
              <Box
                sx={{
                  display: 'flex',
                  flex: 1,
                  minWidth: 0,
                  flexDirection: 'column'
                }}
              >
                <Tooltip title={role}>
                  <Typography
                    variant='caption'
                    sx={{
                      lineHeight: 1.6667,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',

                      ...(selectedAvatarSize?.date || {})
                    }}
                  >
                    {role}
                  </Typography>
                </Tooltip>
              </Box>
            )}

            {date && (
              <Typography
                variant='caption'
                sx={{
                  lineHeight: 1.6667,
                  color: text_color ?? '',
                  ...(selectedAvatarSize?.date || {})
                }}
              >
                <span>
                  {dateType === 'created' ? (
                    <span style={{ color: theme.palette.customColors.neutralSecondary }}>
                      Created on {Utility.convertUtcToLocalReadableDate(date)}
                    </span>
                  ) : dateType === 'updated' ? (
                    <span style={{ color: theme.palette.customColors.neutralSecondary }}>
                      Updated on {Utility.convertUtcToLocalReadableDate(date)}
                    </span>
                  ) : (
                    <span>{date ? Utility.convertUtcToLocalReadableDate(date) : ''}</span>
                  )}
                  {show_time ? (
                    <>
                      <span> &bull; </span> {Utility.convertUTCToLocaltime(date)}
                    </>
                  ) : (
                    ''
                  )}
                </span>
                {/* <span>{date ? Utility.convertUtcToLocalReadableDate(date) : ''}</span> */}
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Typography variant='subtitle2' sx={{ color: 'text.primary', ml: 3, cursor: 'default' }}>
          -
        </Typography>
      )}
    </>
  )
}

export default React.memo(UserAvatarDetails)
