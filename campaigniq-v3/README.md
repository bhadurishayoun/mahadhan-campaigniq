# CampaignIQ v3

Clean rebuild of Mahadhan CampaignIQ from the client-approved mockups, one persona at a time. Business Head is first
(spec: `../business-head-prompt.md`); Marketing Head, Zonal Manager and Field Sales Manager follow in the same shell.

- **Live:** `https://bhadurishayoun.github.io/mahadhan-campaigniq/v3/#/bh/command-centre` (after the next deploy).
- **Sign in:** the same sign-in page as the current app (copied unchanged into `src/auth/`). `MASTER001` /
  `Mahadhan@2026` or `SH001` / `Strategy@123` open the Business Head workspace. Signing in as a persona whose
  workspace is not built yet returns to the sign-in page with Business Head selected.
- **Mockups:** `docs/mockups/business-head/` (downloaded from the shared Drive folder; file names ≠ screen numbers —
  the map is in `src/routes.ts`).
- **Rules:** `CLAUDE.md` (hygiene, design system, data rules). Check with `npm run hygiene`.

## Run
```
npm install
npm run dev          # http://localhost:5174
npm test             # data reconciliation (src/data/bh.test.ts)
npm run hygiene      # banned words, screen codes, hex colours, font sizes
npm run build
npx vite preview --port 4174 & node scripts/shots.mjs [filter] [width] [height]   # screenshots → docs/screens/
```

## Structure
| Path | What |
|---|---|
| `src/data/bh.ts` | Every figure (money in lakh); totals and percentages computed; `bh.test.ts` reconciles them |
| `src/store/bhStore.tsx` | Shared state (scope, theme decisions, interventions, recommendations, scenarios) in localStorage |
| `src/shell/` | Top bar, sidebar, notifications (management attention) |
| `src/ui/` | KpiCard, Card, DataTable, StatusChip, FilterBar, SegmentedControl, WorkflowStepper, Drawer, Modal, EvidenceDrawer, charts |
| `src/screens/` | One file per screen |
| `src/theme.ts` | The only place colours live |

## Project status & next steps
| Phase | Scope | Status |
|---|---|---|
| A | Foundation: app, sign-in, shell, data module + tests, store, UI kit, hygiene and screenshot scripts, deploy step | Done |
| B | Screens 1–6: Command centre, Portfolio, Regional (new), Territory (Ambad), Effectiveness, Diagnostics drawer | Done |
| C | Screens 7–10: Investment & ROI, Campaign investment, Commercial returns, Reallocation simulator (interactive) | Done |
| D | Screens 11–16: Market opportunity, Theme inbox, Theme review, Decision modal, Suggest theme, Submit drawer | Done |
| E | Screens 17–20: Action tracker, Intervention drawer, Portfolio learning, Decision Assistant | Done |
| F | All 20 routes checked at 1440×900 and 1366×768 (no console errors, no horizontal scroll, no clipped text). Still to do: a scripted click-through of every navigation-map row | Partly done |

Bottom bar on every page: Back (left) and Next (right) only; Next follows the screen order 1→2→3→4→5→7→8→9→10→11→12→13→15→17→19→20→1.
Page actions (theme decision, evidence, save, submit) sit in the header of the card they belong to.
Actions persist in the browser (localStorage): theme decisions update the inbox, command centre and notifications;
submitted recommendations, reallocation reviews, intervention requests and next-year priorities appear in the tracker.
The Decision Assistant answers four prepared questions from the data module (no external model); typed questions are
matched to the closest of the four.
Crop-wise and product-wise portfolio views use breakdowns defined in `bh.ts` (they reconcile to the national totals;
the mockups show only the theme view).
Pages with view buttons (Campaign Portfolio Performance, Marketing Investment & ROI) share one filter header
(`FilterHeader` in `src/screens/common.tsx`): Region · Crop · Product · Theme on row 1; view buttons, Season and Sort by
on row 2. Every figure on those pages comes from the campaign records that pass the filters; the total row stays last.
Action tracker: 18 seeded register items (5 drafts, 9 awaiting response, 4 closed) in `initialInterventions()`; KPI
cards, donut and category counts use `interventionCounts()` (tested in `bh.test.ts`). Store key bumped to
`campaigniq.v3.bh.3` so browsers pick up the seeded rows.

## Field Sales Manager (persona `tm`, login TM001 / Territory@123 or the master login)
| Phase | Scope | Status |
|---|---|---|
| 0 | Mockups (`docs/mockups/field-sales-manager/`, 15), routes (`F` in `src/routes.ts`), sidebar, persona switch (avatar menu, master login), top-bar scope (Jalna cluster · Ambad · Ghansawangi · Badnapur), 15 screens with titles and Back/Next wired | Done |
| 1 | Data (`src/data/fsm.ts`, tested in `fsm.test.ts`): cluster, Ambad outlets, crop plan, priorities, campaign budget / scenarios / funnel, 13 execution units, impact. Ambad figures read from `bh.ts`. BH West now Ambad · Ghansawangi · Badnapur · Aurangabad · Nashik (West ₹16.0 Cr ABP, ₹14.2 Cr sales unchanged) | Done |
| 2 | Screens 1–5 (My Plan): performance (filters, Value / Growth views, Plan territory), territory network (geography explorer, outlet drawer), outlet targets (editable, live reconciliation, CSV import / template), village onion plan (calculator, inline edit), plan review (validation, submit). Shared `StepTabs` and `FilterRows` in `src/ui/core.tsx` | Done |
| 3 | Screens 6–10: business priority (prefills the wizard), objective & targeting (village / retailer multi-select, required-field checks), activity & budget mix (add / edit / remove, live budget mix), scenarios (selectable, editable funnel assumptions), review & submit (readiness, rationale, attachment; submit launches the campaign). Wizard state in the FSM store (sessionStorage); reached steps can be revisited | Done |
| 4 | Screens 11–15: live control tower (week / activity views, calendar and exceptions open the activity), corrective action (owner + reason required; saving reschedules or escalates and clears the exception), campaign impact, village diagnostic (BH village figures), AI Copilot workspace (prepared and typed questions answered from the data). Verified at 1440×900: no console errors or overflow, Next/Back chain, cross-persona Ambad and West figures identical | Done |

