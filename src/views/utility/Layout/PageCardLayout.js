import { Card, CardHeader, CardContent } from '@mui/material'
import { Grid } from '@mui/system'
import Icon from 'src/@core/components/icon'

const PageCardLayout = ({
  // Header text
  title = '',
  subtitle = '',
  onClickOfSubtitle = null,

  // Icon section
  showIcon = false,
  icon = 'ep:back',
  onIconClick = null,

  // Right-side action button/component
  action = null,

  // Styles
  cardStyles = {},
  headerStyles = {},
  contentStyles = {},
  headerLayoutStyles = {},
  titleStyles = {},
  subtitleStyles = {},
  headerTextContainerStyles = {},
  iconStyles = {},
  actionStyles = {},
  headerLeftSectionStyles = {},

  children
}) => {
  const hasHeader = title || subtitle || action || showIcon

  return (
    <Card sx={{ ...cardStyles }}>
      {hasHeader && (
        <CardHeader
          sx={{ padding: hasHeader ? 5 : 0, ...headerStyles }}
          title={
            <Grid
              container
              spacing={action ? 3 : 0}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...headerLayoutStyles }}
            >
              {/* Left Section (Icon + Title + Subtitle) */}
              <Grid
                item
                size={{ xs: 12, sm: 'auto' }}
                sx={{
                  display: 'flex',
                  alignItems: subtitle ? 'flex-start' : 'center',
                  ...headerLeftSectionStyles
                }}
              >
                {/* Back Icon */}
                {showIcon && (
                  <Grid
                    size={{ xs: 'auto' }}
                    sx={{ my: 1, marginRight: 2, paddingTop: subtitle ? 0 : 2, ...iconStyles }}
                  >
                    <Icon
                      width={24}
                      height={24}
                      style={{ cursor: onIconClick ? 'pointer' : 'default' }}
                      icon={icon}
                      onClick={() => onIconClick && onIconClick()}

                      // onClick={() => onIconClick?.()}
                    />
                  </Grid>
                )}

                {/* Title + Subtitle */}
                <Grid size={{ xs: 12, sm: 'auto' }} sx={{ ...headerTextContainerStyles }}>
                  <Grid size={12} sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 500, ...titleStyles }}>
                    {title}
                  </Grid>
                  <Grid
                    onClick={() => onClickOfSubtitle && onClickOfSubtitle()}
                    size={12}
                    sx={{
                      fontSize: '14px',

                      cursor: onClickOfSubtitle ? 'pointer' : 'default',
                      ...subtitleStyles
                    }}
                  >
                    {subtitle}
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Action Slot */}
              <Grid item size={{ xs: 12, sm: 'auto' }} sx={{ ...actionStyles }}>
                {action}
              </Grid>
            </Grid>
          }
        />
      )}

      {/* Content */}
      <CardContent
        sx={{
          paddingTop: hasHeader ? 0 : 5,
          ...contentStyles
        }}
      >
        {children}
      </CardContent>
    </Card>
  )
}

export default PageCardLayout

// This Component is used for the common Card Layout across All Listing Pages.
// Any change in the Card Layout can be done here to reflect across all pages.
//! Do not use padding for cardHeader and cardContent until necessary.
