// Bill Desk screen parts, in the Compliance module's look (compliance-lite ShipmentsListing / _table.tsx, Sourav
// 31 Oct: "refer the UI for tables, containers"): a breadcrumb, then one white container (MUI Card, p 24) holding the
// title row with the green uppercase add button, the toolbar (search left, filters right) and an enclosed table
// (8px OutlineVariant border, tableHeaderBg header with 12/600 titles, 64px rows, Surface hover). L1 = underline
// Tabs, L2 = filled toggle. Desktop only. Also: status pills, the selection bar, a dialog that asks for a note.
import { useEffect, useState } from 'react'
import GlobalStyles from '@mui/material/GlobalStyles'
import { alpha } from '@mui/material/styles'
import { Box, Button, Card as MuiCard, Dialog, Tooltip, InputAdornment, InputBase, MenuItem, Select, Tab, Tabs, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useSettings } from 'src/@core/hooks/useSettings'
import ClientOnly from './ClientOnly'
import { DataGrid } from '@mui/x-data-grid'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { C, T, Txt, I, Btn } from './ui'
import { STAGE } from '../logic'

const INK = '#1F415B', OUTLINE = '#C3CEC7', HEAD_BG = '#E8F4F2', ROW_LINE = 'rgba(131,157,141,0.5)'

// crumb: ['Bill Desk', 'DCs']; contained: lists sit in one container, detail pages lay their own sections
export const Page = ({ title, sub, act, crumb, contained = true, children }) => {
  const header = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', mb: contained ? 6 : 4 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='h5' component='div' sx={{ fontSize: '24px !important', fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{title}</Typography>
        {sub && <Txt t='body' c={C.quiet} sx={{ display: 'block', mt: '4px' }}>{sub}</Txt>}
      </Box>
      {act && <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 'none' }}>{act}</Box>}
    </Box>
  )

  return (
    <ClientOnly>
      <GlobalStyles styles={{
        '.layout-wrapper': { overflowX: 'clip !important', overflowY: 'visible !important' },
        '.layout-vertical-nav .MuiChip-root': { backgroundColor: 'transparent !important', height: 'auto !important', boxShadow: 'none !important' },
        '.layout-vertical-nav .MuiChip-root .MuiChip-label': { fontSize: '14px !important', fontWeight: '600 !important', padding: '0 !important', color: '#44544A !important' },
        '.layout-vertical-nav .active .MuiChip-root .MuiChip-label, .layout-vertical-nav .Mui-selected .MuiChip-root .MuiChip-label': { color: '#FFFFFF !important' }
      }} />
      <Box sx={{ pb: '96px' }}>
        {crumb && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            {crumb.map((c, i) => <Box key={i} sx={{ display: 'contents' }}>{i > 0 && <Typography variant='body1' sx={{ color: 'text.secondary' }}>/</Typography>}<Typography variant='body1' sx={{ color: i === crumb.length - 1 ? 'text.primary' : 'text.disabled' }}>{c}</Typography></Box>)}
          </Box>
        )}
        {contained
          ? <MuiCard sx={{ p: 6 }}>{(title || act) && header}{children}</MuiCard>
          : <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{(title || act) && header}{children}</Box>}
      </Box>
    </ClientOnly>
  )
}

// a section on a detail page: the same container as a list page
export const Card = ({ children, sx, pad = true }) => <MuiCard sx={{ ...(pad && { p: 5 }), ...sx }}>{children}</MuiCard>

// the green uppercase page-header action (compliance "Add New")
export const AddBtn = ({ children, icon = 'mdi:plus', onClick }) => (
  <Box component='button' onClick={onClick} sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, minWidth: 125, height: 40, px: 5, border: 0, borderRadius: '8px', backgroundColor: 'primary.main', color: 'common.white', cursor: 'pointer', fontWeight: 500, fontSize: 16, letterSpacing: '0.4px', textTransform: 'uppercase', fontFamily: 'inherit' }}> {/* buttons are 16px (2 Nov) */}
    <Icon icon={icon} fontSize='1rem' />{children}
  </Box>
)

