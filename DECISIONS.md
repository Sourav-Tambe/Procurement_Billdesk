# Bill Desk — decisions

The framing is in `docs/framing.md`. A ChatGPT review on 31 Oct was weighed, and what was taken is BD-9 to BD-16. Not taken, because of the lite scope: backend file storage, concurrent-edit handling, live integration, and a line-level eligibility model.

## Decided by Sourav (31 Oct 2026)

- **BD-1** The module is called **Bill Desk**.
- **BD-2** **Received qty is the truth.** Invoice lines start from what the store received in Diet & Kitchen. A billed quantity that is more or less, or an item that wasn't received, is entered by the clerk. It makes the invoice a **Discrepancy**, not Matched.
- **BD-3** A DC whose signed copy is missing can be billed, with a flag. The head records "accepted without signed DC". The flag itself can't be cleared here, because it lives in Naveen's system.
- **BD-4** Whole DCs only. Splitting a DC line-by-line comes later, after Sourav has seen this working.
- **BD-5** The Excel is a default until Finance shares its sheet. Its columns are in one config, `src/billdesk/excel.js`.
- **BD-6** Payment-approval outcomes are **Approved, Rejected and Deferred**. There is no partly approved for now.
- **BD-7** A deferred invoice returns to Finance's From Bill Desk and goes in a new approval batch. The earlier batch stays in its history.
- **BD-8** *(open)* What happens after **Rejected** is decided later. For now it is recorded with a reason and stays in Finance › Decided, with no onward route.

- **BD-20** *(31 Oct)* **An invoice carries its set of paper**, not a single bill. Sourav's reason: the invoice arrives "with the challans, and a few other documents as a complete set". The kinds are vendor bill, delivery challan and other. Several files can be added at once. At least one vendor bill is needed to submit. Each add or remove is a trail event, and Finance's Excel lists the set ("1 vendor bill · 2 delivery challans").

- **BD-21** *(31 Oct)* **The clerk's flow.** The clerk works on one DCs page with two L1 tabs: **To bill** (DCs on no invoice, in one table) and **On invoice**. **Add invoice** opens a modal: pick the vendor, tick its DCs, and their items list. The clerk enters billed qty, cost per unit and GST % to get the total, adds the documents, and saves. A saved invoice stays with the clerk under On invoice, split L2 into **Matched** and **With discrepancies**. Only matched invoices with their vendor bill can be ticked and **sent to the head**. There is no draft or submit step, and the clerk edits or deletes from the same modal.
- **BD-22** *(31 Oct)* **Replacing an invoice with discrepancies.** It stays with the clerk until the paperwork is sorted. When the corrected invoice is added, the modal shows each DC that is "On BD-26-xxxx · with discrepancies" with **Delete BD-26-xxxx**. Deleting it frees the DCs for the new invoice.

- **BD-23** *(31 Oct)* **UI follows the Compliance module** (compliance-lite `ShipmentsListing` + `_table.tsx`). Each page has a breadcrumb above one white container. Inside it: an `h5` title with the green uppercase add button, a toolbar (search left, filters right), and an enclosed table (8px OutlineVariant border, `#E8F4F2` header with 12/600 titles, 64px rows, `#1F415B` text, Surface hover). Tables replace vendor-grouped cards. L1 is underline tabs and L2 is a filled toggle (`#006D35`). The modal's tables use the same header. Desktop only, no responsive work.

