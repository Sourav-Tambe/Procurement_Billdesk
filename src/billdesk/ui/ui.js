// New request, TAB look on the web (Sourav, 23 Oct: "have it same as the one in the TAB version"). The pieces the
// TAB form is made of (Antz-Design-TAB/Projects/Item-requests-v1 req.css), as MUI parts: white section cards with an
// icon title, the slim two-way switch, the numbered steps, tinted pick fields with ⊕ / ✕, the bottom bar buttons,
// and a right side sheet (the web's version of the TAB bottom sheet; Antz CustomDrawer header).
import { forwardRef } from 'react'
import { Avatar, Box, Button, ButtonBase, Drawer, IconButton, InputBase, Popover, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

// TAB tokens (Antz-Design-TAB/app/tokens.css)
export const C = {
  white: '#FFFFFF', black: '#000000', bg: '#EFF5F2', surface: '#F2FFF8', tint: '#E8F4F2', line: '#C3CEC7', outline: '#839D8D',
  text: '#44544A', quiet: '#7A8684', navy: '#1F515B', ink: '#1F415B', green: '#37BD69', greenDark: '#006D35', teal: '#00ABAB',
  tert: '#FA6140', error: '#E93353', n05: 'rgba(0,0,0,0.05)', n10: 'rgba(0,0,0,0.1)', panel: 'rgba(0,0,0,0.035)', sec: '#00D6C9',
  upload: 'rgba(175,239,235,0.3)', gold: '#E4B819',
  // Antz web theme tokens (UserThemeOptions customColors) for states: notes yellow for "check this", tertiary and
  // error containers, the table header, the secondary background
  notes: '#FCF4AE', notes40: '#fdfad7', amberText: '#B26A00', tert20: '#FFBDA833', tertBg: '#ffebe5', errBg: '#FFD3D3',
  tableHead: '#E8F4F2', secBg: '#dff9f7', surfaceVariant: '#DAE7DF', onBg: '#E1F9ED'
}
// TAB type ladder (app/type.css)
export const T = {
  major: { fontSize: 24, fontWeight: 600 }, medium: { fontSize: 20, fontWeight: 500 }, minorTitle: { fontSize: 16, fontWeight: 600 },
  minorMedium: { fontSize: 16, fontWeight: 500 }, minor: { fontSize: 16, fontWeight: 400 }, bodyTitle: { fontSize: 14, fontWeight: 600 },
  bodyMedium: { fontSize: 14, fontWeight: 500, letterSpacing: '0.1px' }, body: { fontSize: 14, fontWeight: 400 },
  subTitle: { fontSize: 12, fontWeight: 600 }, sub: { fontSize: 12, fontWeight: 400 }
}
export const num = { fontVariantNumeric: 'tabular-nums' }
export const Txt = ({ t = 'body', c, sx, children, ...rest }) => (
  <Typography component='span' sx={{ ...T[t], lineHeight: 'normal', color: c || 'inherit', ...sx }} {...rest}>{children}</Typography>
)
export const I = ({ i, s = 20, c, sx }) => <Box component={Icon} icon={i} fontSize={s} sx={{ flex: 'none', color: c, ...sx }} />

// white section card: icon + title, then the content (TAB .nsec)
export const Sec = ({ icon, title, act, children, sx }) => (
  <Box component='section' sx={{ bgcolor: C.white, borderRadius: '12px', p: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', ...sx }}>
    {title && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.text }}>
        <I i={icon} />
        <Txt t='minorTitle'>{title}</Txt>
        {act && <Box sx={{ ml: 'auto' }}>{act}</Box>}
      </Box>
    )}
    {children}
  </Box>
)

// slim two-way switch (TAB .seg2): a tinted tray, the chosen half white and raised
// tray: on a white card the TAB tint; on the page background a darker tint so the tray reads as in TAB (Sourav, 23 Oct)
export const Seg2 = ({ options, value, onChange, label, onPage }) => (
  <Box role='radiogroup' aria-label={label} sx={{ display: 'inline-flex', p: '3px', borderRadius: '12px', bgcolor: onPage ? '#DAE7DF' : C.tint, flex: 'none' }}>
    {options.map(([k, l]) => {
      const on = k === value

      return (
        <ButtonBase key={k} role='radio' aria-checked={on} onClick={() => onChange(k)}
          sx={{ height: 42, px: '20px', borderRadius: '9px', ...T.bodyMedium, color: on ? C.black : C.text, bgcolor: on ? C.white : 'transparent', boxShadow: on ? `0 1px 3px ${C.n10}, 0 0 0 1px ${C.n05}` : 'none', transition: 'background .15s, box-shadow .15s' }}>
          {l}
        </ButtonBase>
      )
    })}
  </Box>
)

