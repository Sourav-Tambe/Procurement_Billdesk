# Bill Desk: context pack (2 Nov 2026)

This pack describes the whole Bill Desk flow, from a delivery challan to payment, for someone who has not seen the build. It covers what the module is for, who uses it, every stage and status, the rules, the screens, and what is built, agreed or still open. Decision numbers (BD-n) refer to `DECISIONS.md`.

---

## 1. What Bill Desk is

Kitchens and stores at the zoo record goods received from vendors as **delivery challans (DCs)** in Naveen's Diet & Kitchen system (Inventory › Goods Received). Until now nothing turned those DCs into checked vendor invoices that Finance could act on. That work ran on paper, WhatsApp and Excel, with no record of which DCs had been billed. The real risks were double billing and missed bills.

Bill Desk is the module in between. **It starts at the DC and ends when Finance records payment.** There is no P&C, purchase order or GRN anywhere in this chain.

- **Upstream:** a snapshot of Naveen's DCs, 1–15 Oct 2026: 66 DCs, 12 vendors, 58 items. It is a one-time copy, not an integration. Bill Desk reads DCs and never edits them.
- **Build:** a "lite" Next.js app at `projects/Antz/procurement/bill-desk-lite/`, port 3021. It uses browser storage only, with no database or backend file store. All screens use components copied from the real Antz web codebase (`~/antz-reference/antz-codebase`), mainly from its Compliance module.
- **State:** not committed, not deployed, not on the Design Link Hub. Sourav has not reviewed it end to end.

## 2. People

| Role | Sample person | What they do |
|---|---|---|
| Accounts clerk | Mark Ellis | Records each vendor invoice against the DCs it covers, attaches the PDF, matches items, saves |
| Bill Desk head | Daniel Brooks | Reviews each invoice against its challans. Approves it to Finance or sends it back for correction |
| Finance | Rachel Morgan | Verifies, puts invoices into a payment-approval batch, records the approver's decision, records payment |
| Payment approver | outside the system | Decides. Finance records the result |
| Store and kitchen receivers | in Naveen's system | Create the DCs. Read-only here |

A floating role switcher at the top right changes who you are viewing as. It also holds **Reset demo data**.

## 3. Ground rules

These hold across the whole flow.

- **Received quantity is the truth (BD-2).** Invoice lines are compared with what the store received. Billed more or less than received is a **discrepancy**, never "matched".
- **Whole DCs only (BD-4).** One DC sits on one invoice. Splitting a DC across invoices is open (BD-38).
- **A DC is "taken" by derivation (BD-9).** A DC counts as billed while any invoice lists it. Deleting the invoice frees the DC. Nothing is stored on the DC itself.
- **One invoice, one vendor (BD-12).** An invoice may cover DCs from several warehouses.
- **Invoice numbers never repeat (BD-42).** A number already recorded under any vendor blocks saving, and the head can't approve it either. There is no override.
- **The invoice PDF is required (BD-28, BD-48).** At least one PDF must be attached to save. Only PDFs are accepted.
- **Rate and GST are optional (BD-49).** Discrepancies are about quantities only. Rates can't be checked, because DCs carry none.
- **Bill Desk number (BD-27).** The system's own ID, `BD-26-xxxx`, is the record's identity in batches, the trail and the Excel. People read "vendor + vendor's invoice number" first.
- **Append-only trail (BD-15).** Every move writes `{at, by, role, action, from, to, note}`, and entries are never edited.

## 4. The flow, end to end

### 4.1 Agreed status pipeline: 11 statuses

This is agreed (mock at `docs/mock/invoice-pipeline.html`). It is **built only on the clerk side.** Who acts at each stage is in the stage header, never in the status name.

| Stage (who) | Status | Meaning |
|---|---|---|
| Read (Antz AI, optional) | **Reading** | Antz AI is reading the PDF |
| | **Read failed** | Try again, or enter by hand |
| Match (clerk) | **Pending match** | Challans and items still to match |
| Review (head) | **Under review** | Checked against the challans; Matched or With discrepancies shows as a flag |
| | **Correction needed** | Sent back with a note to fix |
| Verify (Finance) | **In verification** | Finance checks before approval |
| | **Awaiting approval** | In a payment-approval batch |
| Decision (approver) | **Approved** | Cleared for payment |
| | **Rejected** | With a reason. Next step open (BD-8) |
| Payment (Finance) | **Payment pending** | Approved, not paid yet |
| | **Paid** | With payment reference and date |