The active persona follows the route (`/bh/…`, `/fsm/…` or `/zm/…`); a non-master login is kept to its own workspace.

**Next steps (Field Sales Manager):** Ghansawangi and Badnapur dealer networks and crop plans are generated to reconcile
with their ABPs (the mockups only detail Ambad); replace them when the client shares outlet masters. Zonal Manager and
Marketing Head personas follow the same pattern (persona id `pm` / `mh`, mockups already in `docs/mockups/`).

## Zonal Manager (persona `pm`, login PM001 / Product@123 or the master login)
| Phase | Scope | Status |
|---|---|---|
| 0 | Mockups (`docs/mockups/zonal-manager/`, 45), routes (`Z` in `src/routes.ts`), 7-item sidebar, persona switch, top bar (Marathwada zone scope, Crop nutrition portfolio), 26 screens with titles, Campaign Studio tabs, collateral steps and the Back/Next chain (`src/screens/zm/Blank.tsx`) | Done |
| 1 | Data (`src/data/zm.ts`, tested in `zm.test.ts`): zone territories (₹13.40 Cr ABP, read from BH), crop nutrition portfolio by category and territory (₹4.80 Cr → ₹6.00 Cr), territory plans (Ambad = FSM plan ₹3.80 Cr; statuses follow the FSM store), revised Ambad plan v2, Marketing Head questions, themes, Croptek evidence, concepts, proposition and claims, collateral, business case (C1 = BH Croptek; driver bridge; scenarios; C2), approval queue, impact, next-season findings. BH West now Ambad · Ghansawangi · Badnapur · Jafrabad · Bhokardan · Aurangabad (₹16.0 Cr / ₹14.2 Cr unchanged). FSM activity plan aligned to 13 units / ₹3.00 L (demonstrations ₹0.25 L, digital ₹0.35 L); the FSM store now starts with the Ambad plan submitted | Done |
| 2 | Screens 1–5 (`src/screens/zm/Plans.tsx`): My Performance (filters, Value / Growth views, category table, mix chart, previous-year effectiveness, portfolio notes); consolidated plans (Plans / Exceptions views, portfolio target reconciliation, statuses from the FSM store); SKU reconciliation (category × territory table, mapping checks, Validate mapping enabled when all checks pass, mapping correction drawer); plan validation (crop radios drive the planning detail, crop validation, saved review comments, correction drawer returns the plan, Endorse); revised plan (version 1 vs 2 with Changed markers, exception tracker, Marketing Head questions and clarification drawer, endorse and forward). ZM store holds decisions, mapping, checks, comments and responses | Done |
| 3 | Screens 6–9 (`src/screens/zm/Studio.tsx`): assigned themes (theme table, strategic brief, saved notes, brief and evidence drawer, clarification drawer with topics and history, acknowledge modal with deliverables and date → Acknowledged → concept studio); concept studio (Select / Edit inline with the edit pattern and leave guard / View rationale drawer, add concept, workspace); comparison (dimension table, decision radio stored and driving the Next label); proposition designer (editable proposition, clickable journey stages, intervention configuration drawer with KPI table and readiness checks, claims drawer with crop-stage suitability and technical review request). Shared `EditBar` and `LeaveGuard` in `src/screens/zm/parts.tsx` | Done |
| 4 | Screens 10–14 (`src/screens/zm/Collateral.tsx`): template gallery (preview, select) and draft configuration (required fields; Generate drafts the next version of that template and opens the editor); designer (page thumbnails, page rendered from the version, headline / body / Marathi / layout edits with the edit pattern and leave guard, Rewrite text cycles 3 prepared rewrites, Replace image picks prepared artwork, Save = new version, version history); version comparison (version selectors, side-by-side / overlay with change markers, changes table, Restore previous with confirmation, Submit for technical review); review tracker (6 items, Record reviewer approval, Release enabled only when all are approved); playbook (include toggles, release checklist, Publish → released; FSM My Campaigns shows the released assets). Artwork cropped once from the ZM.7a / 7b / 7c / 8 / 8a mockups by `scripts/crop-collateral.mjs` (headless Chrome canvas, no new dependency) into `src/assets/collateral/` | Done |
| 5 | Screens 15–19 (business case, scenarios, reconciliation, proposals, revision) | Next |
| 6–7 | Screens 20–21, 22–26 with drawers and modals; verification and deploy | Planned |

