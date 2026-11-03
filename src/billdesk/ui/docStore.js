// Proof documents (30 Oct): the paper behind a record — the delivery challan and gate entry slip photographed at the
// receipt, the vendor's bill scanned when it is recorded. The lite has no server, so the files live in the browser's
// IndexedDB (localStorage is too small for photos); the GRN / invoice record carries only the document's metadata
// ({ id, kind, name, type, at, by }). Sample documents ship as static files under /procure-sample/docs and carry `url`.
import { useEffect, useState } from 'react'

const DB = 'billdesk.lite.docs'
const STORE = 'docs'
export const KINDS = { bill: 'Vendor bill', challan: 'Delivery challan', gate: 'Gate entry slip', debit: 'Debit note', other: 'Other document', doc: 'Attachment' }
export const kindLabel = k => KINDS[k] || KINDS.other

let dbp = null
const openDb = () => {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.reject(new Error('No document store in this browser'))
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB, 1)
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Document store failed to open'))
  })

  return dbp
}
const tx = (mode, fn) => openDb().then(db => new Promise((resolve, reject) => {
  const t = db.transaction(STORE, mode)
  const r = fn(t.objectStore(STORE))
  t.oncomplete = () => resolve(r?.result)
  t.onerror = () => reject(t.error || new Error('Document store failed'))
}))

let seq = 0
export const newDocId = () => `doc-${Date.now().toString(36)}${(seq++).toString(36)}`
// the metadata a record keeps; the file itself stays in the store
export const metaOf = d => ({ id: d.id, kind: d.kind, name: d.name, type: d.type, size: d.size, at: d.at, by: d.by, ...(d.url ? { url: d.url } : {}) })

// keep a staged document (one with a dataUrl) and return its metadata
export const putDoc = async d => {
  if (d.url || !d.dataUrl) return metaOf(d)
  await tx('readwrite', st => st.put({ ...d }))
  cache.set(d.id, d.dataUrl)

  return metaOf(d)
}
export const putDocs = docs => Promise.all((docs || []).map(putDoc))
export const removeDoc = id => tx('readwrite', st => st.delete(id)).catch(() => {})
export const getDoc = id => tx('readonly', st => st.get(id)).catch(() => null)

// ---------- files → documents ----------
const readAsDataUrl = file => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(file) })
const loadImage = src => new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('Not an image this browser can read')); im.src = src })
// photos are shrunk to fit 1600px and saved as JPEG, so a phone photo of a challan is ~200 KB, not 4 MB
export const compressImage = async (file, { max = 1600, quality = 0.82 } = {}) => {
  const src = await readAsDataUrl(file)
  const im = await loadImage(src)
  const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight))
  const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(im, 0, 0, w, h)
  const dataUrl = c.toDataURL('image/jpeg', quality)

  return { dataUrl, type: 'image/jpeg', width: w, height: h, size: Math.round((dataUrl.length * 3) / 4) }
}
// a chosen or photographed file as a staged document (dataUrl in memory until the record is saved)
export const fileToDoc = async (file, kind, by) => {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf && !/^image\//.test(file.type)) throw new Error(`${file.name}: only photos and PDFs`)
  if (isPdf && file.size > 6 * 1024 * 1024) throw new Error(`${file.name}: a PDF must be under 6 MB`)
  const body = isPdf ? { dataUrl: await readAsDataUrl(file), type: 'application/pdf', size: file.size } : await compressImage(file)

  return { id: newDocId(), kind, name: file.name, at: new Date().toISOString(), by, ...body }
}

// ---------- reading ----------
const cache = new Map() // id → url (object or data) for this page
const waiting = new Map()
export const urlOf = meta => {
  if (!meta) return Promise.resolve(null)
  if (meta.url) return Promise.resolve(meta.url)
  if (meta.dataUrl) return Promise.resolve(meta.dataUrl) // staged: chosen but not saved yet
  if (cache.has(meta.id)) return Promise.resolve(cache.get(meta.id))
  if (!waiting.has(meta.id)) waiting.set(meta.id, getDoc(meta.id).then(d => { const u = d?.dataUrl || null; if (u) cache.set(meta.id, u); waiting.delete(meta.id); return u }))

  return waiting.get(meta.id)
}
// the document's url for an <img> / <iframe>: a sample's static file, or the kept file; null while loading or missing
export const useDocUrl = meta => {
  const [url, setUrl] = useState(() => (meta?.url || meta?.dataUrl || (meta ? cache.get(meta.id) || null : null)))
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    let on = true
    setMissing(false)
    if (!meta) { setUrl(null); return undefined }
    urlOf(meta).then(u => { if (!on) return; setUrl(u); setMissing(!u) })

    return () => { on = false }
  }, [meta?.id, meta?.url]) // eslint-disable-line react-hooks/exhaustive-deps

  return { url, missing }
}
export const isPdf = meta => meta?.type === 'application/pdf' || /\.pdf$/i.test(meta?.name || '')
// a record's documents: new-style `docs`, plus the old stub names in `photos` as missing challans (no file ever existed)
export const docsOf = (rec, legacyKind = 'challan') => [
  ...(rec?.docs || []),
  ...(rec?.photos || []).filter(n => !(rec?.docs || []).some(d => d.name === n)).map(n => ({ id: `legacy-${n}`, kind: legacyKind, name: n, legacy: true }))
]