### 4.2 Moves

| From | To | Who | What it takes |
|---|---|---|---|
| (none) | Reading | Clerk | Invoice number + PDF, then Send to Antz AI |
| Reading | Pending match / Read failed | Antz AI | Read finishes or fails |
| Read failed | Reading | Clerk | Try again (or the clerk enters it by hand) |
| (none) / Pending match | Under review | Clerk | Save with vendor, date, challans and every line paired. **Saving is sending** (BD-55) |
| Under review | In verification | Head | Approve. On discrepancies, choose **Pay as received** or **Accept as billed** |
| Under review | Correction needed | Head | Return with a note |
| Correction needed | Under review | Clerk | Fix and save ("Sent to the head again") |
| In verification | Awaiting approval | Finance | Add to an approval batch |
| In verification | Correction needed | Finance | Return with a reason (goes back via the head) |
| Awaiting approval | Approved / Rejected | Finance | Record the approver's decision |
| Approved | Payment pending | (automatic) | Immediately |
| Payment pending | Paid | Finance | Payment reference (UTR) and date |

A head or Finance question that needs **no fix** is a comment in the invoice's Discussion thread, and the status doesn't change (BD-54, planned).

### 4.3 Stage by stage

**1. Challans arrive (read-only).** Clerk › Delivery challans › **To Bill** lists every DC not on an invoice. Columns: SL.NO, DC, Vendor, Warehouse, Products, Received qty, Received (person + time). DCs with nothing received are dropped. Search sits on the left, with the date range and Filter drawer (Vendor, Warehouse, Received by) on the right. A row opens the **goods receipt**, a copy of Naveen's screen: products on the left (batch, containers, challan, received, rejected; a row expands to expiry and rejection reason), and Attachments, Vehicle and Delivery stacked on the right. Attachments open in a viewer. The vehicle opens a "truck visit" showing every challan on that truck that day. Naveen's edit actions are left out.

**2. Clerk records the invoice.** Add invoice is a full page (`/bill-desk/add-invoice`) inside one container:
1. *Invoice details:* invoice number, vendor and invoice date in two columns, then the invoice PDF rows (three across, with a dashed "Add attachment").
2. *Challans:* "Add challans" (enabled once a vendor is picked) opens a right side sheet with Received date and Area dropdowns, search, and the vendor's free challans as cards. A challan already on another invoice shows greyed and locked, with "On invoice X" and that invoice's state. Added challans show as document-placeholder cards three across.
3. *Items:* each received item with Received qty, Billed qty, rate and GST %. Mismatches read "Billed 5 kg more than received".

A fixed bottom bar holds **Save invoice**, greyed until the form is valid.

**2a. Antz AI route (optional, BD-35 to BD-37, BD-51 to BD-52).** With only a number and the PDF in, the bar offers **Send to Antz AI**. The invoice waits in Invoiced › **Pending match** with a parsing status: Reading (grey sweep), Read (green), Needs check (amber), Failed (red, reason on hover, Try again). Opening it shows the items the AI read from the bill straight away. The AI **suggests** challans ("Printed on the bill", then challans carrying a billed item), but **the clerk adds them**. Adding a challan pairs bill lines with DC items. A low-confidence line says what to check, with Confirm. "Compare with bill" shows the PDF beside the reading, with per-line confidence and the printed totals against what the lines add up to. The AI is simulated (`antzAi.js`); a real service replaces it later.

**3. Clerk's Invoiced tabs (BD-55, built).**
- **Pending match:** AI reads waiting for the clerk. Columns: Invoice no., Vendor, Parsing status, Uploaded by, Action. Dropdowns: Vendor, Parsing status.
- **Correction needed:** sent back by the head. Columns: Bill Desk no., Invoice no., Vendor, Sent back by, the note, and a Fix button.
- **Sent:** everything with the head or Finance that isn't closed. Columns: Total, Match ("n items mismatch" or Matched), Stage pill (Under review grey, In verification blue, Awaiting approval amber, Payment pending green), Days at stage (orange from 7). Paid and rejected invoices also stay here.

The clerk can Edit or Delete (⋮ menu) only while they hold the invoice, in Pending match or Correction needed. Deleting frees its challans. The clerk's menu is Delivery challans only; the separate Sent invoices page was removed (BD-56).

