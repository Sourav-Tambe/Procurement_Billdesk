# Bill Desk · lite

The in-between module from delivery challan to Finance. DCs come from Naveen's Diet & Kitchen system (Inventory › Goods Received). An accounts clerk records the vendor's invoice against them. The Bill Desk head checks it and hands it to Finance. Finance exports Excel, records what went for payment approval, and records how it came back. Nothing from P&C, POs or GRNs exists upstream. It is a lite build: browser storage only, no database.

- **Framing:** [`docs/framing.md`](docs/framing.md) (ARCHITECT, YELLOW with named risks).
- **Decisions:** [`DECISIONS.md`](DECISIONS.md) (BD-1 to BD-16).
- **Plan:** `~/.claude/plans/jolly-splashing-lagoon.md`.

## Run it

```
npm run dev      # http://localhost:3021 (hot reload)
npm run build && npm run start   # production server on 3021
```

`node_modules` is a symlink to `../procure-web-lite/node_modules`, because both apps use the same packages. For a deploy or a fresh clone, run `npm ci` instead.

In the Studio `.claude/launch.json` the entries are `bill-desk-lite` (dev) and `bill-desk-lite-prod` (start).

Dev-server note (31 Oct): after many hot reloads, a tab can stop hydrating. The hot-reloader throws in `handleStaticIndicator` on an `isrManifest` message, and the page stays blank. A new tab or the production server is fine.

## Roles and screens

Switch roles with the person card under the logo. It also holds **Reset demo data**.

| Role | Person | Menu |
|---|---|---|
| Accounts clerk | Mark Ellis | DCs to bill · My invoices · Returned to me |
| Bill Desk head | Daniel Brooks | To check · Checked · Returned by Finance · Sent to Finance |
| Finance | Rachel Morgan | From Bill Desk · Sent for approval · Decided |

There is one invoice page (`/bill-desk/invoice/<id>`) for every role. It shows the bill scan, the bill details, the received-against-billed table, discrepancies, the role's actions and the trail.

## Where things are

| Path | What |
|---|---|
| `src/billdesk/seed/dcs.json` | Snapshot of Naveen's DCs, 1–15 Oct 2026: 66 DCs, 12 vendors, 58 items. Taken once from his live build; it is not an integration. |
| `src/billdesk/store.js` | Seed as read-only masters, plus work in localStorage `billdesk.v1`. Vendor GSTIN is a sample value. |
| `src/billdesk/sample.js` | 11 sample invoices across every state, with handovers, approval batches, trails, and SVG bills drawn from each invoice. |
| `src/billdesk/logic.js` | The rules: reconciliation, arithmetic check, duplicate key, DC taken, submit and check blocks. |
| `src/billdesk/flow.js` | Actions. Each checks the state, changes the record and appends one trail event. |
| `src/billdesk/excel.js` | Finance's Excel: `EXCEL_COLUMNS` and `LINE_COLUMNS` (sheets Invoices and Lines). |
| `src/billdesk/views.js` | Which invoices each menu item lists, and the menu counts. |
| `src/billdesk/screens/` | `ClerkDcs`, `Invoice`, `InvoiceList`, `Finance` (inbox, approval, head's Sent). |
| `src/billdesk/ui/` | Copied from procure-web-lite: `ui.js` (TAB tokens and parts), `DocTiles` and `docStore` (bill scans in IndexedDB `billdesk.lite.docs`), `ClientOnly`, the role switch. Also `parts.js` (page, card, pill, grid, selection bar, ask dialog). |

## Refreshing the DCs from Naveen's build

Open `antz-kitchen-prototype.pages.dev/hub#i1` in a browser and import his `invStore` chunk in the console (`m.a1.receipts`). His vendors (`procurementData` `g`), items (`I`), warehouses (`inter-symbols` `en`) and units (`settingsData` `U`) come the same way. Map them to the compact format in `dcs.json` (`l = [itemId, unitId, challanQty, receivedQty, rejectedQty, returnReason]`). The chunk names change with every one of his deploys. Don't run his downloaded code outside the browser.
