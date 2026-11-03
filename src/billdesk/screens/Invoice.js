// One invoice, for every role. The clerk reconciles the vendor's bill against what was received (BD-2) and checks the
// bill adds up (BD-10): the invoice's documents on the left, the bill's details on the right, the line table below, a sticky
// footer with the total and the match. The head reads the same page and resolves / accepts / returns / checks it;
// Finance can send it back. The trail sits at the bottom (BD-15).
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Box, IconButton, MenuItem, Select } from '@mui/material'
import toast from 'react-hot-toast'
import { useBillDesk, vendorOf, itemOf, unitOf, whOf } from '../store'
import { me } from '../roles'
import { listOf } from '../ia'
import { deleteInvoice, returnToClerk, ackSignedDc, markChecked, returnByFinance, takenDcs } from '../flow'
import { STATUS, DISC, RESOLUTION, OUTCOME, matchOf, lineCalc, computedOf, dupOf, checkBlocks, docsSummary, inr, fmtDay, fmtAt, isNum } from '../logic'
import { putDocs, useDocUrl, kindLabel, isPdf } from '../ui/docStore'
import { DocTile, DocViewer } from '../ui/DocTiles'
import UploadZone from '../ui/UploadZone'
import { C, Txt, I, Btn } from '../ui/ui'
import { Page, Card, Pill, StagePill, Field, AskDialog, tryRun } from '../ui/parts'

export const statusPill = inv => <StagePill status={inv.status} />
export const matchPill = inv => (inv.match === 'matched'
  ? <Pill tone='ok' icon='mdi:check'>Matched</Pill>
  : <Pill tone={inv.resolution ? 'info' : 'warn'} icon='mdi:alert-outline'>{inv.resolution ? RESOLUTION[inv.resolution.kind] : `Discrepancy · ${inv.discrepancies.length}`}</Pill>)

