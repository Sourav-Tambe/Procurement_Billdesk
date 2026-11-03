// PIVOT ENGINE for Finance's Data Explorer (Sourav, 2 Nov: "in our compliance we had something called as a data
// explorer, so i need one for Finance team"). Ported from the Antz codebase's compliance explorer
// (components/animal-exchanges/explorer/pivotEngine.ts): pure client-side cross-tab over flat records, Rows ×
// Columns × Measure → cells with row / column / grand totals, a 50-row cap, presets, and export. Empty combinations
// are null (shown '—', exported blank). The records are invoice lines (recordsOf), not exchange files.
import { computedOf, lineCalc, r2, inr, stageLabel } from '../logic'
import { vendorOf, itemOf, whOf } from '../store'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// one flat record per invoice line: the dimensions as strings, the numbers to measure
export const recordsOf = s => s.invoices.filter(i => i.vendorId && (i.lines || []).length).flatMap(inv => {
  const area = [...new Set(inv.dcNumbers.map(dc => whOf(s, s.dcsBy[dc]?.warehouseId)))].join(', ') || '—'
  const batch = (inv.approvalIds || []).at(-1) || 'Not in a batch'

  return inv.lines.map(l => {
    const c = lineCalc(l)

    return {
      invoiceId: inv.id, invoiceNo: inv.invoiceNo, invoiceDate: inv.invoiceDate,
      vendor: vendorOf(s, inv.vendorId)?.name || inv.vendorId,
      month: String(inv.invoiceDate || '').slice(0, 7), year: String(inv.invoiceDate || '').slice(0, 4),
      item: itemOf(s, l.itemId)?.name || l.itemId,
      area, stage: stageLabel(inv.status),
      match: inv.match === 'discrepancy' ? 'With discrepancies' : 'Matched', batch,
      taxable: c.taxable, gst: c.gst, value: r2(c.taxable + c.gst),
      mismatch: Number(l.billedQty) !== Number(l.receivedQty) ? 1 : 0
    }
  })
})

export const DIMS = [
  { key: 'vendor', label: 'Vendor' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'item', label: 'Item' },
  { key: 'area', label: 'Area' },
  { key: 'stage', label: 'Stage' },
  { key: 'match', label: 'Match' },
  { key: 'batch', label: 'Approval batch' }
]
export const COL_DIMS = [{ key: 'none', label: 'None — single column' }, ...DIMS]
export const MEASURE_LABEL = {
  value: 'Invoice value (₹)',
  taxable: 'Taxable value (₹)',
  gst: 'GST (₹)',
  invoices: 'Count of Invoices',
  lines: 'Count of Lines',
  vendors: 'Count of Vendors',
  mismatch: 'Mismatch lines'
}
export const MEASURES = Object.keys(MEASURE_LABEL).map(k => ({ key: k, label: MEASURE_LABEL[k] }))
const MONEY = new Set(['value', 'taxable', 'gst'])
export const TOTAL_COL = '__total'

// a dimension value as shown: months read "Oct 26"
export const fmtDimKey = (dim, key) => (dim === 'month' && /^\d{4}-\d{2}$/.test(key) ? `${MON[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}` : key)

const applyFilters = (records, f = {}) => records.filter(r => !(f.from && r.invoiceDate < f.from) && !(f.to && r.invoiceDate > f.to))

const measureOf = (subset, measure) => {
  switch (measure) {
    case 'value': return r2(subset.reduce((s, r) => s + r.value, 0))
    case 'taxable': return r2(subset.reduce((s, r) => s + r.taxable, 0))
    case 'gst': return r2(subset.reduce((s, r) => s + r.gst, 0))
    case 'invoices': return new Set(subset.map(r => r.invoiceId)).size
    case 'lines': return subset.length
    case 'vendors': return new Set(subset.map(r => r.vendor)).size
    case 'mismatch': return subset.reduce((s, r) => s + r.mismatch, 0)
    default: return 0
  }
}

