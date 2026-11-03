// Finance's Excel (BD-5): the Deal Slip Summary format Finance uses (Sourav, 2 Nov, "Deal Slip Summary-format
// (2026#27)"): one row per invoice line, 26 columns in Finance's order, and a TOTAL row. Every column is one entry in
// DEAL_COLUMNS, so a change to their sheet means editing this list only.
//
// What Bill Desk holds is filled in; what it does not hold stays empty (Sourav, 2 Nov: "what we have prefill, what we
// dont have keep it empty"): Steady State / New Projects, Billing Address, Area, Site, Expense Category, Discount,
// Packing / Transportation and Summary No. SGST and CGST split the GST when the vendor's GSTIN is in the buyer's
// state; otherwise it is IGST.
import { r2 } from './logic'
import { vendorOf, itemOf } from './store'

const BUYER_STATE = '29' // GST state code of the buyer (Karnataka)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dmy = iso => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : '')
const monYY = iso => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]}-${iso.slice(2, 4)}` : '')

// one line's money: basic, net (no discount held, so net = basic), tax split, total
const money = (inv, s, l) => {
  const qty = Number(l.billedQty) || 0, rate = Number(l.rate) || 0, gstPct = Number(l.gstPct) || 0
  const basic = r2(qty * rate)
  const tax = r2(basic * gstPct / 100)
  const intra = String(vendorOf(s, inv.vendorId)?.gstin || BUYER_STATE).slice(0, 2) === BUYER_STATE
  const sgst = intra ? r2(tax / 2) : 0, cgst = intra ? r2(tax - sgst) : 0, igst = intra ? 0 : tax

  return { qty, rate, gstPct, basic, net: basic, sgst, cgst, igst, total: r2(basic + sgst + cgst + igst) }
}

// [header, value(row), summed in TOTAL] in Finance's order; row = { n, k, inv, s, l, m }; '' = not held in Bill Desk
export const DEAL_COLUMNS = [
  ['Sr. No. as per Main List', r => r.n], // running number across the whole sheet
  ['Sr. No. as per Summary', r => r.k], // the line's number within its tax invoice (their =IF(H2=H1,B1+1,1))
  ['Steady State / New Projects', () => ''],
  ['Billing Address', () => ''],
  ['Area', () => ''],
  ['Site', () => ''],
  ['Vendor Name', r => vendorOf(r.s, r.inv.vendorId)?.name || ''],
  ['Tax Invoice No.', r => r.inv.invoiceNo],
  ['Invoice Date', r => dmy(r.inv.invoiceDate)],
  ['Invoice Month (Formula)', r => monYY(r.inv.invoiceDate)],
  ['Invoice Month (Manual)', r => monYY(r.inv.invoiceDate).replace('-', '')],
  ['Description of Item', r => itemOf(r.s, r.l.itemId)?.name || r.l.itemId],
  ['Expense Category', () => ''],
  ['Qty', r => r.m.qty],
  ['Rate (₹)', r => r.m.rate],
  ['Basic Value (₹)', r => r.m.basic, true],
  ['Discount (%age)', () => ''],
  ['Discount (Amount)', () => ''],
  ['Net Basic Value (₹)', r => r.m.net, true],
  ['Packing Charges / Transportation', () => ''],
  ['Total Taxation %age', r => r.m.gstPct],
  ['SGST (₹)', r => r.m.sgst, true],
  ['CGST (₹)', r => r.m.cgst, true],
  ['IGST (₹)', r => r.m.igst, true],
  ['Total Invoice Value (₹)', r => r.m.total, true],
  ['Summary No.', () => '']
]

export const exportExcel = async (s, invoices, name = 'deal-slip-summary') => {
  const XLSX = await import('xlsx')
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  let n = 0
  const rows = invoices.flatMap(inv => inv.lines.map((l, k) => {
    const r = { n: ++n, k: k + 1, inv, s, l, m: money(inv, s, l) }

    return DEAL_COLUMNS.map(([, f]) => f(r) ?? '')
  }))
  // the TOTAL row: the money columns summed, as on Finance's sheet
  const total = DEAL_COLUMNS.map(([h, , add], c) => (add ? r2(rows.reduce((t, row) => t + (Number(row[c]) || 0), 0)) : h === 'Billing Address' ? 'TOTAL' : ''))
  const ws = XLSX.utils.aoa_to_sheet([DEAL_COLUMNS.map(c => c[0]), ...rows, total])
  ws['!cols'] = DEAL_COLUMNS.map(([h]) => ({ wch: Math.max(10, Math.min(28, h.length + 2)) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Deal Slip Summary')
  XLSX.writeFile(wb, `${name}-${today}.xlsx`)
}
