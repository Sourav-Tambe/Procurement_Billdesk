// DATA EXPLORER for Finance (Sourav, 2 Nov: "in our compliance we had something called as a data explorer, so i
// need one for Finance team"; "Straight to build"). Ported from the Antz codebase's compliance Data Explorer
// (components/animal-exchanges/DataExplorerView.tsx): one table card with the Rows / Columns / Measure builder
// strip, Save as preset, the density toggle and Export on its toolbar; an Excel-grade pivot table (gridlines,
// sticky header and first column, click-to-select with the row and column crosshair, arrow keys, Esc); presets as
// tiles below; a row label opens the drill-down sheet. Over Finance's data: one record per invoice line. Changes
// from compliance: a date range on the toolbar (the engine's from/to filter, wired up because Finance works by
// period), Excel in place of CSV, and saved presets kept in this browser (localStorage) in place of the database.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Menu, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { useBillDesk } from '../store'
import { I } from '../ui/ui'
import { Page } from '../ui/parts'
import { recordsOf, computePivot, sortPivotRows, fmtMeasure, fmtDimKey, exportPivotExcel, TEMPLATES, DIMS, COL_DIMS, MEASURES, MEASURE_LABEL } from './pivotEngine'
import RowDrillSheet from './RowDrillSheet'

const PRESET_KEY = 'billdesk.v1.explorer.presets'
const readPresets = () => { try { return JSON.parse(window.localStorage.getItem(PRESET_KEY) || '[]') } catch { return [] } }
const writePresets = list => { try { window.localStorage.setItem(PRESET_KEY, JSON.stringify(list)) } catch {} }
const DEFAULT_CONFIG = TEMPLATES['spend-vendor-month'].config
const dimSubline = cfg => {
  const row = DIMS.find(d => d.key === cfg.rowDim)?.label ?? cfg.rowDim
  const col = cfg.colDim === 'none' ? null : COL_DIMS.find(d => d.key === cfg.colDim)?.label ?? cfg.colDim

  return col ? `${row} × ${col} · ${MEASURE_LABEL[cfg.measure]}` : `${row} · ${MEASURE_LABEL[cfg.measure]}`
}
// presets compare on rows, columns and measure; the date range is a view setting, not part of a preset
const sameShape = (a, b) => a.rowDim === b.rowDim && a.colDim === b.colDim && a.measure === b.measure

// Rows / Columns / Measure: a small uppercase label above a large value, short dividers between (compliance BuilderSelect)
const BuilderSelect = ({ label, value, onChange, options, minWidth = 140, isLast = false }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.25, position: 'relative', px: 3, py: 1.25, minWidth,
    '&::after': isLast ? {} : { content: '""', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '1px', height: 22, backgroundColor: 'customColors.OutlineVariant' },
    '&:focus-within': { outline: theme => `2px solid ${theme.palette.primary.main}`, outlineOffset: '-2px' } }}>
    <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'customColors.Outline', lineHeight: 1, whiteSpace: 'nowrap', userSelect: 'none' }}>{label}</Typography>
    <TextField select size='small' value={value} onChange={e => onChange(e.target.value)} variant='standard'
      sx={{ '& .MuiInput-root': { fontSize: 15, fontWeight: 600, color: 'customColors.OnSurfaceVariant', '&:before': { display: 'none' }, '&:after': { display: 'none' },
        '& .MuiSelect-select': { py: 0, pr: '22px !important', pl: 0, display: 'flex', alignItems: 'center', height: '100%', minHeight: 'unset' }, '& .MuiSelect-icon': { color: 'customColors.Outline', right: 0 } } }}>
      {options.map(o => <MenuItem key={o.key} value={o.key} sx={{ fontSize: 14 }}>{o.label}</MenuItem>)}
    </TextField>
  </Box>
)
const quietDivider = <Box sx={{ width: '1px', height: 22, alignSelf: 'center', backgroundColor: 'customColors.OutlineVariant', flexShrink: 0 }} />