- **BD-24** *(31 Oct)* **Elements come from the Compliance build in the Antz codebase** (`projects/Code/antz-web-dashboard/src/components/compliance`), not from compliance-lite. Lists are the compliance build's `EnclosedDataGrid` (compliance-lite `animal-exchanges/_table.tsx`: DataGrid, 8px OutlineVariant border, `tableHeaderBg` mint header, 12/600 titles) through the `Grid` wrapper in `ui/parts.js`; Sourav checked the Antz `CommonTable` header against the hub build on 31 Oct and it did not match, so the hub build's table won. A person-with-date cell is the Antz `UserAvatarDetails` (`Person` in parts.js). The lite's `CommonTable` copy is unused now but carries two additions, `isRowSelectable` and `noRowsLabel`. Tab counts are written the Compliance way, "To Bill (39)". L2 is the category pills under Documents on the species page (compliance build on the hub, `DetailTabTables` DocumentsTab): 40px uppercase buttons, active OnSecondaryContainer with white text, the rest black at 5%. The time filter is the Antz `CommonDateRangePickers` (All time, Today, Yesterday, Last 7 days, Last 1 month, Last 6 months, Custom range) and the Filter button opens the canonical `CustomFilterDrawer` + `FilterContent` (Antz codebase) through the config-driven `ListFilterDrawer` wrapper (compliance-lite's).
- **BD-36** *(1 Nov)* **Send to Antz AI appears once the paper is attached** and goes when the first DC is added; a vendor the clerk picked first is passed to the AI as given. **Antz AI speaks Naveen's language** (kitchen build, `ParseState`): the robot icon, the house pill tones, "Antz AI reading…", "Antz AI · n items", "Antz AI · review" (tooltip: some lines need a check). Every Antz AI chip is green (Sourav, 1 Nov: "build with green"): reading, n items, review and On the bill; low-confidence fields and lines still to pair are still tinted amber so the clerk can find them. The purple and the sparkle are gone.
- **BD-35** *(1 Nov)* **Antz AI reads invoices, as an option.** Add invoice is one column: Invoice (number, date, the paper), Vendor, Select DCs, Items, and a bar at the foot. With only the number and the paper in, the bar's action is the outline **Send to Antz AI**; once DCs are added it is Save invoice. A sent invoice waits in **Invoiced › To connect** (Reading, then Read or Read · check n). Connect DCs opens the same form filled by the AI: DCs printed on the bill are added and marked On the bill, suggestions name the item they carry, each bill line is paired with a DC item or waits for the clerk to pick one, low-confidence reads are tinted purple, Received sits beside Billed, and Submit lands it in Matched or With discrepancies. The DC list can be very big, so DCs are only listed in the **Find DCs** sheet (search, date chips, warehouse, Show more, Add n DCs); the form shows the added ones. The AI is simulated in `antzAi.js` (8 s read, reading drawn from the vendor's DCs); the real service replaces it. Built in the app itself, not a hand-drawn mock, after the HTML mocks drifted from the real screens.
- **BD-34** *(31 Oct)* **Add invoice is a full page**, `/bill-desk/add-invoice` (`?vendor=&dc=` from the challan sheet, `?edit=<BD no.>` to edit). Breadcrumb and back arrow; entry containers on the left; the bill, documents, total and Save in a sticky panel on the right. Saving returns to Invoiced, on With discrepancies when the invoice has them.
- **BD-33** *(31 Oct)* **Add invoice refinements.** Vendor, Select DCs and Items are three containers. The vendor field shows only the name; the menu shows each vendor's DCs to bill on the right. DC chips are light, 52px, in a three-column grid that scrolls after three rows, with no signed status and no Select all; an eye on each chip opens the goods receipt read-only. Items use fixed columns with unit, ₹ and % in the inputs. No helper text anywhere. The modal is up to 1560px wide. Save is always clickable: if something is missing it toasts what, and marks the invoice number, date, upload or rate in red. The footer shows Total with the match status under it, shown only once every line has a rate.
- **BD-32** *(31 Oct)* **Add invoice is layout B** of docs/mock/invoice-form.html. Left: one "Invoice record" container with one header, holding vendor, the vendor's DCs as pick chips (number, date, received, signed status; a DC held by a discrepancy invoice offers Delete) and the items in Procure Lite's request-items table (thumb, name, received under it, billed qty, rate, GST %, amount, a total row). Right, pinned: invoice number, date, documents, total, match and Save. GST % fills from the item. **Removed:** the printed total and its check (BD-10's arith rule is gone), the to-do list in the footer, and adding an item that was not received; a discrepancy is now only billed more or less than received.
- **BD-31** *(31 Oct)* **Receipt attachments are assumed present.** On the challan sheet the file filed at receiving, the gate sheet and the vehicle visit show as on file, with no Sample marking. The signed DC still follows the snapshot: where Diet & Kitchen has no signed copy it shows Missing, because BD-3 and the head's "accept without signed DC" depend on it.
- **BD-30** *(31 Oct)* **The Add invoice modal follows Procure Lite's modals.** Shell is Procure Lite's `CommonDialogBox` (lg), the header is the Inventory window's (72px, 20/500 title, close), fields are MUI TextFields with the label in the outline under Procure Lite's `FIELD_SX` (8px corners, OutlineVariant border) as its masters sheets and New-item drawer use them; the item-row inputs are 40px outlined numbers. **Documents have no categories**: the upload is the compliance build's `UploadZone` (dashed paperclip button, one white row per file with icon, name, size and a red trash; several photos or PDFs at once), and the save rule is "attach the invoice", meaning at least one document. The invoice page's documents panel uses the same zone. Lists default to 25 rows a page.
- **BD-29** *(31 Oct)* **A DC row opens the challan page**, `/bill-desk/dc/<number>`, laid out like Naveen's goods-receipt sheet: a header bar in its own container (truck tile, "Delivery challan", the number as a chip, the stage), the Products table on the left, and on the right three stacked sections with icon rows: Delivery (vendor with GSTIN, received, warehouse), Attachments (the signed-DC stamp or Missing, filed at receiving), Bill Desk (now, source). Add invoice from here when the DC is free; Open BD-26-xxxx when it is on one. The clerk's sample set was rebuilt (store v2 replaces older saved work): 23 invoices, dates following the DCs, every discrepancy kind once (billed more, billed less, not received, printed total off).
- **BD-28** *(31 Oct)* **No invoice without the vendor's bill.** Save is the clerk's only step (BD-21), so the vendor bill is required to save, not just to send; the form's Save stays disabled with "Attach the vendor's bill" until one is attached. On Invoiced the toolbar is search, Vendor and the date range; no Returned filter (Sourav removed it) and no drawer, which is for the DC tabs only.
- **BD-27** *(31 Oct)* **The Bill Desk number stays, but does not lead.** Sourav asked whether BD-26-xxxx is needed; the answer, as SAP does it: the system's own number is the record's identity (handovers, approval batches, the trail, the Excel) because the vendor's number can recur after a discrepancy invoice is deleted (BD-22), while people read vendor and the vendor's invoice number. Rows lead with "Vendor · invoice" (name, then invoice number and date), with the Bill Desk number beside it; the invoice page title is vendor and invoice number with the Bill Desk number as a pill. Later, past the lite: replace BD-22's delete with a cancel that keeps the record, as SAP reverses rather than deletes.
- **BD-26** *(31 Oct)* **Filters on Delivery challans.** The toolbar is search on the left, the date range and the Filter button on the right; the vendor and warehouse dropdowns moved into the drawer. The date range is on received date for the DC tabs and invoice date for Invoiced. Drawer categories on To Bill and All: Vendor, Warehouse, Signed DC, Received by; All adds Now (the stage); Invoiced has Vendor. No rejected-quantity or age filter. Filters clear when the tab changes. Sample data grew to 25 invoices so every tab has rows (Reset demo data in the role menu loads them into a browser that already holds the old set).
- **BD-25** *(31 Oct)* **The clerk's page is Delivery challans**, with three L1 tabs: **To Bill**, **Invoiced** (was On invoice) and **All**. All lists every DC with a Now column: To bill, or the invoice it is on and that invoice's stage. A filter on rejected quantity is not wanted. Columns: DC, Vendor, Warehouse, Products, Received qty, Rejected, Signed DC, Received (person and time, last), then Now on All; no Age column. **Signed DC is drawn as in Naveen's Diet & Kitchen build** (Goods Received): the green SIGNED / Sealed / DELIVERED stamp, or "Missing" in red text, copied from his live bundle (`Stamp` and `SignedDc` in parts.js).

## Rules (from the review; proposed defaults)

- **BD-9** **A DC is taken by derivation.** A DC is taken while any invoice lists it; deleting a draft frees it. This is never stored on the DC. A received line billed at 0 is closed as "less" on that invoice and can't be billed later, because DCs are whole.
- **BD-10** **Arithmetic check** *(narrowed 31 Oct)*. The total printed on the bill is optional. If it's entered and differs from the items' total by more than ₹1, the invoice has a discrepancy (`arith`). Rates themselves can't be checked, because DCs carry none.
- **BD-11** **Duplicate key:** vendor plus the invoice number in capitals, with spaces, `-`, `/` and `.` removed. The date is ignored. A duplicate can't be submitted or checked, and there is no override.
- **BD-12** One invoice covers one vendor. It may cover DCs from several warehouses.
- **BD-13** A handover has its own state: **Sent**, then **Received by Finance**, with one click on the batch. Finance can't send an invoice for approval until its handover is received. Finance can return a single invoice to the head with a reason ("Returned by Finance").
- **BD-14** ~~MSME due date~~ — **removed by Sourav, 31 Oct.** No MSME flag, due date or column anywhere. Finance's lists show the oldest invoice first.
- **BD-15** **Append-only trail** on every invoice: `{ at, by, role, action, from, to, note }`. It is never edited.
- **BD-16** Demo records are marked "Sample". **Reset demo data** is in the role menu.

## Built defaults (Claude, 31 Oct; change if wrong)

- **BD-17** ~~The head resolves discrepancies~~. **Retired 31 Oct by BD-21:** discrepancy invoices never reach the head. A return to the clerk clears the head's signed-DC acceptance.
- **BD-18** The head can tick matched invoices that have nothing open and mark them checked together. Invoices with exceptions are checked one at a time on the invoice page.
- **BD-19** People come from the Procure-v1 team split (WS-7): Mark Ellis (accounts clerk), Daniel Brooks (head), and Rachel Morgan (Finance, as in the lite).

## BD-37 · The rest of Naveen's Antz AI, built (2 Nov)

Sourav: "Build it in lite, let me review later." The four ParseState pieces left out of BD-36 are in, for review.

- **Totals check.** The AI reads the taxable, GST and total printed on the bill. The Items card of the connect page shows "Totals match", "Totals do not match" or "Totals not verified", comparing the printed total with what the bill lines add up to now. It updates as the clerk corrects lines. Match is green; do not match uses Naveen's amber, not green, so it isn't read as good news.
- **Paper beside the reading.** "Compare with bill" on the Items card (and opening the attached paper on that page) shows the bill with a panel of what Antz AI read: each line with its confidence, then printed totals against "Lines add up to".
- **Per-item confidence.** Each read line carries a confidence. Below 80% the line's fields are tinted amber, as before; in the panel the score shows amber until the clerk edits the line, then "Checked". A line the AI couldn't pair carries candidate items: the DC item menu lists them first with "72% match".
- **A failed read.** "Antz AI · failed" in red with the reason on hover, "Not read" in place of the vendor, and Try again on the row. Opening it gives the ordinary form with Try again in the Invoice card, so the clerk can enter it by hand. Red, not green, is the one exception to BD-36.
- Sample: the low-confidence line now misreads its rate by a digit (42.00 as 4.20), so Totals do not match until the clerk fixes it from the paper. A third AI invoice, SAI/1022, failed on a dark photo. Data version 5 replaces saved work with the samples.

## BD-38 · Add invoice field order, vendor-aware duplicate, Antz tokens (2 Nov)

Sourav asked for the field sequence that covers every clerk behaviour, then "ok make it, and fix obvious UI mistakes, make sure antz fonts and colours are used".

- **Order:** invoice paper, invoice number, then vendor and invoice date side by side, then DCs, items, and the total bar. Vendor and date come before DCs because they narrow Find DCs. All three fields carry their label on the border.
- **Duplicate check is vendor + number** (SAP's rule), also on Send to Antz AI, which used to refuse a number any vendor had used. With no vendor yet, there is no duplicate.
- **Antz tokens:** state colours now come from the Antz web theme. "Check this" uses the notes yellow, discrepancy uses the tertiary container and failed uses the error container. The table header uses tableHeaderBg and info uses the secondary background. The font was already Inter, as in the dashboard.
- **UI fixes:** the discrepancies column is wide enough to read, and the empty column beside it shows only when a row was returned. The footnote under the discrepancies list is gone. Amounts with paise show two digits (₹73,426.50).
- **Still open, Sourav to decide:** "Save for later" for manual entry without DCs, and splitting one DC across invoices.

## BD-39 · Back buttons (2 Nov)

Sourav: "some back buttons are not working". The cause was that the Delivery challans list saved its tab in the address by replacing the browser's history state with nothing. That state is where Next.js keeps its routing state, so Back from a form changed the address but left the form on screen. The list now keeps that state and writes the sub-tab (To connect, Matched, With discrepancies) into the address too.

- Back on Add invoice goes to where the invoice lives: an invoice being connected or edited goes to its sub-tab, one started from a challan goes to that challan, and a new one goes to To Bill. It no longer uses browser history, which could leave the app.
- Back on an invoice page returns to the list holding it for the role looking: the clerk's sub-tab or Sent invoices, the head's To check, Checked, Returned or Sent, and Finance's From Bill Desk, Sent for approval or Decided.

## BD-40 · Add invoice: split form, compliance structure, fixed action bar (2 Nov)

Sourav, in a run of messages on the Add invoice page.
- "use split form design. what is this long fields": the first section holds the paper on the left and invoice number, vendor and date stacked on the right, so no field runs the full width. The order stays as in BD-38.
- "these both merge in one container, and follow compliance form structure": Invoice and Vendor and date are one section. Every section now has a numbered heading as in the compliance ExportPermitDetails ("1. Invoice details", "2. Select DCs", "3. Items"), with no header bar or icon. Required labels carry an asterisk.
- "at least have a placeholder that a document is not uploaded and then give a button to upload": with no paper, the compliance empty box says "No invoice uploaded" with an Upload invoice button. With paper, the bill shows as a 200px preview (Open for full size), then its file rows and Add file.
- "fix in bottom, and always show a submit button, but grey out": the action bar rests at the bottom of the window even on a short form. Save invoice (Submit when connecting an AI read) is always there, grey until the form can be saved. Send to Antz AI still appears beside it once the paper is in and no challans are added.
- "Find DCs should be Add challans, and some placeholder before I add, and find should be visible after I add the vendor": the button is "Add challans". With none added, the section shows "No challans added", and the button appears only once a vendor is picked.
- "this add DCs can come in a center modal": Add challans is a centred CommonDialogBox (Procure Lite) with search, date chips, warehouse, the list, then Cancel and "Add n challans" / Done.
- The floating role switcher now sits under drawers and dialogs (z-index 1150).

## BD-41 · Antz components, one container, challan cards, typed documents (2 Nov)

Sourav, in a run of messages on Add invoice and its sheets.
- **One container:** the whole form is one white container, sections divided by a line ("full form in one container").
- **Footer:** the action bar is fixed to the window's bottom edge, across the content beside the menu, with room left so it never covers the last section.
- **Buttons:** `Btn` is now the Antz codebase's MUI Button on the Antz theme ("use Antz components", "the buttons are differing"). pri is contained, outline is outlined, ghost is text and danger is contained error. Every button is 40px high, as in the compliance build; a caller's height is ignored.
- **Documents:** many files show as one preview of the picked file, its name, type, size and "n of m", a Type select and remove, then a thumbnail strip with an add tile. Each file has a type, as in the compliance module: the first is Vendor bill, later ones Other, and it can be changed. The type shows as a chip on the preview and under each thumbnail.
- **Add challans modal:** the header, list and footer are full-width bands with no card in a card. The header holds the title, search beside an "All areas" dropdown, and the date window as secondary tabs (Seg). The list sits on the Antz background as compliance species cards (AddSpeciesDrawer): white, a green border when picked, the checkbox in a tinted right panel. The footer holds Cancel and Add n challans.
- **Goods receipt sheet:** the body is on the Antz background, with the products table and the three boxes in white containers ("too white").
- **Challan cards on the form:** the section is "2. Challans". Each added challan is a card in a grid: a truck tile, the number, the date and area, view and remove, its items as chips, then the item count and "On the bill" when Antz AI read it. A suggestion is the same card, dashed, with Add.
- **Later the same day:**
  - Document types are dropped ("let it only be attachment"): every upload is an attachment, so there is no type select, chip or thumbnail label.
  - The large preview is gone ("no need for a large preview"): attachments sit as a gallery of 96px thumbnails with the file name under each. A thumbnail opens the file full size, its × removes it, and an add tile ends the row.
  - Send to Antz AI is outlined in the Antz addPrimary colour (#00AFD6) for text, icon and border, as Sourav named it.

## BD-42 · Invoice details option B, duplicate number blocks, Antz AI colour (2 Nov)

- **Option B** from `docs/mock/attachments-options.html` ("Option B for the invoice details section"): invoice number, vendor and date share one row in three equal columns, and the attachments sit below as a strip. The strip is labelled "Attachments · n" and holds 72px tiles with names, × to remove, and a + tile. With none, a short grey box says "No invoice uploaded" with Upload invoice. This replaces the BD-40 split form.
- **Any repeated invoice number blocks** ("if the same invoice number is present don't allow to proceed"), whichever vendor it is under. This replaces BD-38's vendor + number rule. The field shows "Already recorded as BD-… · vendor · status", and both Send to Antz AI and Save invoice are disabled. Send to Antz AI also refuses it, and so does the head's Mark checked.
- **Send to Antz AI** uses the Antz addPrimary colour (#00AFD6) for text, icon and border, and goes grey when disabled.

## BD-43 · Split back, Items its own container (2 Nov)

- **Invoice details is a split again** ("left for fields and right for the upload invoice like old one"): number, vendor and date are stacked on the left and the paper on the right, as tall as the fields. With no file it is the grey "No invoice uploaded" box with Upload invoice. With files it is a bordered panel, "Attachments · n", with 88px tiles that wrap. This replaces option B's single row.
- **Items is a container of its own** below the main form ("split items into a separate section in the form").
- **Fixes:** Received no longer wraps a long unit. The Billed field drops its unit, which already sits in Received beside it, because a long unit squeezed the number out. Number fields drop leading zeros, so "012" becomes 12.
- **Challan card:** the slip direction is mocked in `docs/mock/challan-slip-options.html` as D1 (paper left), D2 (paper on top) and D3 (slip row), with D1 in every state. It is not built yet.

## BD-44 · Challan card is the D1 slip (2 Nov)

Sourav picked D1 from `docs/mock/challan-slip-options.html`: "layout is ok, visual needs polishing, don't go out of Antz fonts and colours". He removed the "On the bill" and rejected tags and the add tile.
- **Left:** the challan's own paper (`challanSvg`, the same drawing the sample bills use). It shows at full width from the top, so the vendor, heading and first lines show, inset on the Antz background with a soft shadow. Clicking it opens the goods receipt, with an Open hint on hover.
- **Right:** the number (subtitle1, 600, OnSurfaceVariant), date and area (body2, neutralSecondary), then view and remove. Up to three lines follow, with the received quantity right-aligned in tabular figures, then "+n more". A hairline foot shows "n items · received by". There are no tags.
- **Grid:** cards are at least 360px wide with a 16px gap and the same height. The border turns Outline on hover, with a light shadow. Spacing follows an 8px rhythm with 16px insets.
- **Suggested challans** (connecting an Antz AI read) use the same slip, dashed, with Add in the foot.

## BD-45 · Add challans as a side sheet; field styling (2 Nov)

- **Side sheet:** Add challans is a right side sheet, 562px as the compliance species picker ("make a sidesheet"). The white header holds the title, then Received (Before the invoice date, Last 7 days, Last 30 days, All dates) and Area as two dropdowns on one row ("filters in a dropdown"). The tinted band holds search above the list, "Challans (n)" and the cards. The white footer holds Cancel and Add n challans.
- **Pill:** the Antz AI hint on a card is "n of m" with the robot icon. The full "n of m items are on the bill" shows on hover.
- **Bold:** only the Invoice number value is bold (600). Every other field is regular.
- **Autofill:** autofill no longer tints fields. Invoice number has autofill off, and every field keeps white and the theme text colour if the browser fills it.

## BD-46 · Naveen's clicks in the goods receipt (2 Nov)

Sourav: "whatever clicks are present in this modal from Naveen's build, please add those". From his GoodsReceived chunk, the read-only clicks are in:
- **Attachment names are links.** "Filed at receiving", the signed DC and the gate sheet open in the document viewer, with ← → between them. The papers are drawn: the challan without the seal, the signed copy with it, and a gate sheet.
- **The vehicle is a link** to "Truck visit · plate · visit ref": the driver, gate in and out, and every challan that day on that truck, with vendor, time and items. A challan opens in the same sheet. The Vehicle row says "n challans on this truck" when there is more than one.
- **A product row opens a detail strip** under the table: batch, expiry, containers × quantity each, and the rejection with its reason.
- **Left out:** his Edit, Delete goods receipt, Add product, Add signed DC, Replace, and label Preview and Print, because they change the store's record and Bill Desk only reads it.
- **Checked with 20 lines** (through a temporary hook, since removed): the sheet scrolls inside itself. The table fills the first view (832 of 1743 px), and Delivery, Attachments and Vehicle sit below the fold. Not changed. Options are in the reply to Sourav.

## BD-47 · Goods receipt in two columns (2 Nov)

Sourav: "make the Recommended for DC modal", from `docs/mock/goods-receipt-20-lines.html` (option 3). Earlier, a 20-line challan pushed the facts a screen down.
- **Layout:** products sit on the left. Attachments, Vehicle and Delivery stack in a 340px right column, as Naveen splits his goods-receipt edit screen.
- **Width:** the sheet is up to 1360px wide.
- **Columns:** the table drops Expiry and Reason, which show in the row detail strip. The rest are Product, Batch, Cont, Challan, Received and Rejected.
- **Products container:** the white container fills the height ("have the products container flexed"). The table and its outline hug the rows ("let the table be small", "table outline keep it hugged"). Only the table side scrolls. With 20 lines, all three fact boxes stay in view.
- **On invoice:** the banner sits at the top of the right column.
- **Attachments on Add invoice** stay as they are ("keep it as it is"). The options mockup `docs/mock/attachments-many.html` is kept for reference.
- **Sample driver** "Basavaraj" is renamed "Suresh Naik" in the challan data (`seed/extras.js`).

## BD-48 · Invoice details layout, PDF only, document-placeholder challans, product photos, token check (2 Nov)

- **Invoice details** follows the shipment form Sourav pointed to: fields in two columns (Invoice number, Vendor, then Invoice date), then "Invoice document*" with the compliance upload at up to 520px. With no file it is a dashed Upload invoice. With files, each PDF is one row (icon, name over size, remove) with a square dashed + beside the rows ("a plus button beside, and not below"). File rows are 56px with even padding ("spacing looks off").
- **PDF only:** the picker accepts PDFs only, and anything else is refused with "only PDF files".
- **Challan card** is option B of `docs/mock/challan-card-compact.html` ("Document placeholder"): a drawn page with a folded corner (opens the goods receipt), the number, "n items · area" and "date · receiver", view and remove. It is 92px tall, with no item lines and no paper picture. "Add challans" in the section header is a text button.
- **Product photos:** `public/images/items/<item code>.jpg` holds a Wikimedia Commons photo for 53 of 54 items, with licence and author in `CREDITS.json` beside them. "Rats (frozen, adult)" had no usable photo and keeps the box icon. They show in the Items table (manual entry) and the goods receipt products table through `ui/ItemThumb.js`. Sourav reviewed none of them, and some are loose matches (Browse bundle shows a goat eating palm leaves; Milk shows a milk bottle with doughnuts; Mealworms shows the adult beetle), to be replaced with Naveen's catalogue photos when there are any.
- **Antz token check on the form:** every colour is an Antz theme token except six literals and one size, which were moved onto tokens: the paper background to Background, the three shadows to shadowColor, the Open hint to neutral_50, the Antz AI hover to antzSecondaryBg, and an 11px label to 12px (the Antz caption size). Type uses the Antz scale: h6 for section titles, subtitle1, body2 and caption, and the Inter font.

## BD-49 · Small form fixes (2 Nov)

- **Grid:** challan cards are three to a row at every width. The invoice document rows take the same column, and the + sits outside it ("add button is excluded from the column width").
- **Add challans sheet:** the vendor's name shows under the "Add challans" title.
- **Count:** section counts read "3. Items (5)", with the count in regular weight and neutralSecondary so it isn't read as part of the title.
- **Rate and GST are optional** ("don't make rate, gst mandatory"). Saving no longer asks for a cost on every item, the rate field never shows an error, and Matched or the discrepancy count shows once challans are in. A line without a rate adds nothing to the total. Discrepancies are about quantities and are unchanged.

## BD-50 · To Bill table and toolbar against Compliance v2 (2 Nov)

- **To Bill columns:** Rejected and Signed DC are removed (every DC is signed), and so is the Signed DC filter. The vendor name is as bold as the DC number.
- **Challans with nothing received are dropped** where the store loads them, so they appear in no list, count or picker. In the snapshot that is AFM-3375.
- **Toolbar checked against `~/antz-reference/compliance-v2`** (restored 2 Nov), the animal-exchanges listings and the shared parts they use:
  - Date range (CommonDateRangePickers) and the Filter button (FilterButtonWithNotification) are identical to Bill Desk's copies.
  - The search field matches its `searchFieldSx`: small, 4px corners, OutlineVariant border, magnify icon. The vendor dropdown uses the same box.
  - The filter drawer's frame (CustomFilterDrawer) is identical. Its right pane differed, so FilterContent, Search, SpeciesCard and ImageWithShimmer are now copied from compliance-v2 as they are. The previous FilterContent is kept in the scratchpad.
  - Compliance listings have no toolbar dropdown: their pickers live in the filter drawer. The vendor dropdown stays outside on Sourav's earlier ask.
- **Correction, same day** ("not identical, check that real codebase"): compliance-v2's animal-exchanges is the lite rebuild. The real reference is `~/antz-reference/antz-codebase`, `pages/compliance/documents/shipments` and the hospital list pages. The shared files were already identical, but the page used lite stand-ins. The toolbar now uses the real parts:
  - `views/utility/Search` (343px, 4px corners, clear button)
  - a plain MUI `Select` size small, as on the hospital lists
  - `CommonDateRangePickers`
  - the compliance outlined Filter button (TuneRounded icon, OnSurfaceVariant text, OutlineVariant border, 4px corners, primary count badge) in place of FilterButtonWithNotification
- **Then "follow compliance components, from antz codebase":** the Delivery challans toolbar is now a straight copy of the compliance Shipments list in `antz-codebase/src/pages/compliance/documents/shipments`. Search (default props) is on the left. On the right, the date range in a plain Box and the outlined Filter button with its badge, all in a wrapping flex row, so narrow windows wrap instead of overlapping. Compliance has no toolbar dropdown, so **Vendor moved into the filter drawer** as its first category; this reverses the earlier "vendor dropdown outside". The Toolbar no-shrink tweak is undone. Finance and Sent invoices still use the older Toolbar.

## BD-51 · To connect fixes; the clerk connects the challans (2 Nov)

- **To connect list:**
  - Total shows the total printed on the bill as Antz AI read it, not the sum of possibly misread lines.
  - The sample read in progress is dated now, not 31 Oct.
  - Vendor and Invoice are separate columns, with no middle-dot header (also on Matched and With discrepancies).
  - Uploaded shows only the date and time; the clerk's own name repeated on every row.
  - The Filter button shows on Invoiced too, with its own drawer: Vendor (that sub-tab's vendors) and, on To connect, the Antz AI state (Reading, Review, Read, Failed).
- **Antz AI no longer adds challans** ("why are challans added by Antz AI? that work user has to do"). It reads which DCs are printed on the bill. On the connect page these are only suggestions, first in the Suggested list and labelled "Printed on the bill", followed by challans that carry an item the bill lists. The clerk adds each one, and the bill lines pair as challans are added.
- **The breadcrumb** on the connect page reads Bill Desk / Invoiced / Invoice details, not the invoice number.
- **Type scale check (2 Nov, "how did you use 13px"):**
  - Buttons are 14px/500, the Antz `button` token, through MUI Button. There is no 16px button size in the Antz scale.
  - Off-scale sizes moved onto the scale: Add invoice 13 to 14 (copied from the compliance AddButton), the ₹ and % adornments 13 to 14, goods receipt values 15 to 14, file-tile labels 10 to 12.
  - The 7px lettering inside the number-plate drawing stays, as part of the picture.
- **Buttons are 16px** ("yes buttons 16px"), set once in the theme's button typography, so every MUI button and Btn follows. The Add invoice header button and the compliance Filter button set their own size and are also 16px; Filter is pinned to 40px high. This departs from the Antz scale's 14px button.
- **SL.NO on every table** ("you forgot the serial number"): the shared Grid puts an SL.NO column first, as the Antz codebase's compliance lists do (100px, flex 0.01). The number is the row's place in the whole list, so page 2 of 25 starts at 26. A table can turn it off with `serial={false}`; none do.

## BD-52 · Items table on the connect page (2 Nov)

Sourav: "fix these small things", from the review of the Items table.
- **One Item column:** the name as Antz AI read it from the bill, with "DC item: …" in grey under it and a Change link. The picker shows only when a line is unpaired or the clerk clicks Change. "On the bill" and "DC item" are no longer two columns repeating the same name.
- **Low-confidence reads** say what to check ("Check quantity and rate against the bill") with a Confirm link that clears the amber when the value was right.
- **A discrepancy** says by how much: "Billed 5 kg more than received".
- **The totals pill** gives the figures when they differ: "Bill ₹8,400, lines ₹6,132".
- **Not done:** the bill shown beside the table on this page (still the Compare with bill popup), and pill-click highlighting of differing lines.
- **Items before challans** ("items should be part of the invoice that AI has read, challan adding is the user decision, you still have to show the items"): on an invoice Antz AI read, the Items section and the total show as soon as it opens, with the bill's lines and Received "—". Adding challans fills Received and pairs the lines. No per-row note while no challans are in.
- **Later:** "Received Qty." and "Billed Qty." are the Items headers, in 132px columns. The totals pill is gone from the Items header ("remove the yellow pill and the yellow cell"), and uncertain fields are no longer filled or outlined yellow. The line's note "Check quantity and rate against the bill" with Confirm stays. The totals comparison remains inside Compare with bill.
- **"To connect" is renamed "Pending match"** (2 Nov), on the Invoiced sub-tab and as the invoice status (was "With Antz AI"), as in the invoice pipeline.
- **Pending match columns** (2 Nov): SL.NO, Invoice no., Vendor, Parsing status (the Antz AI chip), Uploaded by (person and time), Action. DCs on the bill and Total are dropped from this list.
- **Parsing statuses** (2 Nov): Reading (grey, with a light sweep moving across it; still under reduced motion), Read (green), Needs check (amber, was "Antz AI · review"), Failed (red, reason on hover). Labels drop the "Antz AI ·" prefix, the robot icon stays, and the same pill shows on the invoice page title. The filter category is "Parsing status" with these four options. This replaces BD-36's all-green AI chips.
- **One sample per parsing status** (2 Nov): Needs check (GVF/2610/061), Read (AFM/INV/0412 and MGT/2611/118, read with every line sure and paired, `antzRead` option `clean`), Reading (KMS/INV/1190, for 25 s after load) and Failed (SAI/1022). Data version 6 resets saved work to the samples.
- **Invoiced filters are dropdowns** ("filter by vendor and status as dropdowns"): Vendor (that sub-tab's vendors) on every Invoiced sub-tab, and Parsing status (All, Reading, Read, Needs check, Failed) on Pending match. These are the codebase's plain small Select. The Filter button and drawer stay on the DC tabs only. Both dropdowns reset when the sub-tab changes.
- **A challan already on an invoice**, in the Add challans sheet ("a better way to show that it is linked and has a discrepancy"):
  - Greyed card, a lock in place of the checkbox, not selectable.
  - A third line: a link icon, "On invoice <number>" (a link that opens that invoice in a new tab), and a pill with the invoice's state (With discrepancies or Matched).
  - These cards sort after the free ones.
  - The old "On BD-… · tap to delete" pill, which deleted the other invoice from inside this sheet, is gone.

## BD-53 · Invoiced rows open a side sheet (2 Nov)

- **Row click** on With discrepancies and Matched opens a right side sheet, `screens/InvoiceSheet.js`, 640px ("when I click these rows, show a sidesheet").
  - The header shows the invoice number, the match pill, and "BD no. · vendor".
  - **Edit** opens the form.
  - A **⋮ menu** holds Delete invoice, which asks for confirmation; the challans go back to To Bill.
  - The body, on the Antz background in white containers, holds:
    - invoice date, challan count, item count and total
    - Items: received against billed, with mismatches in red and "Billed 10 kg more"
    - Challans, each with an eye that opens the goods receipt
    - Documents, each opening the viewer
- **The rows** no longer carry pencil and bin icons.
- **The Discrepancies column** reads "n items mismatch" in plain orange text, not the sentences and not a pill ("we need not explain the discrepancies in the row"). The sheet explains each mismatch.
- **Invoiced table order:** SL.NO (72px), Bill Desk no. (no Sample tag), Invoice no. (bold), Vendor, Challans (a count), Total, then Discrepancies or Documents.
- **The invoice sheet matches existing patterns** ("match with existing ui patterns"):
  - Items use the shared Grid table, as the goods receipt's products: SL.NO, item photo, name with code or the mismatch note, Received, Billed (orange when it differs), Amount.
  - Challans use the form's document-placeholder card, now the shared `ui/ChallanCard.js`.
  - Documents use the form's upload rows.
  - The sheet is 820px so the table fits without scrolling.
- **The invoice opens in a centred modal** ("invoice show in a modal, match the modal like we had in the procure lite"), not a side sheet. It is the CommonDialogBox with the Inventory window header the goods receipt uses: 72px, receipt tile, "Invoice" 20/500, the invoice number as a chip, the match pill, "BD no. · vendor", Edit, the ⋮ menu with Delete, and close. It is 1040px wide, and the body is unchanged.
- **Attached files sit across** ("attachments should be sideways"): three to a row on Add invoice, each one challan-card column wide, with the + after the last. The empty Upload invoice button is one column wide.
- **Invoice details is a full page** ("make that invoice modal into a full page"): `/bill-desk/invoice-details?id=<BD no.>`, opened from the Invoiced rows, with Back returning to the sub-tab.
- **It follows the Antz codebase's Exchange details page** (`components/animal-exchanges/ExchangeDetail.tsx`):
  - Breadcrumb Bill Desk / Invoiced / <invoice no.>, then back and "Invoice".
  - Header card: the invoice number (h5 600), "BD no. · vendor", the record-actions ⋮ (Edit; Delete invoice in Tertiary), the state chips (match pill, "n items mismatch"), and a ruled CHALLANS row of underlined challan links that open the goods receipt.
  - Tabs card: Overview (the tinted info tiles for invoice date, total, challans and items, plus a Mismatches list), Items (the Grid), Challans (cards three across), Documents (rows three across).
  - The modal version of `InvoiceSheet` stays in the code but nothing opens it now.
- **Add attachment:** the + beside the files on Add invoice is a labelled dashed "Add attachment" button, 56px high.
- **No tabs on Invoice details** ("move the documents also in one tab, so we remove the need of tabs"): the second card holds, top to bottom, the info tiles, Items (n) with the table, Challans (n) with cards three across, and Documents (n) with rows three across. The separate Mismatches list is gone; the items table marks them.
- **Stage card on Invoice details** ("an option to show the stage/pipeline of this invoice"), `ui/InvoicePipeline.js`, between the header and the details:
  - Six stage cards threaded by chevrons, in the look of the compliance stage pipeline: Uploaded, Matched, Head review, Finance check, Approval, Payment.
  - Each card shows its label, its state, and who moved it and when (from the trail).
  - Done stages are green with a check. The current stage is raised on the Surface tint and reads "Now". Correction needed, Returned by Finance and Rejected read in Tertiary with an alert icon.
  - Today's statuses map onto these stages. The new pipeline's statuses come later.
- **Documents on Invoice details** use the compliance DocViewRow look (`ui/DocViewRow.js`): the Antz PDF icon (`public/icons/file-pdf.svg`, copied from the codebase) or an image icon on the light-peach tile, the name, "size · who · date", and a View text button.

## BD-54 · Correction needed stays a status, with comments beside it (2 Nov)

Sourav asked whether a returned invoice should be a status or only a message thread, and chose the status ("ok let's have that status").
- **Send back (a fix is needed):** the status becomes Correction needed, and the invoice moves to the clerk's Correction needed sub-tab. The clerk edits and resubmits. The send-back note is the first message in the invoice's thread.
- **A question (no fix needed):** a comment on the invoice. The invoice stays where it is, and an unread chip shows on its row.
- **Planned:** a Discussion section on the invoice page, one thread for clerk, head and Finance, sitting alongside the history.
- **Invoiced sub-tabs, built (2 Nov):** Pending match, Correction needed, Sent. Matched and With discrepancies are gone, and so is Closed: paid and rejected stay on Sent invoices.
- **Not built yet:** the full new status names and the Discussion thread. These wait on the open BD-8 (Rejected), the Approved/Payment pending merge, and who records Paid.
- **The pill sheet** is `docs/mock/pill-sheet.html`.

## BD-55 · Saved is sent; Invoiced is Pending match · Correction needed · Sent (2 Nov)

Sourav asked whether to put discrepancies in Correction needed and rename In progress as Matched. Claude advised against both (the head decides discrepancies, and Matched would mislabel them), and Sourav said "ok make in build".
- **Saving sends the invoice to the head**, matched or with discrepancies (`saveInvoiceForm`). A returned invoice that is fixed goes back with "Sent to the head again". Sample invoices that stopped at draft now sit with the head. Data version 7.
- **Pending match** is unchanged.
- **Correction needed** holds what the head sent back: Bill Desk no., Invoice no., Vendor, Sent back by (person and time), the note, and Fix (opens the form).
- **Sent** holds everything with the head or Finance that is not closed: Bill Desk no., Invoice no., Vendor, Total, Match ("n items mismatch" in orange, or Matched), Stage pill (Under review grey, In verification blue, Awaiting approval amber, Payment pending green) and Days at stage (orange from 7). It has Vendor and Stage dropdowns.
- **No Send to head** selection or bar.
- **The Invoiced count** is the three sub-tabs. The Delivery challans menu count is challans to bill, plus Pending match, plus Correction needed.
- **The invoice page** shows the ⋮ menu (Edit, Delete) only while the clerk holds it: Pending match or Correction needed.

## BD-56 · The clerk's Sent invoices page is gone (2 Nov)

Sourav: "so this page is not needed right?", then "ok remove that tab". Delivery challans › Invoiced › Sent lists the same invoices with the pipeline's stage words, so the separate page only repeated it with the old statuses.
- The clerk's menu is Delivery challans only. `/bill-desk/clerk/invoices` now opens Invoiced › Sent.
- Back from an invoice page goes to Pending match, Correction needed or Sent, never to the removed page.
- The old invoice page's "Send to head" button is gone, along with `sendToHead` and `sendBlocks`, because saving sends (BD-55).

## BD-57 · Two sidebar items, three tabs each, same for clerk and head (2 Nov)

Sourav's IA: "Challans: To Bill, Invoiced, All Challans. Invoices: Pending Match, Correction Needed, Submitted. Same IA for all roles… only the permissions, actions and default views change", then "not 6 tabs in left nav bar, 2 tabs in the left nav bar, then inside 3 tabs for the listings". For Finance: "we will have different tabs structure", so Finance keeps its old menu for now.
- **Sidebar:** Challans and Invoices (`src/billdesk/ia.js`). Each page has three L1 tabs with counts. Each tab has its own address, `/bill-desk/challans/<tab>` and `/bill-desk/invoices/<tab>`, so Back returns to it. Old `/bill-desk/clerk/…` and `/bill-desk/head/…` addresses redirect.
- **Challans › Invoiced** lists challans that are on an invoice, with the invoice and its stage. Stage words everywhere follow the pipeline: Pending match, Correction needed, Under review, In verification, Awaiting approval, Payment pending, Rejected.
- **Invoices › Submitted** runs from head review until payment or rejection (rejected now included). The Days at stage column is removed (Sourav).
- **Role:** the clerk gets Add invoice, Fix, Try again and + Challan; the head sees the same lists without them. The head's Invoices opens on Submitted filtered to Under review. Badges: clerk, Challans = to bill, Invoices = pending match + correction needed; head, Invoices = under review.
- **The head acts from Invoice details:** Send back (note, to Correction needed) and Approve. With discrepancies, Approve becomes **Pay as received** or **Accept as billed**. Approving marks it checked and hands it to Finance in one step (`approveToFinance`), so it lands in Finance's From Bill Desk as In verification. A challan without a signed copy is accepted in the same step (BD-3).

## BD-58 · Invoice document in the header card (2 Nov)

"show documents in the top section", "a proper one document shown in top section, and others as a + more", "show the document in the right side in that container". The header card of Invoice details has the first document (the invoice) as a preview on its right, with its name and "+n more", which opens the viewer on the next document (its arrows go through the rest). The separate Documents section lower on the page is removed.
- **Later, 2 Nov:** the preview on the right of the header card is now the compliance document card (antz-codebase `PdfFileCard`, Figma CITES Animal Shipment Documents 5881:50571), in `ui/PdfFileCard.js`: a 150px white card with a grey border and a 100px tile. A PDF shows the PDF icon on the light-peach tile, and an image shows its thumbnail. The file name sits under it with a ⋮ menu (View, Download). "+n more" sits under the card. With no file, a dashed "No invoice uploaded" box. Only this part changed ("just update the attachment part in the current build"). The full scenario mock is `docs/mock/invoice-details-attachment.html`.

## BD-59 · Stage rail as a stepper; layout mock with attachments and activity (2 Nov)

- **Stage rail, built** ("make that stage rail like this", a stepper reference): `ui/InvoicePipeline.js` is now six circles joined by dotted rails on a soft rounded strip, with the stage name and a line under each. Done: a dark filled circle with a check, and who moved it and when. Now: a green ring and the state. A return or a rejection: a red circle with a cross and the state in red. Waiting: an empty grey ring.
- **Layout, mock only** ("split within the section to have the attachments and the activity section in right side top and bottom section, move rail to top section, make in mockup"): `docs/mock/invoice-details-layout.html`. The rail moves into the header card. The details card splits into the content on the left (info tiles, Items, Challans) and a 360px column on the right: Attachments on top (every file as a document card, two to a row, "+n more" past four, "+ Add" for the clerk holding it), Activity below (the trail newest first, with initials, notes, and "Show all" past five). Not built yet.
- **Stage rail names (2 Nov, "just list what it should have been", "ok do it"):** Uploaded · Challans linked · Head review · Finance check · Approval · Payment. Step 2 was "Matched", which read as the match result: an invoice with discrepancies showed "Matched ✓". Correction needed now sits on Head review in red, as in the pipeline. An invoice Antz AI is still reading (or failed to read) sits on Uploaded: Reading, or Read failed in red. Done in the build (`ui/InvoicePipeline.js`) and in `docs/mock/invoice-details-v2.html`.

## BD-60 · Invoice details rebuilt from the v2 mock (2 Nov)

Sourav: "ok build it", from `docs/mock/invoice-details-v2.html` (a reference AP tool's invoice page, kept in the Antz look).
- **Header card:** back, the invoice number (Inter Regular 28px) with its state pill, and a summary line (vendor · total · Bill Desk no. · uploaded when, by whom). On the right: the head's **Send back** and **Approve**; the clerk holding it gets **Fix invoice** (sent back) or **+ Challan** (pending match), with Edit and Delete in the ⋮. When the invoice came back, the note sits in a highlighted band above the rail with who sent it and when. Then the stage rail.
- **Invoice information** (left): Vendor, Invoice date, Items ("6 · 2 differ" in orange or "all match"), Bill Desk no., Uploaded by, Approved by. Then **Challans (n)** as compact cards (`ui/ChallanCard.js`) and **Items (n)** with a Rate column and a "+10 kg" / "−5 kg" flag beside a differing item. Then a totals block: Lines add up to, Printed on the bill (when Antz AI read it), Invoice total.
- **Right column:** **Attachments (n)**: document cards two to a row, "+n more" past four, "+ Add" for the clerk holding it. **Activity (n)**: the trail as a vertical rail (`ui/ActivityRail.js`), newest first, scrolling inside the card; **View all** opens a right side sheet grouped by day.
- **Removed:** the info tiles, the document card in the header, the Challans link row, GSTIN, View original, the Checks and What needs to happen cards, and the head's Pay as received / Accept as billed. `approveToFinance` no longer takes a payment choice; the history says "Approved with n items differing".
- **Times:** the trail and the sample stored UTC clock times without a zone and read them back as local, which moved every time back 5½ hours ("Sent to the head" showed before earlier events). `flow.now` and the sample's `plus` now keep local time; `fmtAt` is 12-hour, as the rail shows. Data version 8 reloads the samples.

## BD-61 · Submitted split into Under Review and Reviewed (2 Nov)

Sourav: "we need to split the listing that is under review and approved -> make approved to reviewed". Invoices now has four tabs: Pending Match · Correction Needed · **Under Review** · **Reviewed**, the same for the clerk and the head.
- **Under Review:** with the head, newly sent or returned by Finance (stage pill "Returned by Finance" in orange). The head's Invoices opens here, and the head's sidebar badge counts it.
- **Reviewed:** approved by the head, from In verification to Payment pending or Rejected, with the Stage dropdown (In verification, Awaiting approval, Payment pending, Rejected).
- Saving an invoice lands on Under Review. Back from an invoice returns to the tab that holds it. The old `/bill-desk/invoices/submitted` address opens Under Review.
- **The head marks it reviewed (2 Nov, "head clicks Reviewed"):** the head's button is **Mark as reviewed** (was Approve). Its dialog, toast and history line say Reviewed ("Reviewed", or "Reviewed with n items differing"), and Invoice information shows "Reviewed by". Approval stays the approver's word, recorded later by Finance. The sample trail's "Marked checked" is now "Reviewed"; data version 9 reloads the samples.

## BD-62 · Finance's Excel is the Deal Slip Summary; the sidebar stays lit (2 Nov)

- **Excel** (closes BD-5's open format; Sourav: "one row per item line, first sl number is the overall sheet sl number, second slnumber is per invoice sl number, have all the headers, what we have prefill, what we dont have keep it empty"). `src/billdesk/excel.js` writes one sheet, "Deal Slip Summary": Finance's 26 headers in their order, one row per invoice line, and a TOTAL row summing the money columns.
  - Prefilled: both serial numbers, Vendor Name, Tax Invoice No., Invoice Date (dd-mm-yyyy), Invoice Month (Formula) "Oct-26" and (Manual) "Oct26", Description of Item, Qty, Rate, Basic Value, Net Basic Value (= Basic, no discount held), Total Taxation %, SGST and CGST (half the GST each when the vendor's GSTIN state is 29; IGST otherwise), Total Invoice Value.
  - Empty, because Bill Desk does not hold them: Steady State / New Projects, Billing Address, Area, Site, Expense Category, Discount (%age), Discount (Amount), Packing Charges / Transportation, Summary No.
  - Checked by exporting Sent for approval: 8 lines over 2 invoices, the second serial restarts at 1, TOTAL ₹40,699 as on the page.
- **Sidebar** ("some times the navbar tab is not selected"): an item lit only on its own tab addresses, and only once the router had its query. Each item now names the pages it owns (`activeTest` in `nav.js`, read by `VerticalNavLink`): Challans for its tabs, a challan (`/bill-desk/dc/…`) and a new invoice; Invoices for its tabs, Invoice details and an invoice being edited.

## BD-63 · Finance screens cleaned up (2 Nov)

Sourav: "see what updates have not travelled to finance screens", "update them", "To Verify · Awaiting Approval · Payment Pending · Closed use these".
- **Navigation:** Finance has one sidebar item, **Invoices**, with four tabs: **To Verify** (with Finance) · **Awaiting Approval** (in an approval batch) · **Payment Pending** (approved) · **Closed** (paid or rejected), at `/bill-desk/finance/<tab>`. Old Finance addresses (inbox, approval, decided) redirect. The breadcrumb reads Bill Desk / Invoices; the badge counts To Verify.
- **Screen** (`screens/Finance.js`, built as Bill Desk's lists): the compliance toolbar (Search, the vendor dropdown, a batch dropdown on Awaiting Approval, the date range), separate Bill Desk no., Invoice no. and Vendor columns, Total, Match ("n items mismatch" or Matched), and a column per tab (Reviewed by, Approval batch, Approved, Outcome with UTR or reason). Oldest invoice first. Rows open Invoice details. Export to Excel exports the tab, or the ticked rows, as the Deal Slip Summary.
- **Steps:** no "Mark received" (a review hands the invoice over by itself). Tick on To Verify → **Send for payment approval** (a batch). Tick on Awaiting Approval → **Approved** or **Rejected** with a reason (Deferred dropped). Tick on Payment Pending → **Mark paid** with UTR and date (new `markPaid`, status `paid`). The same actions sit on Invoice details for Finance, with **Send back** to the head on To Verify; Back returns to Finance's tab.
- **Elsewhere:** Paid shows on the stage rail (Payment done), in the header pill and on Bill Desk's Reviewed tab and its stage filter. The two samples left at the old "checked" status now sit in To Verify.
- Checked end to end headless: one invoice sent, approved, paid (UTR8842201) and closed, counts moving 5→4 / 2 / 3 / 1→2; Finance's Send back on Invoice details returns to To Verify.

## BD-64 · Finance's Data Explorer (2 Nov)

Sourav: "in our compliance we had something called as a data explorer, so i need one for Finance team", then "Straight to build". Ported from the Antz codebase's compliance Data Explorer (`components/animal-exchanges/DataExplorerView.tsx`, `explorer/pivotEngine.ts`, `RowDrillSheet.tsx`, `PillTabs.tsx`, `drawers/_scaffold.tsx`) to `src/billdesk/explorer/`, at `/bill-desk/data-explorer`, a second sidebar item for Finance.
- **Same as compliance:** one table card with the Rows / Columns / Measure builder strip, Save as preset (only when the view matches no preset), the density toggle and Export; the pivot table with gridlines, sticky header and first column, live re-pivot, header sorting, click-to-select with the row and column crosshair, arrow keys and Esc, "—" for empty cells, totals and a 50-row cap; preset tiles below with saved presets (Rename, Delete with a confirm); a row label opens the 562px drill sheet with pill tabs per dimension (rank, value, share) and a list tab.
- **Over Finance's data:** one record per invoice line. Dimensions: Vendor, Month, Year, Item, Area, Stage, Match, Approval batch. Measures: Invoice value, Taxable value, GST (₹), Count of Invoices / Lines / Vendors, Mismatch lines. Presets: Spend by Vendor, Where each Vendor stands, Invoices by Stage, Mismatches by Vendor, Spend by Item, GST by Month. The drill sheet's list tab is Invoices, each opening Invoice details.
- **Changed from compliance:** a date range on the toolbar (the engine's from/to filter, which compliance does not show); Export writes Excel, not CSV; saved presets are kept in this browser, not a database.

## BD-65 · Invoice total in the table; modals in the Helpdesk reason-dialog style (2 Nov)

- **Invoice total** ("bro fix it", after "Lines add up to" and "Printed on the bill" were removed): the total is the items table's last row, inside its border on the Background tint, "Invoice total" under Item and the amount under Amount, not numbered and not clickable. The shared Grid takes a `totalRow` for this.
- **Every Bill Desk modal** ("For these modals refer the helpdesk cancel/reject modal ui"): `AskDialog` now follows the Helpdesk reason dialog (`procurement/helpdesk-only/shared/ui.js` uiReasonOverlay, tablet styles in `css-p.css`). It is 440px, white, with 16px corners; a 20/500 title with a round ✕; a muted line; the reason box tinted by tone (send back and reject in the Error tint, otherwise neutral), with a placeholder such as "Enter reason"; "Add a reason to continue." when a required reason is empty (a multiline field is required unless its label says optional); Cancel and the action as equal 48px buttons side by side. Reference, date and UTR fields stay plain outlined fields.

## BD-66 · Finance sees every tab; its own page is Payments (2 Nov)

Sourav: "show all the tabs to finance also … From challans to invoices", then "Yeah, I think payments would be right. And update the finances sidebar." Finance's sidebar is **Challans · Invoices · Payments · Data Explorer**.
- **Challans and Invoices** are Bill Desk's own pages with all their tabs, view-only for Finance: no Add invoice, Fix or + Challan, and the clerk's and head's actions stay hidden.
- **Payments** is Finance's page, renamed from Invoices: To Verify · Awaiting Approval · Payment Pending · Closed, with the To Verify badge. Bill Desk's Invoices keeps its name for the clerk and the head.
- **Invoice details** lights Payments (breadcrumb Bill Desk / Payments) when the invoice is Finance's (with Finance, awaiting approval, payment pending, paid or rejected), otherwise Invoices; Back returns to the matching tab.

## BD-67 · All Invoices on Payments and on Invoices (2 Nov)

- **Payments › All Invoices** ("In payments tab, I think you have to add one all invoices tab"): every invoice that has reached Finance (In verification to Paid or Rejected) in one list, with a Stage pill and a stage dropdown. Read-only: Finance acts on the other four tabs.
- **Invoices › All Invoices** (so the head "can see all the invoices that has reached to him"): every invoice in Bill Desk, whatever its stage, with a Stage pill (Pending match to Paid) and a stage dropdown, for the clerk, the head and Finance. An invoice still pending match shows "—" for Total and Match, and "Not read yet" when Antz AI has not named the vendor.

## BD-68 · Finance's Invoices shows only what has not reached it yet (3 Nov)

- Sourav: "OK option 3". For Finance, Invoices keeps Pending Match · Correction Needed · Under Review; Reviewed and All Invoices are hidden, since they hold the same invoices as Payments. Payments › All Invoices is Finance's one full list.
- The clerk and the head keep all five Invoices tabs. A Finance visit to a hidden tab's address goes to Payments › All Invoices (`ia.js` `hideFor` / `itemsFor` / `hiddenFor`).
- Same day: the table's header tick box no longer clipped; the selection bar is now the Antz codebase's own (hospital `ActionButtonsWithSelection`): white, docked to the bottom, "n invoices selected" with the total below, CLEAR outlined.

## BD-69 · One stage pill everywhere (3 Nov)

- "match all the status pills, from the table and the details page": one map, `logic.js` `STAGE` (status → label, tone), and one `StagePill` (label only; the dot was dropped the same day) in `ui/parts.js`, used by Invoices › Reviewed / All Invoices, Payments (Stage and Closed outcome), the details header, the challan sheet, the stage rail's state line and Data Explorer's Stage.
- Labels: Pending match · Correction needed · Under review · Returned by Finance · In verification · Awaiting approval · Payment pending · Paid · Rejected. The header no longer swaps Under review for "With discrepancies"; the match shows in Invoice information.

## BD-70 · The head marks invoices reviewed in bulk (3 Nov)

- "Give bulk mark as review for the head": tick boxes on Invoices › Under Review for the head only; the selection bar shows the count, the total and how many have items differing, with Mark as reviewed. One dialog (optional note) marks them all reviewed and sends them to Finance as one handover (`approveToFinance` now takes one id or several).
- Send back stays one invoice at a time, from the invoice, since each needs its own note.

## BD-71 · Mark as reviewed has no note; Under Review tab renamed Matched (3 Nov)

- The note on Mark as reviewed only reached each invoice's Activity, where Finance would not look. Removed (Sourav: "1"), single and bulk: the dialog is a plain confirm. Anything the head needs to flag goes through Send back.
- Invoices › Under Review is titled **Matched** ("under review tab, u rename as matched"); its address stays /bill-desk/invoices/under-review. The stage pill still reads Under review (pending Sourav).
- Challans › Invoice column leads with the vendor's invoice number, then Bill Desk no. · stage ("real invoice is not mentioned").