const ROW_CAP = 50
export function computePivot(records, config) {
  const data = applyFilters(records, config.filters)
  const val = (r, d) => String(r[d])
  const rowKeysAll = [...new Set(data.map(r => val(r, config.rowDim)))]
  const colKeys = config.colDim === 'none' ? [TOTAL_COL] : [...new Set(data.map(r => val(r, config.colDim)))].sort()
  const cells = {}
  const rowTotals = {}
  for (const rk of rowKeysAll) {
    const rowSubset = data.filter(r => val(r, config.rowDim) === rk)
    rowTotals[rk] = measureOf(rowSubset, config.measure)
    for (const ck of colKeys) {
      const subset = config.colDim === 'none' ? rowSubset : rowSubset.filter(r => val(r, config.colDim) === ck)
      cells[`${rk}|${ck}`] = subset.length ? measureOf(subset, config.measure) : null
    }
  }
  const rowKeysSorted = [...rowKeysAll].sort((a, b) => rowTotals[b] - rowTotals[a])
  const capped = rowKeysSorted.length > ROW_CAP
  const colTotals = {}
  for (const ck of colKeys) colTotals[ck] = measureOf(config.colDim === 'none' ? data : data.filter(r => val(r, config.colDim) === ck), config.measure)

  return { rowKeys: capped ? rowKeysSorted.slice(0, ROW_CAP) : rowKeysSorted, rowKeysAll, colKeys, cells, rowTotals, colTotals, grandTotal: measureOf(data, config.measure), capped, totalRowCount: rowKeysAll.length, data }
}

// sort every row key by a column (or '__rowtotal'); empty cells sort last either way
export function sortPivotRows(pivot, sortKey, dir) {
  const v = rk => (sortKey === '__rowtotal' ? pivot.rowTotals[rk] ?? 0 : pivot.cells[`${rk}|${sortKey}`] ?? -Infinity)

  return [...pivot.rowKeysAll].sort((a, b) => {
    const av = v(a), bv = v(b)
    if (av === -Infinity && bv === -Infinity) return 0
    if (av === -Infinity) return 1
    if (bv === -Infinity) return -1

    return dir === 'asc' ? av - bv : bv - av
  })
}

export const fmtMeasure = (value, measure) => (value == null ? '—' : MONEY.has(measure) ? inr(value) : value.toLocaleString('en-IN'))

const NO_FILTERS = { from: '', to: '' }
export const TEMPLATES = {
  'spend-vendor-month': { label: 'Spend by Vendor', config: { rowDim: 'vendor', colDim: 'month', measure: 'value', filters: NO_FILTERS } },
  'vendor-stage': { label: 'Where each Vendor stands', config: { rowDim: 'vendor', colDim: 'stage', measure: 'value', filters: NO_FILTERS } },
  'stage-month': { label: 'Invoices by Stage', config: { rowDim: 'stage', colDim: 'month', measure: 'invoices', filters: NO_FILTERS } },
  'mismatch-vendor': { label: 'Mismatches by Vendor', config: { rowDim: 'vendor', colDim: 'match', measure: 'mismatch', filters: NO_FILTERS } },
  'item-spend': { label: 'Spend by Item', config: { rowDim: 'item', colDim: 'none', measure: 'value', filters: NO_FILTERS } },
  'gst-month': { label: 'GST by Month', config: { rowDim: 'month', colDim: 'none', measure: 'gst', filters: NO_FILTERS } }
}

// the visible table as an Excel sheet (Finance works in Excel); empty cells blank
export const exportPivotExcel = async (pivot, config, keys) => {
  const XLSX = await import('xlsx')
  const dimLabel = DIMS.find(d => d.key === config.rowDim)?.label || ''
  const colHeader = config.colDim === 'none' ? [MEASURE_LABEL[config.measure]] : pivot.colKeys.map(ck => fmtDimKey(config.colDim, ck))
  const rows = [[dimLabel, ...colHeader, 'Total']]
  for (const rk of keys) rows.push([fmtDimKey(config.rowDim, rk), ...pivot.colKeys.map(ck => pivot.cells[`${rk}|${ck}`] ?? ''), pivot.rowTotals[rk]])
  rows.push(['Total', ...pivot.colKeys.map(ck => pivot.colTotals[ck]), pivot.grandTotal])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Data Explorer')
  XLSX.writeFile(wb, `finance-data-explorer-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// the records behind one row, for the drill-down sheet
export const filterRecordsForRow = (records, rowDim, rowKey) => records.filter(r => String(r[rowDim]) === rowKey)
export { computedOf }