// a field-like button that opens a menu (TAB .storepick)
export const PickButton = forwardRef(({ children, onClick, minWidth = 260, sx, ...rest }, ref) => (
  <ButtonBase ref={ref} onClick={onClick} aria-haspopup='listbox' {...rest}
    sx={{ height: 48, minWidth, pl: '16px', pr: '12px', gap: '8px', justifyContent: 'flex-start', border: `1px solid ${C.line}`, borderRadius: '10px', bgcolor: C.white, color: C.black, textAlign: 'left', ...sx }}>
    {children}
    <I i='mdi:chevron-down' s={18} c={C.text} sx={{ ml: 'auto' }} />
  </ButtonBase>
))
PickButton.displayName = 'PickButton'

// on / off switch inside an outlined box (TAB .tgl.dstgl)
export const Toggle = ({ on, label, onClick }) => (
  <ButtonBase role='switch' aria-checked={on} onClick={onClick}
    sx={{ minHeight: 48, px: '16px', gap: '12px', border: `1px solid ${C.line}`, borderRadius: '8px', bgcolor: C.white, color: C.black, flex: 'none' }}>
    <Txt t='bodyMedium'>{label}</Txt>
    <Box sx={{ width: 44, height: 26, borderRadius: '13px', bgcolor: on ? C.green : C.line, position: 'relative', transition: 'background .15s',
      '&::after': { content: '""', position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', bgcolor: C.white, boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .15s' } }} />
  </ButtonBase>
)

// numbered steps (TAB .vsteps): 28px circles, ✓ when done, a 48px connector, tap to jump
export const Steps = ({ steps, at, onGo, sx }) => (
  <Box role='tablist' sx={{ display: 'flex', alignItems: 'center', gap: '12px', ...sx }}>
    {steps.map(([k, l], i) => (
      <Box key={k} sx={{ display: 'contents' }}>
        {i > 0 && <Box sx={{ width: 48, height: 2, borderRadius: 1, flex: 'none', bgcolor: i <= at ? C.navy : C.n05, transition: 'background .3s' }} />}
        <ButtonBase role='tab' aria-selected={i === at} onClick={() => onGo(k)} sx={{ gap: '12px', borderRadius: '8px', color: i <= at ? C.navy : C.text }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: i <= at ? C.navy : C.n05, color: i <= at ? C.white : C.text, ...T.subTitle, transition: 'background .3s, color .3s' }}>
            {i < at ? <I i='mdi:check' s={14} /> : i + 1}
          </Box>
          <Txt t='bodyMedium'>{l}</Txt>
        </ButtonBase>
      </Box>
    ))}
  </Box>
)

export const Label = ({ children, req }) => (
  <Txt t='body' c={C.text} sx={{ display: 'block', mb: '8px' }}>{children}{req ? ' *' : ''}</Txt>
)

// round avatar for pick fields and people (TAB .av.pav)
export const Ava = ({ children, size = 40, bg = C.sec, sx }) => (
  <Avatar sx={{ width: size, height: size, bgcolor: bg, color: C.white, ...T.bodyTitle, fontSize: size >= 40 ? 14 : 11, ...sx }}>{children}</Avatar>
)

// a field that opens a list (old Help Desk form): placeholder + ⊕ when empty; chosen = tinted, avatar, value, ✕
export const PickField = ({ value, sub, placeholder, onOpen, onClear, avatar, bad }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 56, border: `1px solid ${value ? 'transparent' : bad ? C.error : C.line}`, borderRadius: '8px', bgcolor: value ? C.tint : C.surface }}>
    <ButtonBase onClick={onOpen} sx={{ flex: 1, minWidth: 0, minHeight: 56, px: '16px', py: '8px', gap: '12px', justifyContent: 'flex-start', textAlign: 'left', color: C.black }}>
      {value ? (
        <>
          {avatar}
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Txt t='minorMedium' noWrap>{value}</Txt>
            {sub && <Txt t='body' c={C.text} noWrap>{sub}</Txt>}
          </Box>
        </>
      ) : (
        <>
          <Txt t='minor' c={C.ink} sx={{ flex: 1 }}>{placeholder}</Txt>
          <I i='mdi:plus-circle-outline' s={24} c={C.teal} />
        </>
      )}
    </ButtonBase>
    {value && onClear && (
      <IconButton aria-label='Remove' onClick={onClear} sx={{ width: 44, height: 44, mr: '4px', color: C.tert }}>
        <I i='mdi:close-circle-outline' s={24} />
      </IconButton>
    )}
  </Box>
)

// buttons: the Antz codebase's MUI Button on the Antz theme (Sourav, 2 Nov: "use Antz components", "the buttons are
// differing"). pri = contained primary, outline = outlined primary, ghost = text, danger = contained error
const BTN = { pri: { variant: 'contained', color: 'primary' }, outline: { variant: 'outlined', color: 'primary' }, ghost: { variant: 'text', color: 'primary' }, danger: { variant: 'contained', color: 'error' } }
// one fixed height, 40px, as across the compliance build (Sourav, 2 Nov); a caller's height is ignored
export const Btn = ({ kind = 'outline', icon, children, sx, ...rest }) => {
  const { height, ...own } = sx || {} // eslint-disable-line no-unused-vars

  return (
  <Button {...BTN[kind]} startIcon={icon ? <I i={icon} s={18} /> : undefined} {...rest} sx={{ whiteSpace: 'nowrap', flex: 'none', ...own, height: 40, py: 0 }}>
    {children}
  </Button>
  )
}

