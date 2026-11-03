# Bill Desk — ARCHITECT framing (31 Oct 2026)

### 1. Problem definition
Goods received at kitchens and stores are recorded in Naveen's Diet & Kitchen system as **delivery challans (DCs)** (Inventory › Goods Received). Nothing turns those DCs into **checked vendor invoices** Finance can act on. There is no P&C, PO or GRN in this chain. Bill Desk starts at the DC and ends at Finance's payment-approval record.

### 2. Problem vs symptom
- Symptom: Finance doesn't get a clean list of invoices.
- Problem: received goods and vendor bills live apart; no one owns pairing them, checking them and handing a vetted batch to Finance with a trail.
- **Root cause (hypothesis):** the receiving system stops at "goods in"; bill, check and hand-off have no home, so they run on paper / WhatsApp / Excel with no record of which DCs are billed (double-billing and missed bills are the real risk).

### 3. Stakeholder map
| Role | Kind | Here |
|---|---|---|
| Accounts clerk | Acts | Picks a vendor's unbilled DCs, records the invoice, attaches the bill, submits |
| Bill Desk head | Decides (gate 1) | Checks, resolves discrepancies, hands batches to Finance or returns to clerk |
| Finance | Consumes → decides (gate 2) | Acknowledges handovers, exports Excel, records sent-for-approval and outcomes |
| Payment approver | Decides (outside, not built) | Finance records the result |
| Store / kitchen receivers | Source (Naveen's system) | Create the DCs; read-only here |

### 4. Decision architecture
| # | Decision | Class | Owner | Freq | Question | Insight | Action | Conf. | Stakes |
|---|---|---|---|---|---|---|---|---|---|
| D1 | Which DCs does this bill cover? | Attention | Clerk | daily | Which of this vendor's DCs are free to bill? | DCs grouped by vendor; received qty; signed-DC status; age | Tick DCs → start invoice | High | High |
| D2 | Does the bill agree with what was received, and does it add up? | Risk | Clerk | per bill | Billed vs **received** qty per item; extra items; qty×rate = line; lines = taxable; GST; taxable+GST = total | Reconciliation table + bill scan; arithmetic check | Submit as Matched or Discrepancy | Medium (no rates to check against) | High |
| D3 | Is it fit to go to Finance? | Risk | Head | daily | Discrepancy? Signed DC missing? Duplicate? Returned before? | Exceptions-first list | Resolve → Checked → hand over; or return with note | High | High |
| D4 | What goes for payment approval? | Change | Finance | cycle | Which received invoices, how much, oldest first? | Finance list + Excel | Record approval batch | High | Medium |
| D5 | What came back? | Change | Finance | event | Approved / rejected / deferred? | Outcome per invoice | Record; deferred returns to the list | High | Medium |

### 5. Success criteria
- Every DC is billed at most once — enforced by derivation from invoices, not a UI flag.
- No invoice leaves the clerk without a bill attached and DCs chosen; none reaches Finance unchecked; no duplicate reaches Finance.
- Finance gets its list and an Excel in one click, zero re-typing.
- For any invoice: which DCs, who checked, when handed over, when Finance received it, approval batch, outcome — from the trail.

### 6. Scope
**Not solving:** P&C / PO / GRN; rate validation (no rates upstream); payments / UTR / bank files; editing DCs; live API to Naveen's system; credit and debit notes (original tax invoices only); partly approved payments; line-level (partial) DC billing; backend document storage or concurrency (lite).
**From the review, not taken (lite scope):** backend file store, concurrent-edit handling, live integration, line-level eligibility model. Taken: everything in §7 "Rules".

### 7. Decisions, rules, unknowns
**Decided by Sourav (31 Oct)**
- BD-1 Name **Bill Desk**.
- BD-2 **Received qty is the truth.** Lines start from received qty; any bill qty more or less, or an item not received, is entered by the clerk and makes the invoice a **Discrepancy**, not Matched.
- BD-3 Signed DC missing = billable, flagged; the head records "accepted without signed DC" (the flag itself can't be cleared here — it lives in Naveen's system).
- BD-4 Whole DCs only; line-level split later, after Sourav sees it.
- BD-5 Default Excel until Finance's sheet arrives; columns in one config.
- BD-6 Outcomes: **Approved · Rejected · Deferred**. No partly approved for now.
- BD-7 Deferred returns to Finance's "Received" list and goes in a new approval batch; the earlier batch stays in its history.
- BD-8 *(open)* What happens after a Rejected outcome — **later**. Lite: recorded with a reason, stays in Finance › Decided, no onward route.

**Rules (from the review, proposed defaults)**
- BD-9 **DC taken = derived.** A DC is taken while any live invoice (draft, with head, returned, checked, with Finance, sent, deferred, approved, rejected) lists it; deleting a draft frees it. Never stored on the DC. A received line billed 0 is closed as "less" on that invoice — not billable later (whole DCs).
- BD-10 **Arithmetic check.** Clerk types the bill's printed taxable, GST and total; Bill Desk computes from lines (qty × rate, GST % per line) and flags any difference beyond ₹1 as a discrepancy (`arith`).
- BD-11 **Duplicate key** = vendor + normalised invoice no. (uppercase, strip spaces `-` `/` `.`); date ignored. Duplicate can't be submitted; no override.
- BD-12 One invoice = one vendor; may cover DCs from several warehouses.
- BD-13 Handover has its own state: **Sent → Received by Finance** (one click on the batch). Finance can return a single invoice to the head with a reason ("Returned by Finance") before sending it for approval.
- BD-14 ~~MSME due~~ removed by Sourav, 31 Oct; Finance's list shows the oldest invoice first.
- BD-15 **Append-only trail** per invoice: `{at, by, role, action, from, to, note}`; never edited.
- BD-16 Demo data labelled "Sample"; Reset demo data in the profile menu.

**Unknown:** U1 Finance's Excel (primary stakeholder material missing); U2 Rejected route (BD-8); U3 whether the head checks every invoice or only exceptions (default: all, matched in batches).

### 8. Readiness — **YELLOW (named)**
Criteria 1–5 met; 6 partly: D4/D5 rest on U1 and U2. Risk: Excel columns and the rejected route may change once Finance sees it. Mitigation: Excel columns in one config; Rejected is a terminal-for-now state that can gain a route without a data change.

### 9. Next step
- Doctrine: JARVIS · Skill: one-shot on procure-web-lite patterns
- Reason: decisions and rules set; needs build
- Output: running Bill Desk lite, three role workspaces, seed from Naveen's DCs, on the hub after Sourav's go