const DataExplorer = () => {
  const s = useBillDesk()
  const records = useMemo(() => recordsOf(s), [s])
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(false)
  const [density, setDensity] = useState('regular')
  const [selectedCell, setSelectedCell] = useState(null)
  const [drill, setDrill] = useState(null)
  const [saved, setSaved] = useState([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [renameTarget, setRenameTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const wrapRef = useRef(null)
  useEffect(() => setSaved(readPresets()), [])
  const keep = list => { setSaved(list); writePresets(list) }

  const iso = d => (d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '')
  const filters = { from: iso(dates.startDate), to: iso(dates.endDate) }
  const full = { ...config, filters }
  const pivot = useMemo(() => computePivot(records, full), [records, config, dates]) // eslint-disable-line react-hooks/exhaustive-deps
  const rowKeysDisplay = useMemo(() => { const k = sortPivotRows(pivot, sortCol ?? '__rowtotal', sortAsc ? 'asc' : 'desc'); return pivot.capped ? k.slice(0, 50) : k }, [pivot, sortCol, sortAsc])
  const allColKeys = useMemo(() => [...pivot.colKeys, '__rowtotal'], [pivot.colKeys])
  const setDim = (k, v) => { setConfig(c => ({ ...c, [k]: v })); setSortCol(null); setSelectedCell(null) }
  const onSort = col => { if (sortCol === col) setSortAsc(a => !a); else { setSortCol(col); setSortAsc(false) } }

  // arrow keys move the selected cell; Esc clears it (only while a cell is selected)
  const onKeyDown = useCallback(e => {
    if (!selectedCell) return
    const ri = rowKeysDisplay.indexOf(selectedCell.row), ci = allColKeys.indexOf(selectedCell.col)
    if (ri === -1 || ci === -1) return
    const move = (dr, dc) => { setSelectedCell({ row: rowKeysDisplay[Math.max(0, Math.min(rowKeysDisplay.length - 1, ri + dr))], col: allColKeys[Math.max(0, Math.min(allColKeys.length - 1, ci + dc))] }); e.preventDefault() }
    if (e.key === 'ArrowUp') move(-1, 0)
    else if (e.key === 'ArrowDown') move(1, 0)
    else if (e.key === 'ArrowLeft') move(0, -1)
    else if (e.key === 'ArrowRight') move(0, 1)
    else if (e.key === 'Escape') setSelectedCell(null)
  }, [selectedCell, rowKeysDisplay, allColKeys])
  useEffect(() => {
    if (!selectedCell || !wrapRef.current) return
    const cell = wrapRef.current.querySelector(`tr[data-row="${CSS.escape(selectedCell.row)}"] td[data-col="${CSS.escape(selectedCell.col)}"]`)
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [selectedCell])

  const templateKeys = Object.keys(TEMPLATES)
  const activeTemplate = templateKeys.find(k => sameShape(config, TEMPLATES[k].config)) ?? null
  const activeSaved = saved.find(p => sameShape(config, p.config))?.id ?? null
  const isCustomUnsaved = !activeTemplate && !activeSaved
  const py = density === 'condensed' ? 2.5 : density === 'relaxed' ? 4.5 : 3.75
  const cellSx = { px: 3, py, verticalAlign: 'middle', textAlign: 'left', borderRight: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }
  const numSx = { ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
  const headSx = { position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'customColors.tableHeaderBg', boxShadow: theme => `inset 0 -2px 0 ${theme.palette.customColors.OutlineVariant}` }
  const colLabel = ck => (config.colDim === 'none' ? MEASURE_LABEL[config.measure] : fmtDimKey(config.colDim, ck))
  const tileSx = active => ({ px: 4, py: 3, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', minWidth: 160, backgroundColor: 'background.paper',
    border: theme => `1px solid ${active ? theme.palette.primary.main : theme.palette.customColors.SurfaceVariant}`, outline: theme => (active ? `1px solid ${theme.palette.primary.main}` : 'none'), outlineOffset: '-1px',
    '&:hover': { borderColor: active ? 'primary.main' : 'customColors.Outline' } })
  const pick = cfg => { setConfig(cfg); setSortCol(null); setSelectedCell(null) }
  const cellClick = (rk, ck) => setSelectedCell(p => (p?.row === rk && p?.col === ck ? null : { row: rk, col: ck }))

  return (
    <Page crumb={['Bill Desk', 'Data Explorer']} title='Data Explorer' contained={false}>
      <Card sx={{ p: 6 }}>
        {/* one toolbar: the builder strip and Save as preset on the left; date range, density and Export on the right */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'stretch', minHeight: 48, borderRadius: '4px', backgroundColor: 'background.paper', overflow: 'hidden' }}>
            <BuilderSelect label='Rows' value={config.rowDim} onChange={v => setDim('rowDim', v)} options={DIMS} minWidth={130} />
            <BuilderSelect label='Columns' value={config.colDim} onChange={v => setDim('colDim', v)} options={COL_DIMS} minWidth={160} />
            <BuilderSelect label='Measure' value={config.measure} onChange={v => setDim('measure', v)} options={MEASURES} minWidth={170} isLast />
          </Box>
          {isCustomUnsaved && (
            <Box component='button' onClick={() => { setPresetName(dimSubline(config)); setSaveOpen(true) }}
              sx={{ background: 'none', border: 0, cursor: 'pointer', color: 'customColors.OnSurfaceVariant', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, px: 2, height: 37, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', '&:hover': { color: 'primary.main' } }}>
              Save as preset
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto', flexWrap: 'wrap' }}>
            <Box><CommonDateRangePickers filterDates={dates} onChange={(a, b) => setDates({ startDate: a, endDate: b })} /></Box>
            {quietDivider}
            <ToggleButtonGroup value={density} exclusive onChange={(_e, v) => v && setDensity(v)}
              sx={{ height: 37, '& .MuiToggleButtonGroup-grouped': { border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`, '&:first-of-type': { borderRadius: '4px 0 0 4px' }, '&:last-of-type': { borderRadius: '0 4px 4px 0' } },
                '& .MuiToggleButton-root': { px: '9px', py: 0, height: 37, minWidth: 37, color: 'customColors.neutralSecondary', '&:hover': { backgroundColor: 'customColors.Surface', color: 'customColors.OnSurfaceVariant' },
                  '&.Mui-selected': { backgroundColor: 'customColors.OnPrimaryContainer', color: 'common.white', '&:hover': { backgroundColor: 'customColors.OnPrimaryContainer' } } } }}>
              {[['condensed', 'Condensed', 'mdi:view-headline'], ['regular', 'Regular', 'mdi:view-sequential'], ['relaxed', 'Relaxed', 'mdi:view-stream']].map(([v, t, ic]) => (
                <Tooltip key={v} title={t} placement='top'><ToggleButton value={v} aria-label={t}><I i={ic} s={20} /></ToggleButton></Tooltip>
              ))}
            </ToggleButtonGroup>
            {quietDivider}
            <Tooltip title='Export this table to Excel' placement='top'>
              <Box component='button' onClick={() => exportPivotExcel(pivot, config, rowKeysDisplay)}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, height: 37, px: 3, borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  border: theme => `1px solid ${theme.palette.primary.main}`, backgroundColor: 'background.paper', color: 'primary.main', '&:hover': { backgroundColor: 'customColors.Surface' } }}>
                <I i='mdi:download-outline' s={18} />Export
              </Box>
            </Tooltip>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'customColors.SurfaceVariant', mx: -6, mt: 4 }} />

        {!records.length ? (
          <Typography variant='body2' sx={{ textAlign: 'center', py: 12, color: 'customColors.neutralSecondary' }}>No invoices to explore yet.</Typography>
        ) : (
          <Box>
            <Box ref={wrapRef} tabIndex={0} onKeyDown={onKeyDown} onClick={e => { if (e.target === e.currentTarget) setSelectedCell(null) }}
              sx={theme => ({ overflowX: 'auto', mt: 4, outline: 'none', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto',
                '& tbody tr[data-selected="1"] > td': { backgroundColor: theme.palette.customColors.Surface },
                '& tbody td[data-selected-col="1"]': { backgroundColor: `${theme.palette.customColors.Surface} !important` },
                '& tbody td[data-sel="1"]': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: '-2px', backgroundColor: `${theme.palette.customColors.Surface} !important`, position: 'relative', zIndex: 0 } })}>
              <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <Box component='thead'>
                  <Box component='tr'>
                    <Box component='th' sx={{ ...cellSx, ...headSx, left: 0, zIndex: 3, boxShadow: theme => `inset -1px 0 0 ${theme.palette.customColors.SurfaceVariant}, inset 0 -2px 0 ${theme.palette.customColors.OutlineVariant}` }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'customColors.OnSurfaceVariant' }}>{DIMS.find(d => d.key === config.rowDim)?.label}</Typography>
                    </Box>
                    {pivot.colKeys.map(ck => (
                      <Box component='th' key={ck} onClick={() => onSort(ck)} sx={{ ...numSx, ...headSx, cursor: 'pointer' }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>{colLabel(ck)}{sortCol === ck ? (sortAsc ? ' ↑' : ' ↓') : ''}</Typography>
                      </Box>
                    ))}
                    <Box component='th' onClick={() => onSort('__rowtotal')} sx={{ ...numSx, ...headSx, cursor: 'pointer' }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'customColors.OnSurfaceVariant' }}>Total{sortCol === '__rowtotal' ? (sortAsc ? ' ↑' : ' ↓') : ''}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box component='tbody'>
                  {rowKeysDisplay.map(rk => {
                    const selRow = selectedCell?.row === rk

                    return (
                      <Box component='tr' key={rk} data-row={rk} data-selected={selRow ? '1' : undefined} sx={{ borderBottom: theme => `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                        {/* the row label opens the drill-down sheet; data cells select */}
                        <Box component='td' data-col='__rowlabel' onClick={() => setDrill({ rowKey: rk })}
                          sx={{ ...cellSx, position: 'sticky', left: 0, zIndex: 1, cursor: 'pointer', backgroundColor: selRow ? 'customColors.Surface' : 'background.paper', boxShadow: theme => `inset -1px 0 0 ${theme.palette.customColors.SurfaceVariant}`,
                            '&:hover': { backgroundColor: 'customColors.Surface', '& .drill-hint': { opacity: 1 } } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant='body2' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>{fmtDimKey(config.rowDim, rk)}</Typography>
                            <Box className='drill-hint' sx={{ opacity: 0, transition: 'opacity 150ms', color: 'customColors.Outline', display: 'flex' }}><I i='mdi:chevron-right' s={14} /></Box>
                          </Box>
                        </Box>
                        {pivot.colKeys.map(ck => {
                          const v = pivot.cells[`${rk}|${ck}`]

                          return (
                            <Box component='td' key={ck} data-col={ck} data-selected-col={!selRow && selectedCell?.col === ck ? '1' : undefined} data-sel={selRow && selectedCell?.col === ck ? '1' : undefined}
                              onClick={() => cellClick(rk, ck)} sx={{ ...numSx, cursor: 'cell' }}>
                              <Typography variant='body2' sx={{ color: v == null ? 'customColors.OutlineVariant' : 'customColors.OnSurfaceVariant' }}>{fmtMeasure(v, config.measure)}</Typography>
                            </Box>
                          )
                        })}
                        <Box component='td' data-col='__rowtotal' data-selected-col={!selRow && selectedCell?.col === '__rowtotal' ? '1' : undefined} data-sel={selRow && selectedCell?.col === '__rowtotal' ? '1' : undefined}
                          onClick={() => cellClick(rk, '__rowtotal')} sx={{ ...numSx, cursor: 'cell' }}>
                          <Typography variant='body2' sx={{ fontWeight: 700, color: 'customColors.OnSurfaceVariant' }}>{fmtMeasure(pivot.rowTotals[rk], config.measure)}</Typography>
                        </Box>
                      </Box>
                    )
                  })}
                  <Box component='tr' sx={{ backgroundColor: 'customColors.Background' }}>
                    <Box component='td' sx={{ ...cellSx, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'customColors.Background', boxShadow: theme => `inset -1px 0 0 ${theme.palette.customColors.SurfaceVariant}` }}>
                      <Typography variant='body2' sx={{ fontWeight: 700, color: 'customColors.OnSurfaceVariant' }}>Total</Typography>
                    </Box>
                    {pivot.colKeys.map(ck => <Box component='td' key={ck} sx={numSx}><Typography variant='body2' sx={{ fontWeight: 700, color: 'customColors.OnSurfaceVariant' }}>{fmtMeasure(pivot.colTotals[ck], config.measure)}</Typography></Box>)}
                    <Box component='td' sx={numSx}><Typography variant='body2' sx={{ fontWeight: 700, color: 'customColors.OnSurfaceVariant' }}>{fmtMeasure(pivot.grandTotal, config.measure)}</Typography></Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            {pivot.capped && <Typography variant='caption' sx={{ display: 'block', pt: 2, color: 'customColors.neutralSecondary' }}>{`Top 50 of ${pivot.totalRowCount} rows — narrow the date range to see more`}</Typography>}
          </Box>
        )}
      </Card>

      {/* presets below the table */}
      <Box>
        <Typography variant='caption' sx={{ display: 'block', mt: 2, mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'customColors.neutralSecondary' }}>Presets</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {templateKeys.map(k => {
            const on = activeTemplate === k

            return (
              <Box key={k} component='button' onClick={() => pick(TEMPLATES[k].config)} sx={tileSx(on)}>
                <Typography variant='body2' sx={{ fontWeight: on ? 600 : 500, color: on ? 'primary.main' : 'customColors.OnSurfaceVariant', display: 'block', mb: 0.5 }}>{TEMPLATES[k].label}</Typography>
                <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', display: 'block' }}>{dimSubline(TEMPLATES[k].config)}</Typography>
              </Box>
            )
          })}
          {saved.map(p => {
            const on = activeSaved === p.id

            return (
              <Box key={p.id} component='button' onClick={() => pick(p.config)} sx={{ ...tileSx(on), position: 'relative', pr: 8 }}>
                <Typography variant='body2' sx={{ fontWeight: on ? 600 : 500, color: on ? 'primary.main' : 'customColors.OnSurfaceVariant', display: 'block', mb: 0.5 }}>{p.name}</Typography>
                <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', display: 'block' }}>{dimSubline(p.config)}</Typography>
                <IconButton size='small' aria-label='Preset actions' onClick={e => { e.stopPropagation(); setMenuAnchor({ el: e.currentTarget, id: p.id }) }}
                  sx={{ position: 'absolute', top: 4, right: 4, color: 'customColors.neutralSecondary', '&:hover': { color: 'customColors.OnSurfaceVariant', backgroundColor: 'customColors.Surface' } }}>
                  <I i='mdi:dots-vertical' s={18} />
                </IconButton>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Menu anchorEl={menuAnchor?.el ?? null} open={!!menuAnchor} onClose={() => setMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem sx={{ fontSize: 14, color: 'customColors.OnSurfaceVariant' }} onClick={() => { const p = saved.find(x => x.id === menuAnchor?.id); if (p) setRenameTarget({ id: p.id, name: p.name }); setMenuAnchor(null) }}>Rename</MenuItem>
        <MenuItem sx={{ fontSize: 14, color: 'customColors.Tertiary' }} onClick={() => { const p = saved.find(x => x.id === menuAnchor?.id); setMenuAnchor(null); if (p) setConfirmDelete({ id: p.id, name: p.name }) }}>Delete</MenuItem>
      </Menu>
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
        <DialogTitle sx={{ fontWeight: 600, p: 6, pb: 3 }}>Delete preset?</DialogTitle>
        <DialogContent sx={{ px: 6, pt: 0, pb: 6 }}><Typography variant='body2' sx={{ color: 'customColors.OnSurfaceVariant' }}>Remove <Box component='strong' sx={{ fontWeight: 600 }}>{confirmDelete?.name}</Box>? This preset will be deleted.</Typography></DialogContent>
        <DialogActions sx={{ px: 6, pt: 0, pb: 6, gap: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ color: 'customColors.neutralSecondary' }}>Cancel</Button>
          <Button color='error' variant='contained' onClick={() => { keep(saved.filter(p => p.id !== confirmDelete.id)); setConfirmDelete(null); toast.success('Preset removed') }}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} PaperProps={{ sx: { borderRadius: '10px', minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 600, p: 6, pb: 3 }}>Save as preset</DialogTitle>
        <DialogContent sx={{ px: 6, pt: 0, pb: 6, overflow: 'visible' }}>
          <TextField autoFocus fullWidth size='small' label='Preset name' value={presetName} onChange={e => setPresetName(e.target.value)} sx={{ mt: 1, '& .MuiOutlinedInput-root': { height: 56 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 6, pt: 0, pb: 6, gap: 2 }}>
          <Button onClick={() => setSaveOpen(false)} sx={{ color: 'customColors.neutralSecondary' }}>Cancel</Button>
          <Button variant='contained' disabled={!presetName.trim()} onClick={() => { keep([...saved, { id: `p-${Date.now().toString(36)}`, name: presetName.trim(), config }]); setSaveOpen(false); toast.success('Preset saved') }}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} PaperProps={{ sx: { borderRadius: '10px', minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 600, p: 6, pb: 3 }}>Rename preset</DialogTitle>
        <DialogContent sx={{ px: 6, pt: 0, pb: 6, overflow: 'visible' }}>
          <TextField autoFocus fullWidth size='small' label='Preset name' value={renameTarget?.name ?? ''} onChange={e => setRenameTarget(t => (t ? { ...t, name: e.target.value } : t))} sx={{ mt: 1, '& .MuiOutlinedInput-root': { height: 56 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 6, pt: 0, pb: 6, gap: 2 }}>
          <Button onClick={() => setRenameTarget(null)} sx={{ color: 'customColors.neutralSecondary' }}>Cancel</Button>
          <Button variant='contained' disabled={!renameTarget?.name.trim()} onClick={() => { keep(saved.map(p => (p.id === renameTarget.id ? { ...p, name: renameTarget.name.trim() } : p))); setRenameTarget(null); toast.success('Preset renamed') }}>Save</Button>
        </DialogActions>
      </Dialog>

      <RowDrillSheet open={!!drill} onClose={() => setDrill(null)} records={records} rowDim={config.rowDim} rowKey={drill?.rowKey ?? ''} measure={config.measure} filters={filters} />
    </Page>
  )
}

export default DataExplorer