**4. Invoice details (every role).** A full page, `/bill-desk/invoice-details?id=`, on the Antz Exchange-details layout:
- Header card: invoice number, BD number, vendor, chips, and challan links.
- **Stage card:** Uploaded, Matched, Head review, Finance check, Approval, Payment. Each step shows who moved it and when. Returns show in the tertiary colour with an alert icon.
- One details card: info tiles, Items table, Challans, and Documents.

**5. Head review (agreed; screens on old statuses).** The head sees every invoice, matched or not. Open exceptions sort first, then invoices returned before, then the oldest. The head approves to Finance, or returns with a note. On a discrepancy the head picks Pay as received or Accept as billed. Today's build still has the older head screens: To check, Checked, Returned by Finance and Sent to Finance, with a separate "mark checked" step, bulk check of clean invoices (BD-18) and a handover batch.

**6. Finance (agreed; screens on old statuses).** Finance verifies, adds invoices to a payment-approval batch, records Approved or Rejected, then records Paid with UTR and date. Finance can return a single invoice with a reason. Today's build has From Bill Desk (a handover marked Received by Finance with one click, BD-13), Sent for approval, and Decided. Outcomes there are Approved, Rejected and **Deferred**; a deferred invoice returns to the inbox for a new batch (BD-7). Finance exports an **Excel** (sheets Invoices and Lines) with columns configured in `src/billdesk/excel.js`. This is a default until Finance shares its real sheet (BD-5).

### 4.4 Navigation (BD-57)

The clerk and the head share one sidebar: **Challans** (To Bill · Invoiced · All Challans) and **Invoices** (Pending Match · Correction Needed · Submitted). The role changes the actions and the default view: the clerk adds, matches and fixes; the head opens on Submitted filtered to Under review and approves or sends back from Invoice details. Finance keeps its own menu until its tab structure is given.

## 5. Built, agreed, open

**Built and working (clerk side):** To Bill / Invoiced / All tabs; goods receipt; Add invoice with manual and Antz AI routes; Add challans sheet; the three Invoiced sub-tabs; Invoice details with stage card; saving sends to the head (BD-55); the Correction needed loop. Data version 7, with sample invoices for every state.

**Agreed, not built:**
- The 11 status names across head and Finance
- The head's and Finance's screens on those statuses
- A Discussion thread on the invoice (one thread for clerk, head and Finance, beside the history)

**Open questions (blocking head and Finance):**
1. **BD-8:** what happens after **Rejected**? Today it is terminal, with a reason.
2. Should **Approved** and **Payment pending** merge into one status?
3. **Who records Paid and the UTR:** Finance, or someone else?
4. **Corrected bills:** a vendor's corrected bill after a discrepancy. Edit the same record, or cancel and replace? (BD-22 used delete; BD-27 notes SAP reverses rather than deletes.)
5. **Deferred:** it exists in the old Finance build (BD-7) but not in the new pipeline. Keep it or drop it?
6. **Head's checking step and handover batches:** the new pipeline goes straight from head approval to In verification. Do "Checked" and the Sent / Received-by-Finance handover (BD-13) survive?
7. **Signed DC:** BD-50 says every DC is signed and removed the column, but the head's "accept without signed DC" (BD-3) is still in the rules code. Retire it?
8. "Save for later" for manual entry without DCs, and splitting one DC across invoices (BD-38).
9. Finance's real Excel format (Sourav to share).
10. Product photos: 53 of 54 are loose Wikimedia matches, waiting on Naveen's catalogue.

## 6. Where things are

| Path | What |
|---|---|
| `DECISIONS.md` | BD-1 to BD-58, in order |
| `docs/framing.md` | Problem framing, stakeholders, decision architecture (31 Oct) |
| `docs/mock/invoice-pipeline.html` | The agreed 11-status pipeline and moves |
| `docs/mock/pill-sheet.html` | Status pills |
| `src/billdesk/seed/dcs.json` | Naveen's DC snapshot |
| `src/billdesk/logic.js` | Rules: match, duplicate, taken DCs, save blocks, status words |
| `src/billdesk/flow.js` | Actions (send to AI, save, return, check, hand over, approve, record outcome) |
| `src/billdesk/views.js` | What each role's list shows, and menu counts |
| `src/billdesk/excel.js` | Finance Excel columns |
| `src/billdesk/screens/` | ClerkDesk, InvoiceForm, ChallanSheet, Invoice, InvoiceList, Finance |
| `src/billdesk/ui/InvoicePipeline.js` | Stage card on Invoice details |

Run it with `npm run dev` or `npm run build && npm run start` and open `http://localhost:3021`. After a data change, use Reset demo data.
