// The parts of a goods receipt that Naveen's build holds but our snapshot did not take (31 Oct): batch, expiry and
// containers per line, the signed copy as a file, the gate sheet, and the vehicle visit. Until the refresh step pulls
// them (README: "Refreshing the DCs from Naveen's build"), they are drawn here, deterministically from the DC number,
// and treated as present (Sourav, 31 Oct: "assume all attachments are present"). Replace with real fields on the DC and this file goes.
const hash = str => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const local = t => new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const PLATES = ['KA05PF8183', 'KA01AB2271', 'KA53M4410', 'KA41N9028', 'KA09C6675']
const DRIVERS = [['Manjunath', '93612 07079'], ['Ravi Kumar', '98451 20394'], ['Suresh Naik', '97400 11238'], ['Iqbal', '99021 77810']]
const PER_CONTAINER = { 'u-kg': 25, 'u-gm': 500, 'u-nos': 50, 'u-tray': 10, 'u-pack1l': 12, 'u-bundle': 10, 'u-bale': 1, 'u-bunch': 20 }

export const extrasOf = d => {
  const h = hash(d.dcNumber)
  const lines = d.lines.map((l, i) => {
    const tracksExpiry = /FED|DRY|GRC/.test(l.itemId)
    const exp = new Date(d.receivedAt)
    exp.setMonth(exp.getMonth() + 3 + ((h + i) % 9))

    return {
      batchNo: `B26-${String(4000 + (((h >>> 3) + i * 7) % 900)).padStart(4, '0')}`,
      expiry: tracksExpiry ? exp.toISOString().slice(0, 10) : '',
      containers: Math.max(1, Math.ceil((l.receivedQty || 0) / (PER_CONTAINER[l.unitId] || 10)))
    }
  })
  const at = new Date(d.receivedAt)
  const [driverName, driverPhone] = DRIVERS[(h >>> 2) % DRIVERS.length]

  return {
    sample: true,
    lines,
    signedFile: d.signedDc ? { name: 'signed-dc.jpg', sizeKb: 900 + (h % 900) } : null,
    receivingFile: { name: `dc-${d.dcNumber.replace(/\//g, '-').toLowerCase()}.jpg`, sizeKb: 600 + ((h >>> 5) % 700) },
    gateSheet: { label: `Sheet #${1 + (h % 3)} · ${d.dcNumber}` },
    visit: {
      vehicleNo: PLATES[h % PLATES.length], visitRef: `GV-26-${String(300 + (h % 600)).padStart(4, '0')}`, driverName, driverPhone,
      enteredAt: local(new Date(at.getTime() - (20 + (h % 25)) * 60000)), enteredBy: 'Manoj Yadav',
      exitedAt: local(new Date(at.getTime() + (15 + ((h >>> 4) % 40)) * 60000)), exitedBy: 'Manoj Yadav'
    }
  }
}