// L1: underline tabs (compliance FolderDetail)
export const L1Tabs = ({ value, onChange, tabs }) => (
  <Tabs value={value} onChange={(e, v) => onChange(v)} sx={{ mb: 6, borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}`, '& .MuiTabs-indicator': { height: 2, backgroundColor: 'primary.main' }, '& .MuiTab-root': { minWidth: 0, minHeight: 52, fontSize: 16, textTransform: 'none', fontWeight: 400, color: 'customColors.neutralSecondary', '&.Mui-selected': { color: 'primary.main', fontWeight: 500 } } }}>
    {tabs.map(([v, l]) => <Tab key={v} value={v} label={l} />)}
  </Tabs>
)

// L2: the category pills under Documents on the Compliance species page (compliance build, DetailTabTables
// DocumentsTab): MUI buttons, 40 high, 8px radius, uppercase; the active one is OnSecondaryContainer with white text,
// the rest black at 5% with OnSurfaceVariant text. Labels carry their count in brackets.
export const Seg = ({ value, onChange, options }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
    {options.map(([v, l]) => (
      <Button key={v} disableElevation onClick={() => onChange(v)}
        sx={{ height: 40, px: 5, borderRadius: '8px', fontWeight: 500, fontSize: 14, /* secondary tabs stay 14px while buttons are 16 (2 Nov) */
          backgroundColor: theme => (value === v ? theme.palette.customColors.OnSecondaryContainer : alpha(theme.palette.common.black, 0.05)),
          color: value === v ? 'common.white' : 'customColors.OnSurfaceVariant',
          '&:hover': { backgroundColor: theme => (value === v ? theme.palette.customColors.OnSecondaryContainer : alpha(theme.palette.common.black, 0.08)) } }}>
        {l}
      </Button>
    ))}
  </Box>
)

// toolbar search (compliance searchFieldSx: 4px radius, OutlineVariant border)
export const SearchField = ({ value, onChange, placeholder, width = 320 }) => (
  <TextField size='small' value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    sx={{ width, '& .MuiOutlinedInput-root': { borderRadius: '4px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'customColors.OutlineVariant' } }}
    InputProps={{ startAdornment: <InputAdornment position='start'><Icon icon='mdi:magnify' fontSize='1.25rem' /></InputAdornment> }} />
)

// toolbar dropdown, same box as the search
export const Pick = ({ value, onChange, all, options, width = 220 }) => (
  <Select size='small' value={value} onChange={e => onChange(e.target.value)} sx={{ width, borderRadius: '4px', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'customColors.OutlineVariant' } }}>
    <MenuItem value='all'>{all}</MenuItem>
    {options.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
  </Select>
)

// the list toolbar: left side, right side
export const Toolbar = ({ left, right }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, mb: 6 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>{left}</Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>{right}</Box>
  </Box>
)

const TONES = {
  ok: { bgcolor: C.tint, color: C.greenDark },
  warn: { bgcolor: C.tert20, color: C.tert },
  bad: { bgcolor: C.errBg, color: C.error },
  check: { bgcolor: C.notes, color: C.amberText },
  info: { bgcolor: C.secBg, color: C.ink },
  quiet: { bgcolor: C.n05, color: C.text }
}
// an invoice's stage pill, the same wherever it is shown, no dot (3 Nov) (logic.js STAGE). label/tone set one
// that is not an invoice stage, such as a challan's "To bill"
export const StagePill = ({ status, label, tone }) => {
  const [l, t] = STAGE[status] || [label || status, tone || 'quiet']

  return <Pill tone={t}>{l}</Pill>
}
// the parsing status of an invoice sent to Antz AI (Sourav, 2 Nov): Reading (grey, with a light sweep moving across it),
// Read (green), Needs check (amber), Failed (red); the robot icon on each, the reason on hover
export const PARSE = { Reading: 'quiet', Read: 'ok', 'Needs check': 'check', Failed: 'bad' }
export const ParsePill = ({ state, title }) => (
  <Pill tone={PARSE[state]} icon='mdi:robot-outline' title={title}
    sx={state === 'Reading' ? {
      backgroundImage: 'linear-gradient(100deg, rgba(0,0,0,0.05) 30%, rgba(255,255,255,0.85) 50%, rgba(0,0,0,0.05) 70%)',
      backgroundSize: '250% 100%', animation: 'parseSweep 1.6s ease-in-out infinite',
      '@keyframes parseSweep': { '0%': { backgroundPosition: '100% 0' }, '100%': { backgroundPosition: '-150% 0' } },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
    } : undefined}>{state}</Pill>
)
export const Pill = ({ tone = 'quiet', icon, children, sx, title }) => (
  <Box component='span' title={title} sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: 24, px: '10px', borderRadius: '12px', ...T.subTitle, whiteSpace: 'nowrap', ...TONES[tone], ...sx }}>
    {icon && <I i={icon} s={14} />}{children}
  </Box>
)

// the list table: the compliance build's EnclosedDataGrid (compliance-lite animal-exchanges/_table.tsx, the module's
// canonical table): MUI X DataGrid with its own border off, a rounded 8px OutlineVariant border round header+rows,
// tableHeaderBg header with 12/600 titles, 16px cell padding, Surface row hover. Bill Desk's column shape is kept:
// cols [{ key, label, align, width, minWidth, flex, nowrap, render(row) }]; sel/onSel add tick boxes, canSel says
// which rows may be ticked; rows grow to their content, 64px at least (52 when dense). Lists paginate as the
// compliance build's do (25 a page by Sourav's call, 10 / 25 / 50, the footer below the border); paginate={false} for inner tables.
const enclosedSx = {
  '&&': { border: 'none' },
  '& .MuiDataGrid-main': { border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`, borderRadius: '8px' },
  '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
  '& .MuiDataGrid-columnHeader': { backgroundColor: 'customColors.tableHeaderBg', px: 4 },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: 12 },
  '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', px: 4 },
  // the tick-box column is 50px: the 16px padding above clipped its header box, so it sits centred, unpadded
  '& .MuiDataGrid-columnHeaderCheckbox, & .MuiDataGrid-cellCheckbox': { px: 0, justifyContent: 'center' },
  '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer': { justifyContent: 'center', overflow: 'visible' },
  '& .MuiDataGrid-row:hover': { backgroundColor: 'customColors.Surface' }
}
export const EnclosedDataGrid = ({ sx, ...props }) => <DataGrid autoHeight disableRowSelectionOnClick {...props} sx={[enclosedSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />

// totalRow ({ [col key]: node }): a last row inside the table's border, on the Background tint, not numbered, not
// clickable, its values under their own columns (2 Nov: the invoice total sat apart from the table)
export const Grid = ({ cols, rows: body, rowKey: keyOf = r => r.id, onRow, sel, onSel, canSel = () => true, empty = 'Nothing here', dense, paginate = true, serial = true, totalRow }) => {
  const TOTAL = '__total-row'
  const rows = totalRow && body.length ? [...body, { [TOTAL]: true }] : body
  const rowKey = r => (r[TOTAL] ? TOTAL : keyOf(r))
  const ticks = !!onSel
  const min = dense ? 52 : 64
  const columns = cols.map(c => ({
    field: c.key, headerName: c.label, sortable: false, align: c.align, headerAlign: c.align,
    ...(c.width ? { width: c.width } : { flex: c.flex || 1, minWidth: c.minWidth || (c.nowrap ? 130 : 150) }),
    renderCell: p => { if (p.row[TOTAL]) return totalRow[c.key] ?? null; const v = c.render ? c.render(p.row) : p.row[c.key]; return c.nowrap ? <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{v}</Box> : v }
  }))
  // SL.NO first, as the Antz codebase's compliance lists (pages/compliance/documents/shipments): the row's place in the
  // whole list, so it keeps counting across pages (Sourav, 2 Nov: "you forgot the serial number")
  const order = new Map(body.map((r, i) => [keyOf(r), i + 1]))
  if (serial) columns.unshift({ field: '__sl', headerName: 'SL.NO', sortable: false, width: 72, // compact (2 Nov)
    renderCell: p => <Typography sx={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...T.body, color: INK }}>{p.row[TOTAL] ? '' : order.get(keyOf(p.row))}</Typography> })
  const model = ticks ? { type: 'include', ids: new Set(sel) } : undefined

  return (
    <EnclosedDataGrid columns={columns} rows={rows} getRowId={rowKey} disableColumnMenu getRowHeight={() => 'auto'}
      hideFooter={!paginate} hideFooterSelectedRowCount pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      localeText={{ noRowsLabel: empty }} onRowClick={onRow ? p => { if (!p.row[TOTAL]) onRow(p.row) } : undefined}
      getRowClassName={p => (p.row[TOTAL] ? 'bd-total-row' : '')}
      checkboxSelection={ticks} rowSelectionModel={model} isRowSelectable={ticks ? p => !p.row[TOTAL] && canSel(p.row) : undefined}
      onRowSelectionModelChange={ticks ? m => onSel(m.type === 'exclude' ? rows.filter(r => canSel(r) && !m.ids.has(rowKey(r))).map(rowKey) : [...m.ids]) : undefined}
      sx={{ '& .MuiDataGrid-cell': { py: '10px', minHeight: min, ...T.body, color: INK }, '& .MuiDataGrid-row': { minHeight: `${min}px !important`, cursor: onRow ? 'pointer' : 'default' },
        '& .MuiDataGrid-row.bd-total-row, & .MuiDataGrid-row.bd-total-row:hover': { backgroundColor: 'customColors.Background', cursor: 'default' },
        '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover': { backgroundColor: 'customColors.Surface' }, '& .MuiDataGrid-overlay': { color: C.quiet, minHeight: 120 },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' } }} />
  )
}

// the signed-DC stamp, as Naveen's Diet & Kitchen build draws it on Goods Received (InvKit, "Signed & sealed DC
// received"): two green rings, SIGNED / Sealed / DELIVERED, tilted 8 degrees. The cell shows it, or "Missing" in red.
export const Stamp = ({ size = 40, title = 'Signed & sealed DC received' }) => (
  <Tooltip title={title}>
    <Box component='svg' viewBox='0 0 100 100' sx={{ width: size, height: size, transform: 'rotate(-8deg)', flexShrink: 0, display: 'block' }}>
      <circle cx='50' cy='50' r='45' fill='none' stroke='#188554' strokeWidth='4' />
      <circle cx='50' cy='50' r='37' fill='none' stroke='#188554' strokeWidth='1.5' />
      <text x='50' y='34' textAnchor='middle' fontSize='10' fontWeight='700' fill='#188554'>· SIGNED ·</text>
      <text x='50' y='56' textAnchor='middle' fontSize='15' fontWeight='700' fill='#188554'>Sealed</text>
      <text x='50' y='74' textAnchor='middle' fontSize='9' fontWeight='700' fill='#188554'>· DELIVERED ·</text>
    </Box>
  </Tooltip>
)
export const SignedDc = ({ signed }) => signed ? <Box component='span' sx={{ display: 'inline-flex' }}><Stamp size={34} title='Signed & sealed DC received.' /></Box> : <Typography variant='body2' sx={{ color: 'error.main' }}>Missing</Typography>

// a person with a date, as the Compliance lists' Created by / Updated by cells (UserAvatarDetails)
// Bill Desk keeps local timestamps; the Antz formatter expects UTC, so the time is converted before it goes in
export const Person = ({ name, at, time = true }) => name ? <UserAvatarDetails user_name={name} date={at ? new Date(at).toISOString() : ''} show_time={time} /> : <Txt c={C.quiet}>—</Txt>

// sticky bar at the bottom while something is ticked
// the selection action bar, as the Antz codebase's own (components/hospital/ActionButtonsWithSelection.js): white,
// docked to the bottom from the sidebar's edge to the right, 6px top corners, an upward shadow; what is ticked on the
// left (count, then its total), CLEAR outlined and the actions filled on the right (Sourav, 3 Nov: "make it beter" on
// the old dark floating strip)
export const SelBar = ({ count, label, sub, children, onClear }) => {
  const { settings } = useSettings()
  if (!count) return null

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: { xs: 0, lg: settings?.navCollapsed ? 68 : 260 }, right: 0, zIndex: 100, bgcolor: C.white, borderRadius: '6px 6px 0 0', boxShadow: '0 -4px 6px rgba(0,0,0,0.1)', px: 6, py: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 500, color: C.black }}>{label || `${count} selected`}</Typography>
        {sub && <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary' }}>{sub}</Typography>}
      </Box>
      {onClear && <Btn kind='outline' onClick={onClear}>Clear</Btn>}
      {children}
    </Box>
  )
}

export const Field = ({ label, value, onChange, type = 'text', placeholder, bad, hint, multiline, readOnly, sx, inputSx }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', ...sx }}>
    {label && <Txt t='subTitle' c={C.text}>{label}</Txt>}
    <InputBase value={value ?? ''} onChange={e => onChange?.(e.target.value)} type={type} placeholder={placeholder} multiline={multiline} minRows={multiline ? 3 : undefined} readOnly={readOnly}
      sx={{ ...T.body, minHeight: 44, px: '12px', py: multiline ? '10px' : 0, borderRadius: '8px', bgcolor: readOnly ? C.panel : C.white, border: `1px solid ${bad ? C.error : C.line}`, '& input': { ...(type === 'number' && { textAlign: 'right' }) }, ...inputSx }} />
    {hint && <Txt t='sub' c={bad ? C.error : C.quiet}>{hint}</Txt>}
  </Box>
)

// asks for a reason (or a set of fields) before an action, in the Helpdesk reason dialog's anatomy
// (procurement/helpdesk-only shared/ui.js uiReasonOverlay, tablet styles css-p.css; Sourav, 2 Nov: "For these modals
// refer the helpdesk cancel/reject modal ui"): 440px, white, 16px corners; a 20/500 title with a round ✕; a muted line;
// the reason box tinted by tone (danger: Error, warn: Tertiary, otherwise neutral Surface); an error line "Add a reason
// to continue." when a required reason is empty; CANCEL (outlined) and the action (filled) side by side, equal widths,
// 48px. Other fields (a reference, a date) are the plain outlined fields.
const REASON_TONE = {
  danger: { bg: 'rgba(233, 51, 83, .1)', border: C.error, text: '#4A0415', btn: 'danger' },
  warn: { bg: 'rgba(250, 97, 64, .1)', border: C.tert, text: '#250E01', btn: 'warn' },
  primary: { bg: '#F2FFF8', border: C.line, text: C.text, btn: 'pri' }
}
export const AskDialog = ({ open, title, sub, fields = [{ key: 'note', label: 'Note', multiline: true }], confirm = 'Confirm', tone = 'primary', onClose, onConfirm }) => {
  const [v, setV] = useState({})
  const [need, setNeed] = useState(false)
  useEffect(() => { if (open) { setV({}); setNeed(false) } }, [open])
  if (!open) return null
  const t = REASON_TONE[tone] || REASON_TONE.primary
  // a multiline field is the reason; it is required unless its label says optional
  const required = f => f.multiline && !/optional/i.test(f.label || '')
  const values = () => Object.fromEntries(fields.map(f => [f.key, v[f.key] ?? f.initial ?? '']))
  const submit = () => {
    if (fields.some(f => required(f) && !String(values()[f.key]).trim())) { setNeed(true); return }
    onConfirm(values())
  }

  return (
    <Dialog open onClose={onClose} slotProps={{ paper: { sx: { borderRadius: '16px', width: 440, maxWidth: 'calc(100% - 48px)', m: 0, boxShadow: '0 12px 40px rgba(0, 0, 0, .18)' } } }}>
      <Box sx={{ p: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{title}</Typography>
            <Box component='button' type='button' aria-label='Close' onClick={onClose}
              sx={{ width: 44, height: 44, flex: 'none', display: 'grid', placeItems: 'center', m: '-10px -12px -10px 0', border: 0, borderRadius: '50%', background: 'none', cursor: 'pointer', color: 'customColors.OnSurfaceVariant', '&:hover': { backgroundColor: C.n05 } }}>
              <I i='mdi:close' s={22} />
            </Box>
          </Box>
          {sub && <Typography sx={{ mt: '-4px', fontSize: 14, lineHeight: '20px', color: 'customColors.neutralSecondary' }}>{sub}</Typography>}
          {fields.map(({ key: k, initial, multiline, label, placeholder, ...f }) => (multiline
            ? (
              <Box key={k} sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {label && fields.length > 1 && <Txt t='subTitle' c={C.text}>{label}</Txt>}
                <Box component='textarea' autoFocus value={v[k] ?? initial ?? ''} placeholder={placeholder || (required({ multiline, label }) ? `Enter ${String(label || 'reason').toLowerCase().replace(/^why it goes back$/, 'reason')}` : 'Add a note (optional)')}
                  onChange={e => { setV(o => ({ ...o, [k]: e.target.value })); setNeed(false) }}
                  sx={{ width: '100%', minHeight: 120, p: '12px', fontFamily: 'inherit', fontSize: 16, lineHeight: '24px', borderRadius: '8px', resize: 'vertical', boxShadow: '0 1px 12px rgba(0, 0, 0, .03)',
                    backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text, '&::placeholder': { color: 'inherit', opacity: 0.8 }, '&:focus': { outline: 'none', borderWidth: '2px', p: '11px' } }} />
              </Box>
            )
            : <Field key={k} {...f} label={label} placeholder={placeholder} value={v[k] ?? initial ?? ''} onChange={x => setV(o => ({ ...o, [k]: x }))} />))}
          {need && <Typography role='alert' sx={{ m: 0, px: '12px', py: '8px', borderRadius: '8px', backgroundColor: 'rgba(233, 51, 83, .08)', fontSize: 14, color: C.error }}>Add a reason to continue.</Typography>}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', '& > *': { width: '100%', minWidth: 0, height: '48px !important', fontSize: '14px !important', fontWeight: 500, letterSpacing: '.4px', textTransform: 'uppercase' } }}>
          <Btn kind='outline' onClick={onClose} sx={{ flex: '1 1 0', minWidth: 0 }}>Cancel</Btn>
          <Btn kind={t.btn === 'warn' ? 'pri' : t.btn} onClick={submit} sx={{ flex: '1 1 0', minWidth: 0, ...(t.btn === 'warn' && { bgcolor: `${C.tert} !important`, '&:hover': { bgcolor: `${C.tert} !important` } }) }}>{confirm}</Btn>
        </Box>
      </Box>
    </Dialog>
  )
}

// run a flow action; show its refusal as a toast instead of throwing. Returns the action's result (true when it
// returns nothing), or false when it was refused.
export const tryRun = (toast, fn, ok) => {
  try {
    const out = fn()
    if (ok) toast.success(typeof ok === 'function' ? ok(out) : ok)

    return out === undefined ? true : out
  } catch (e) {
    toast.error(e.message)

    return false
  }
}