// the invoice's set of paper (Sourav, 31 Oct: "with the invoice we get the challans, and a few other documents as a
// complete set"): one or more vendor bills (at least one needed to submit), the challan copies, anything else.
// The chosen one shows large; the strip below holds the set; a tile opens the viewer over the whole set.
const SHORT = { bill: 'Bill', challan: 'Challan', other: 'Other' }
const DocsPanel = ({ docs, editable, onAdd, onRemove }) => {
  const [pick, setPick] = useState(0)
  const [open, setOpen] = useState(null)
  const cur = docs[Math.min(pick, docs.length - 1)]
  const { url } = useDocUrl(cur)
  const hasBill = docs.some(d => d.kind === 'bill')

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 420 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <I i='mdi:file-document-multiple-outline' c={C.text} />
        <Txt t='minorTitle' c={C.text} sx={{ flex: 1 }}>Invoice documents{docs.length ? ` · ${docs.length}` : ''}</Txt>
        {docs.length > 0 && <Txt t='sub' c={hasBill ? C.quiet : C.tert}>{hasBill ? docsSummary(docs) : 'No vendor bill yet'}</Txt>}
      </Box>
      {cur ? (
        <Box onClick={() => setOpen(Math.min(pick, docs.length - 1))} sx={{ position: 'relative', flex: 1, minHeight: 320, borderRadius: '8px', bgcolor: '#2B3330', display: 'grid', placeItems: 'center', cursor: 'zoom-in', overflow: 'hidden', p: '12px' }}>
          {isPdf(cur) ? <Box sx={{ color: C.white, display: 'grid', placeItems: 'center', gap: '8px' }}><I i='mdi:file-pdf-box' s={48} /><Txt c={C.white}>{cur.name} · open to read</Txt></Box>
            : url ? <Box component='img' src={url} alt={cur.name} sx={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: '4px' }} /> : <I i='mdi:loading' c={C.white} />}
          <Pill sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(255,255,255,0.92)' }}>{kindLabel(cur.kind)}</Pill>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', border: `1px dashed ${C.outline}`, borderRadius: '8px', p: '24px', bgcolor: C.surface }}>
          <Txt t='bodyMedium' c={C.ink}>{editable ? 'Attach the paper that came with the invoice' : 'No documents attached'}</Txt>
          {editable && <Txt c={C.quiet}>Attach the invoice and the papers that came with it; every figure is checked against them.</Txt>}
        </Box>
      )}
      {docs.length > 0 && (
        <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {docs.map((d, i) => (
            <Box key={d.id} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 64 }}>
              <DocTile meta={d} size={64} onClick={() => setPick(i)} onRemove={editable ? () => { onRemove(d.id); setPick(0) } : null}
                sx={{ outline: i === Math.min(pick, docs.length - 1) ? `2px solid ${C.ink}` : 'none', borderRadius: '8px' }} />
              <Txt t='sub' c={C.quiet} noWrap title={`${kindLabel(d.kind)} · ${d.name}`}>{SHORT[d.kind] || kindLabel(d.kind)}</Txt>
            </Box>
          ))}
        </Box>
      )}
      {editable && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', pt: '4px', borderTop: `1px solid ${C.n05}` }}>
          <UploadZone label='Upload invoice and documents' docs={[]} by={me().person} onAdd={made => { onAdd(made); setPick(docs.length) }} />
        </Box>
      )}
      {open != null && <DocViewer docs={docs} index={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

const Invoice = ({ id }) => {
  const s = useBillDesk()
  const router = useRouter()
  const role = me().value
  const inv = s.invoices.find(i => i.id === id)
  // the page only reads; the clerk changes an invoice in the Add invoice form (InvoiceForm, BD-21)
  const editable = false
  const clerkOpen = role === 'clerk' && inv && ['draft', 'returned_to_clerk'].includes(inv.status)
  const [ask, setAsk] = useState(null)
  const form = inv ? { invoiceNo: inv.invoiceNo, invoiceDate: inv.invoiceDate, docs: inv.docs || [], lines: inv.lines, printed: inv.printed || {} } : null
  const live = useMemo(() => (inv ? { ...inv, ...form } : inv), [inv]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!inv) return <Page contained={false} title='Invoice not found'><Card><Txt c={C.quiet}>This invoice doesn’t exist in this browser. <Link href={me().home}>Back to your list</Link></Txt></Card></Page>
  const m = matchOf(live), c = computedOf(live)
  const vendor = vendorOf(s, inv.vendorId)
  const dup = dupOf(live, s.invoices)
  const headOpen = role === 'head' && ['with_head', 'returned_by_finance'].includes(inv.status)
  const cBlocks = headOpen ? checkBlocks(inv, s.dcsBy) : []
  const missingSigned = inv.dcNumbers.filter(dc => !s.dcsBy[dc]?.signedDc)
  const lastReturn = [...inv.trail].reverse().find(e => e.to === 'returned_to_clerk' || e.to === 'returned_by_finance')
  const showReturn = lastReturn && ['returned_to_clerk', 'returned_by_finance', 'with_head'].includes(inv.status)
  const lastOutcome = (inv.outcomes || []).at(-1)

  const set = () => {}
  const setLine = () => {}
  // Back returns to the list that holds this invoice for the role looking at it (2 Nov), not to the role's first tab
  const backTo = () => {
    const st = inv.status
    if (role === 'clerk' || role === 'head') return listOf(inv)
    if (role === 'finance') return `/bill-desk/finance/${{ with_finance: 'inbox', sent_for_approval: 'approval', approved: 'decided', rejected: 'decided' }[st] || 'inbox'}`

    return me().home
  }
  const back = () => router.push(backTo())
  const discOf = itemId => m.discrepancies.find(d => d.itemId === itemId)
  const usedItems = new Set(form.lines.map(l => l.itemId))

  const lineCols = [['Item', 'minmax(200px,2fr)'], ['Received', '110px'], ['Billed qty', '120px'], ['Rate', '120px'], ['GST %', '90px'], ['Taxable', '120px'], ['GST', '100px'], ['', '44px']]
  const grid = lineCols.map(x => x[1]).join(' ')

  return (
    <Page contained={false} crumb={['Bill Desk', 'Invoice', id]}
      title={<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <IconButton aria-label='Back' onClick={back} sx={{ ml: '-8px' }}><I i='mdi:arrow-left' /></IconButton>
        {vendor?.name} · {inv.invoiceNo || 'No invoice no. yet'}
        <Pill tone='quiet'>{inv.id}</Pill>
        {statusPill(inv)}
        {matchPill({ ...inv, ...m, resolution: inv.resolution })}
        {inv.sample && <Pill>Sample</Pill>}
      </Box>}
      sub={`${inv.dcNumbers.length} DC${inv.dcNumbers.length === 1 ? '' : 's'} · ${[...new Set(inv.dcNumbers.map(dc => whOf(s, s.dcsBy[dc]?.warehouseId)))].join(', ')}`}>

      {showReturn && (
        <Card sx={{ bgcolor: 'rgba(250,97,64,0.08)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <I i='mdi:undo-variant' c={C.tert} />
          <Box><Txt t='bodyTitle' c={C.black} sx={{ display: 'block' }}>{lastReturn.to === 'returned_by_finance' ? 'Returned by Finance' : 'Returned by the head'} · {lastReturn.by} · {fmtAt(lastReturn.at)}</Txt><Txt c={C.text}>{lastReturn.note}</Txt></Box>
        </Card>
      )}
      {lastOutcome && (
        <Card sx={{ bgcolor: lastOutcome.kind === 'approved' ? C.tint : lastOutcome.kind === 'rejected' ? C.errBg : C.secBg, display: 'flex', gap: '12px' }}>
          <I i={lastOutcome.kind === 'approved' ? 'mdi:check-decagram-outline' : lastOutcome.kind === 'rejected' ? 'mdi:close-octagon-outline' : 'mdi:clock-outline'} c={C.ink} />
          <Txt c={C.text}><b>{OUTCOME[lastOutcome.kind]}</b> in {lastOutcome.approvalId} · {fmtDay(lastOutcome.at)}{lastOutcome.reason ? ` · ${lastOutcome.reason}` : ''}{lastOutcome.kind === 'deferred' ? ' · back in Finance’s list for a new approval batch' : ''}</Txt>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr)' }, gap: '16px', alignItems: 'start' }}>
        <DocsPanel docs={form.docs} editable={editable}
          onAdd={async made => { const metas = await putDocs(made); setForm(f => ({ ...f, docs: [...f.docs, ...metas] })) }}
          onRemove={id => set({ docs: form.docs.filter(d => d.id !== id) })} />

        <Card sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><I i='mdi:storefront-outline' c={C.text} /><Txt t='minorTitle' c={C.text}>Bill details</Txt></Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label='Vendor' value={vendor?.name} readOnly />
            <Field label='GSTIN' value={vendor?.gstin || '—'} readOnly />
            <Field label='Invoice number' value={form.invoiceNo} onChange={v => set({ invoiceNo: v })} readOnly={!editable} bad={!!dup} hint={dup ? `Already recorded as ${dup.id} (${STATUS[dup.status]})` : editable ? 'Exactly as printed on the bill' : null} />
            <Field label='Invoice date' type='date' value={form.invoiceDate} onChange={v => set({ invoiceDate: v })} readOnly={!editable} />
          </Box>
          <Box>
            <Txt t='subTitle' c={C.text} sx={{ display: 'block', mb: '6px' }}>DCs on this invoice</Txt>
            <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {inv.dcNumbers.map(dc => { const d = s.dcsBy[dc]; return <Link key={dc} href={`/bill-desk/dc/${dc}`} style={{ textDecoration: 'none' }}><Pill tone={d?.signedDc ? 'ok' : 'bad'} icon={d?.signedDc ? 'mdi:check-decagram-outline' : 'mdi:alert-circle-outline'}>{dc} · {fmtDay(d?.receivedAt)}{d?.signedDc ? '' : ' · signed DC missing'}</Pill></Link> })}
            </Box>
          </Box>
          <Box>
            <Txt t='subTitle' c={C.text} sx={{ display: 'block', mb: '6px' }}>As printed on the bill</Txt>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[['taxable', 'Taxable'], ['gst', 'GST'], ['total', 'Total']].map(([k, l]) => {
                const d = m.discrepancies.find(x => x.kind === 'arith' && x.field === k)

                return <Field key={k} label={l} type='number' value={form.printed[k]} readOnly={!editable} onChange={v => set({ printed: { ...form.printed, [k]: v } })} bad={!!d}
                  hint={d ? `Lines add up to ${inr(d.computed)}` : isNum(form.printed[k]) ? `Lines: ${inr(c[k])}` : editable ? `Lines: ${inr(c[k])}` : null} />
              })}
            </Box>
          </Box>
        </Card>
      </Box>

      <Card pad={false} sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: '14px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <I i='mdi:scale-balance' c={C.text} /><Txt t='minorTitle' c={C.text} sx={{ flex: 1 }}>Received against billed</Txt>
          <Txt c={C.quiet}>Received is what the store accepted in Diet & Kitchen</Txt>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: '12px', px: '16px', py: '10px', bgcolor: '#DDEBE9' }}>
              {lineCols.map(([h], i) => <Txt key={i} t='subTitle' c={C.text} sx={{ textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: i > 0 ? 'right' : 'left' }}>{h}</Txt>)}
            </Box>
            {form.lines.map((l, i) => {
              const d = discOf(l.itemId), lc = lineCalc(l), it = itemOf(s, l.itemId), u = unitOf(s, l.unitId)

              return (
                <Box key={l.itemId} sx={{ display: 'grid', gridTemplateColumns: grid, gap: '12px', px: '16px', py: '10px', alignItems: 'center', borderTop: `1px solid ${C.n05}`, bgcolor: d ? 'rgba(250,97,64,0.07)' : 'transparent' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Txt t='bodyMedium' c={C.black} sx={{ display: 'block' }}>{it?.name || l.itemId}</Txt>
                    <Txt t='sub' c={d ? C.tert : C.quiet}>{d ? `${DISC[d.kind]}${d.kind !== 'not_received' ? ` · ${Math.round((d.billed - d.received) * 100) / 100 > 0 ? '+' : ''}${Math.round((d.billed - d.received) * 100) / 100} ${u}` : ''}` : `${it?.code || ''} · ${u}`}</Txt>
                  </Box>
                  <Txt sx={{ textAlign: 'right' }} c={l.extra ? C.quiet : C.text}>{l.extra ? '—' : `${l.receivedQty} ${u}`}</Txt>
                  {editable ? <Field type='number' value={l.billedQty} onChange={v => setLine(i, { billedQty: v })} bad={!!d && d.kind !== 'arith'} /> : <Txt sx={{ textAlign: 'right' }}>{l.billedQty} {u}</Txt>}
                  {editable ? <Field type='number' value={l.rate} onChange={v => setLine(i, { rate: v })} placeholder='0.00' /> : <Txt sx={{ textAlign: 'right' }}>{inr(l.rate)}</Txt>}
                  {editable ? <Field type='number' value={l.gstPct} onChange={v => setLine(i, { gstPct: v })} placeholder='0' /> : <Txt sx={{ textAlign: 'right' }}>{l.gstPct}%</Txt>}
                  <Txt sx={{ textAlign: 'right' }}>{inr(lc.taxable)}</Txt>
                  <Txt sx={{ textAlign: 'right' }}>{inr(lc.gst)}</Txt>
                  <Box sx={{ textAlign: 'right' }}>{editable && l.extra && <IconButton aria-label='Remove line' size='small' onClick={() => set({ lines: form.lines.filter((x, k) => k !== i) })}><I i='mdi:close' s={18} /></IconButton>}</Box>
                </Box>
              )
            })}
            {editable && (
              <Box sx={{ px: '16px', py: '12px', borderTop: `1px solid ${C.n05}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <I i='mdi:plus' c={C.text} />
                <Select size='small' displayEmpty value='' onChange={e => { const it = itemOf(s, e.target.value); set({ lines: [...form.lines, { itemId: it.id, unitId: it.unitId, receivedQty: 0, billedQty: '', rate: '', gstPct: '', extra: true }] }) }}
                  sx={{ minWidth: 320, height: 40, bgcolor: C.white, borderRadius: '8px' }} renderValue={() => <Txt c={C.text}>Line on the bill that wasn’t received</Txt>}>
                  {s.items.filter(it => !usedItems.has(it.id)).map(it => <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>)}
                </Select>
              </Box>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: '12px', px: '16px', py: '12px', borderTop: `1px solid ${C.line}`, bgcolor: C.panel }}>
              <Txt t='bodyTitle'>Lines total</Txt><span /><span /><span /><span />
              <Txt t='bodyTitle' sx={{ textAlign: 'right' }}>{inr(c.taxable)}</Txt><Txt t='bodyTitle' sx={{ textAlign: 'right' }}>{inr(c.gst)}</Txt><span />
            </Box>
          </Box>
        </Box>
      </Card>

      {m.discrepancies.length > 0 && (
        <Card sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><I i='mdi:alert-outline' c={C.tert} /><Txt t='minorTitle' c={C.text} sx={{ flex: 1 }}>Discrepancies</Txt>
            <Txt c={C.quiet}>Value as received {inr(c.asReceived)} · as billed {inr(c.total)}</Txt></Box>
          {m.discrepancies.map((d, i) => (
            <Txt key={i} c={C.text}>· {d.kind === 'arith' ? `${d.label}: bill says ${inr(d.printed)}, lines add up to ${inr(d.computed)}` : `${itemOf(s, d.itemId)?.name}: received ${d.received}, billed ${d.billed}`} <Txt c={C.quiet}>({DISC[d.kind]})</Txt></Txt>
          ))}
          {inv.resolution && <Txt c={C.ink}><b>{RESOLUTION[inv.resolution.kind]}</b> · {inv.resolution.by} · {fmtAt(inv.resolution.at)}{inv.resolution.note ? ` · ${inv.resolution.note}` : ''}</Txt>}
        </Card>
      )}

      {headOpen && (
        <Card sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><I i='mdi:clipboard-check-outline' c={C.text} /><Txt t='minorTitle' c={C.text}>Your check</Txt></Box>
          {missingSigned.length > 0 && (
            <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Txt c={C.text} sx={{ minWidth: 160 }}>Signed DC missing</Txt>
              <Txt c={C.quiet} sx={{ flex: 1 }}>{missingSigned.join(', ')} has no signed copy in Diet & Kitchen.</Txt>
              {inv.signedDcAck ? <Pill tone='ok' icon='mdi:check'>Accepted · {inv.signedDcAck.by}</Pill> : <Btn onClick={() => tryRun(toast, () => ackSignedDc(inv.id), 'Accepted without signed DC')}>Accept without signed DC</Btn>}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
            {cBlocks.length > 0 && <Txt c={C.tert} sx={{ mr: 'auto' }}>{cBlocks.join(' · ')}</Txt>}
            <Btn icon='mdi:undo-variant' onClick={() => setAsk({ kind: 'return' })}>Return to clerk</Btn>
            <Btn kind='pri' icon='mdi:check' disabled={cBlocks.length > 0} onClick={() => tryRun(toast, () => markChecked([inv.id]), 'Marked checked')}>Mark checked</Btn>
          </Box>
        </Card>
      )}
      {role === 'finance' && inv.status === 'with_finance' && (
        <Card sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Txt c={C.text} sx={{ flex: 1 }}>Something wrong before it goes for payment approval?</Txt>
          <Btn icon='mdi:undo-variant' onClick={() => setAsk({ kind: 'fin_return' })}>Return to Bill Desk</Btn>
        </Card>
      )}

      <Card sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><I i='mdi:history' c={C.text} /><Txt t='minorTitle' c={C.text}>Trail</Txt></Box>
        {[...inv.trail].reverse().map((e, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', py: '6px', borderTop: i ? `1px solid ${C.n05}` : 'none' }}>
            <Txt t='sub' c={C.quiet}>{fmtAt(e.at)}</Txt>
            <Box><Txt t='bodyMedium' c={C.black}>{e.action}</Txt><Txt c={C.quiet}> · {e.by}{e.from && e.to && e.from !== e.to ? ` · ${STATUS[e.from]} → ${STATUS[e.to]}` : ''}</Txt>{e.note && <Txt c={C.text} sx={{ display: 'block' }}>{e.note}</Txt>}</Box>
          </Box>
        ))}
      </Card>

      {clerkOpen && (
        <Box sx={{ position: 'fixed', left: { xs: 16, lg: 296 }, right: 16, bottom: 16, zIndex: 20, bgcolor: C.white, borderRadius: '12px', p: '10px 12px 10px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Txt t='minorTitle' c={C.black}>{inr(c.total)}</Txt>
            <Txt c={C.quiet}> · {m.match === 'matched' ? 'Matched' : `With discrepancies · ${m.discrepancies.length}`}</Txt>
          </Box>
          <Btn kind='ghost' icon='mdi:delete-outline' onClick={() => { if (window.confirm(`Delete ${inv.id}? Its DCs go back to To bill.`) && tryRun(toast, () => deleteInvoice(inv.id), `${inv.id} deleted`) !== false) back() }}>Delete</Btn>
          <Btn icon='mdi:pencil-outline' onClick={() => router.push(`/bill-desk/add-invoice?edit=${inv.id}`)}>Edit</Btn>
        </Box>
      )}

      <AskDialog open={ask?.kind === 'return'} title='Return to clerk' sub='The clerk sees your note and fixes the bill.' confirm='Return' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'note', label: 'What to fix', multiline: true }]} onConfirm={v => { if (tryRun(toast, () => returnToClerk(inv.id, v.note), 'Returned to the clerk') !== false) { setAsk(null); back() } }} />
      <AskDialog open={ask?.kind === 'fin_return'} title='Return to Bill Desk' sub='The head sees it under Returned by Finance with your reason.' confirm='Return' tone='danger' onClose={() => setAsk(null)}
        fields={[{ key: 'note', label: 'Reason', multiline: true }]} onConfirm={v => { if (tryRun(toast, () => returnByFinance(inv.id, v.note), 'Returned to Bill Desk') !== false) { setAsk(null); back() } }} />
    </Page>
  )
}

export default Invoice
