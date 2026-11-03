import React from 'react'
import { Button, Badge, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'

const FilterButtonWithNotification = ({
  label = 'Filter',
  icon,
  iconPosition = 'start',
  iconSize = 20,
  appliedFiltersCount,
  onClick,
  sx = {},
  iconSx = {},
  disabled = false,
  showTooltip = true,
  tooltipPlacement = 'top',
  tooltipProps = {},
  ...buttonProps
}) => {
  const theme = useTheme()

  // Handle icon rendering
  const renderIcon = () => {
    const iconColor = disabled
      ? theme.palette.action.disabled
      : theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary

    const iconStyle = {
      width: iconSize,
      height: iconSize,
      color: iconColor,
      ...iconSx
    }

    // Render custom icon if valid React element, else use Iconify with fallback 'mage:filter'
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, { style: iconStyle })
    }

    const iconName = typeof icon === 'string' ? icon : 'mage:filter'

    return <Icon icon={iconName} width={iconSize} height={iconSize} style={iconStyle} />
  }

  // Button style
  const mergedSx = {
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
    borderColor: theme.palette.customColors?.OutlineVariant || theme.palette.divider,
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 400,
    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
    padding: '6px 12px',
    textTransform: 'capitalize',
    ...sx
  }

  // Badge style
  const badgeSx = {
    '& .MuiBadge-badge': {
      top: 6,
      right: 6,
      minWidth: 18,
      height: 18,
      fontSize: 12,
      borderRadius: '9px',
      backgroundColor: disabled ? theme.palette.action.disabledBackground : theme.palette.primary.main,
      color: disabled ? theme.palette.text.disabled : theme.palette.primary.contrastText
    }
  }

  // Button element
  const button = (
    <Button
      variant='outlined'
      onClick={onClick}
      disabled={disabled}
      startIcon={iconPosition === 'start' ? renderIcon() : undefined}
      endIcon={iconPosition === 'end' ? renderIcon() : undefined}
      sx={mergedSx}
      {...buttonProps}
    >
      {label}
    </Button>
  )

  // Wrap in badge if filters applied
  const wrappedButton = appliedFiltersCount ? (
    <Badge
      badgeContent={appliedFiltersCount}
      overlap='rectangular'
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={badgeSx}
    >
      {button}
    </Badge>
  ) : (
    button
  )

  // Tooltip wrapping
  return showTooltip ? (
    <Tooltip title={label} placement={tooltipPlacement} {...tooltipProps}>
      <span style={{ display: 'inline-flex' }}>{wrappedButton}</span>
    </Tooltip>
  ) : (
    wrappedButton
  )
}

export default React.memo(FilterButtonWithNotification)

/**
 * === FilterButtonWithNotification Component Props ===
 *
 * - label?: string — Text label shown inside the button (default: "Filter").
 * - icon?: React.ReactNode | string — Icon component or Iconify string to display on the button.
 * - iconPosition?: 'start' | 'end' — Position of the icon relative to the label (default: 'start').
 * - iconSize?: number — Size of the icon in pixels (default: 24).
 * - appliedFiltersCount?: number — If provided, shows a badge with this number on the button.
 * - onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void — Click handler for the button.
 * - sx?: SxProps — Custom styles for the MUI `Button` component.
 * - iconSx?: React.CSSProperties — Custom styles specifically for the icon.
 * - disabled?: boolean — Disables the button and dims visual elements (default: false).
 * - showTooltip?: boolean — If true, wraps the button in a tooltip (default: true).
 * - tooltipPlacement?: TooltipProps['placement'] — Tooltip position (default: 'top').
 * - tooltipProps?: TooltipProps — Additional props to pass to the Tooltip component.
 * - ...buttonProps?: ButtonProps — Any other valid props for MUI's `Button` component.
 */