// a search box (TAB .search inside .nsearch: 48px, 8px corners, white)
export const SearchBox = ({ value, onChange, placeholder, autoFocus, sx, inputRef }) => (
  <Box sx={{ height: 48, minHeight: 48, flex: '1 0 auto', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '8px', px: '16px', bgcolor: C.white, border: `1px solid ${C.line}`, borderRadius: '8px', color: C.text, '&:focus-within': { borderColor: C.ink, boxShadow: '0 0 0 3px rgba(31,81,91,0.1)' }, ...sx }}>
    <I i='mdi:magnify' />
    <InputBase inputRef={inputRef} autoFocus={autoFocus} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputProps={{ 'aria-label': placeholder }} sx={{ flex: 1, ...T.minor, color: C.text }} />
    {value ? <IconButton aria-label='Clear search' size='small' onClick={() => onChange('')}><I i='mdi:close' s={18} c={C.text} /></IconButton> : null}
  </Box>
)

// a menu under its button (TAB .menu / .smenu)
export const Menu = ({ anchor, onClose, width, children }) => (
  <Popover open={!!anchor} anchorEl={anchor} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    slotProps={{ paper: { sx: { mt: '6px', width: width || Math.max(340, anchor?.offsetWidth || 0), maxHeight: 520, p: '8px', borderRadius: '12px', boxShadow: `0 0 0 1px ${C.n05}, 0 12px 32px -8px rgba(0,0,0,.2)` } } }}>
    {children}
  </Popover>
)
export const MenuGroup = ({ children }) => <Txt t='subTitle' c={C.quiet} sx={{ display: 'block', p: '12px 12px 4px' }}>{children}</Txt>
export const MenuItem = ({ on, disabled, onClick, title, children }) => (
  <ButtonBase role='option' aria-selected={!!on} disabled={disabled} onClick={onClick} title={title}
    sx={{ width: '100%', minHeight: 56, px: '12px', py: '8px', gap: '8px', borderRadius: '8px', justifyContent: 'flex-start', textAlign: 'left', color: C.black, bgcolor: on ? C.n05 : 'transparent', '&:hover': { bgcolor: C.n05 }, '&.Mui-disabled': { opacity: 0.45 } }}>
    {children}
    {on && <I i='mdi:check' s={18} c={C.ink} sx={{ ml: 'auto' }} />}
  </ButtonBase>
)

// right side sheet (the TAB bottom sheet on the web; Antz CustomDrawer header: title 24 · close)
export const Sheet = ({ open, onClose, title, sub, head, children, foot, width = 560, onBack }) => (
  <Drawer anchor='right' open={open} onClose={onClose} sx={{ zIndex: 1410 }} slotProps={{ paper: { sx: { width, maxWidth: '100vw', bgcolor: C.bg, display: 'flex', flexDirection: 'column' } } }}>
    <Box sx={{ p: '20px 24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onBack && <IconButton aria-label='Back' onClick={onBack} sx={{ ml: '-8px', color: C.text }}><I i='mdi:arrow-left' s={24} /></IconButton>}
        <Txt t='major' c={C.text} sx={{ flex: 1, fontWeight: 500 }}>{title}</Txt>
        <IconButton aria-label='Close' onClick={onClose} sx={{ color: C.text }}><I i='mdi:close' s={24} /></IconButton>
      </Box>
      {sub}
      {head}
    </Box>
    <Box sx={{ flex: 1, overflowY: 'auto', p: '4px 24px 24px' }}>{children}</Box>
    {foot && <Box sx={{ p: '16px 24px', bgcolor: C.white, borderTop: `1px solid ${C.n05}`, display: 'flex', gap: '8px' }}>{foot}</Box>}
  </Drawer>
)

// review panel (TAB .rvp): tinted frame, icon title, white body
// card = each section is its own white container on the page (Sourav, 23 Oct: "try one version where each card is itself a container")
export const Panel = ({ icon, title, right, children, card }) => card ? (
  <Box component='section' sx={{ borderRadius: '12px', bgcolor: C.white, p: '8px 24px 24px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 56, color: C.text }}>
      <I i={icon} c={C.outline} />
      <Txt t='minorTitle' sx={{ flex: 1 }}>{title}</Txt>
      {right}
    </Box>
    <Box sx={{ pt: '4px' }}>{children}</Box>
  </Box>
) : (
  <Box component='section' sx={{ borderRadius: '16px', bgcolor: C.panel, p: '4px 16px 16px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 52, color: C.text }}>
      <I i={icon} c={C.outline} />
      <Txt t='minorTitle' sx={{ flex: 1 }}>{title}</Txt>
      {right}
    </Box>
    <Box sx={{ borderRadius: '10px', bgcolor: C.white, p: '16px' }}>{children}</Box>
  </Box>
)

export const initials = n => String(n || '?').replace(/^Dr\.?\s+/, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
