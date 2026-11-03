import React, { useState, useEffect } from 'react'
import { Box, Button, useTheme } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSettings } from 'src/@core/hooks/useSettings'
import themeConfig from 'src/configs/themeConfig'
import useMediaQuery from '@mui/material/useMediaQuery'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const BottomActionBar = ({
  children,
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  cancelLabel = 'CANCEL',
  submitLabel = 'ADMIT',
  showCancel = true,
  showSubmit = true,

  submitBtnStyle = {},
  cancelBtnStyle = {},
  submitBtnVariant = 'contained',
  cancelBtnVariant = 'outlined',
  layoutStyle = {},
  submitBtnProps = {},
  cancelBtnProps = {},
  childrenStyle = {}
}) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const { navCollapsed, contentWidth, skin } = settings
  const { navigationSize, collapsedNavigationSize } = themeConfig
  const isNavHidden = useMediaQuery(theme.breakpoints.down('lg'))
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Track if user has scrolled to the bottom of the page
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight

      // Consider "at bottom" if within 100px of the bottom (accounting for the action bar height)
      const threshold = 100
      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold

      setIsAtBottom(atBottom)
    }

    // Check initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // Calculate left offset based on navigation state (nav is hidden below lg breakpoint)
  const leftOffset = isNavHidden ? 0 : navCollapsed ? collapsedNavigationSize : navigationSize

  // Styles when not at bottom (boxed/constrained width)
  const getBoxedStyles = () => {
    if (isAtBottom || isMobile) {
      // Full width when at bottom or on mobile
      return {
        left: `${leftOffset}px`,
        right: 0,
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }
    }

    // Boxed width when scrolled up - match the page content width with margins
    return {
      left: `calc(${leftOffset}px + ${theme.spacing(6)})`,
      right: theme.spacing(6),
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      boxShadow: skin === 'bordered' ? 0 : `0px -4px 12px ${hexToRGBA(theme.palette.customColors.shadowColor, 0.15)}`,
      ...(skin === 'bordered' && {
        border: `1px solid ${theme.palette.divider}`,
        borderBottomWidth: 0
      })
    }
  }

  const renderButtons = () => {
    return (
      <>
        {showCancel && (
          <Button
            variant={cancelBtnVariant}
            sx={{
              borderColor: theme.palette.customColors.Outline,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px',
              ...cancelBtnStyle
            }}
            onClick={onCancel}
            disabled={loading}
            {...cancelBtnProps}
          >
            {cancelLabel}
          </Button>
        )}
        {showSubmit && (
          <LoadingButton
            loading={loading}
            disabled={disabled}
            variant={submitBtnVariant}
            sx={{
              backgroundColor: theme.palette.primary.main,
              borderRadius: 0.5,
              minHeight: '56px',
              minWidth: '160px',
              ...submitBtnStyle
            }}
            onClick={onSubmit}
            {...submitBtnProps}
          >
            {submitLabel}
          </LoadingButton>
        )}
      </>
    )
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        backgroundColor: theme.palette.customColors.OnPrimary,
        py: 4,
        px: 6,
        boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 100,
        transition:
          'left 0.25s ease-in-out, right 0.25s ease-in-out, max-width 0.25s ease-in-out, transform 0.25s ease-in-out, margin 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
        ...getBoxedStyles(),
        ...layoutStyle
      }}
    >
      {children && <Box sx={{ ...childrenStyle }}>{children}</Box>}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>{renderButtons()}</Box>
    </Box>
  )
}

export default BottomActionBar
