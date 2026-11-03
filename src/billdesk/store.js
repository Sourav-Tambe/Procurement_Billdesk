// Bill Desk data in the browser (lite: no server, no DB). Two parts:
// - the masters and DCs: a read-only snapshot of Naveen's Diet & Kitchen system (seed/dcs.json), rebuilt on every load,
//   never saved, so a newer snapshot simply replaces it;
// - the work: invoices, handovers, approval batches, kept in localStorage under billdesk.v1. Bill scans live in
//   IndexedDB (ui/docStore); an invoice keeps only the scan's metadata.
// First load (or Reset demo data) starts from sample work (sample.js), every record marked sample: true (BD-16).
import { useSyncExternalStore } from 'react'
import seed from './seed/dcs.json'
import { sampleWork } from './sample'

const KEY = 'billdesk.v1'

// GSTIN isn't in Naveen's vendor master; these are sample values for the prototype
const VENDOR_FIN = {
  'v-11': { gstin: '29AAKFS4417M1Z2' },
  'v-12': { gstin: '29ABGFG2093K1Z8' },
  'v-13': { gstin: '29AACCC8812P1ZQ' },
  'v-14': { gstin: '29AAFFN5520D1Z1' },
  'v-15': { gstin: '29AAOFK3307H1ZT' },
  'v-16': { gstin: '33AAHFH6614Q1Z5' },
  'v-17': { gstin: '29ABBFA9035R1ZK' },
  'v-18': { gstin: '29AANFM1170L1Z9' },
  'v-19': { gstin: '29AAEFM7746C1ZW' },
  'v-20': { gstin: '27AABCD4421E1Z3' },
  'v-21': { gstin: '29AAJFB2286N1Z0' },
  'v-22': { gstin: '' }
}

const buildBase = () => {
  const dcs = seed.dcs.map(d => ({
    dcNumber: d.dc, vendorId: d.v, receivedAt: d.at, receivedBy: d.by, warehouseId: d.w, signedDc: !!d.signed,
    lines: d.l.map(([itemId, unitId, challanQty, receivedQty, rejectedQty, returnReason]) => ({ itemId, unitId, challanQty, receivedQty, rejectedQty, returnReason }))
  // nothing received, nothing to bill (Sourav, 2 Nov: "remove challans with 0 received qty")
  })).filter(d => d.lines.some(l => (l.receivedQty || 0) > 0))

  return {
    source: seed.source,
    vendors: seed.vendors.map(v => ({ ...v, ...(VENDOR_FIN[v.id] || {}) })),
    items: seed.items, warehouses: seed.warehouses, units: seed.units, dcs,
    dcsBy: Object.fromEntries(dcs.map(d => [d.dcNumber, d]))
  }
}
const BASE = buildBase()

const blankWork = () => ({ v: 9, invoices: [], handovers: [], approvals: [], seq: { inv: 0, ho: 0, pa: 0 } })
const listeners = new Set()
const emit = () => listeners.forEach(l => l())
let state = null

const readWork = () => {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage.getItem(KEY)
    if (raw) {
      const w = JSON.parse(raw)
      // v2 (31 Oct): the clerk's sample set was rebuilt; older saved work is replaced by the new sample
      if (w && w.v === 9) {
        // work saved before multi-document invoices had a single billDoc
        w.invoices.forEach(i => { if (!i.docs) { i.docs = i.billDoc ? [i.billDoc] : []; delete i.billDoc } })

        return w
      }
    }
  } catch {}

  return sampleWork(BASE)
}
const save = work => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(work))
  } catch {}
}
const load = () => {
  if (!state) {
    const work = readWork()
    state = { ...BASE, ...work }
  }

  return state
}

const SERVER = { ...BASE, ...blankWork() }
const subscribe = l => {
  listeners.add(l)

  return () => listeners.delete(l)
}
export const getState = () => load()
export const useBillDesk = () => useSyncExternalStore(subscribe, load, () => SERVER)

// apply a change to a copy of the work and keep it; fn returns a value for the caller (or throws to refuse)
export const commit = fn => {
  const cur = load()
  const work = JSON.parse(JSON.stringify({ v: 9, invoices: cur.invoices, handovers: cur.handovers, approvals: cur.approvals, seq: cur.seq }))
  const out = fn(work, BASE)
  save(work)
  state = { ...BASE, ...work }
  emit()

  return out
}
export const resetDemo = () => {
  const work = sampleWork(BASE)
  save(work)
  state = { ...BASE, ...work }
  emit()
}

// lookups
export const vendorOf = (s, id) => s.vendors.find(v => v.id === id)
export const itemOf = (s, id) => s.items.find(i => i.id === id)
export const unitOf = (s, id) => s.units.find(u => u.id === id)?.symbol || ''
export const whOf = (s, id) => s.warehouses.find(w => w.id === id)?.name || id
