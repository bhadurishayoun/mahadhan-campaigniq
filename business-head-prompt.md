# Mahadhan CampaignIQ — Build the Business Head persona from scratch (Claude Code)

You are building the **Business Head** workspace of Mahadhan CampaignIQ as a new, clean application. It must mirror the client's mockups screen for screen, follow the user journey they imply, and pass the hygiene rules below. Other personas (Marketing Head, Zonal Manager, Field Sales Manager) come later. Build the shell so they can be added without rework, but don't build them now.

---

## 0. Setup

- **New app:** `campaigniq-v3/` at the repo root (React 18 + TypeScript + Vite, react-router with hash routing, Recharts, lucide-react). No other UI libraries.
- **Deploy:** GitHub Pages under `/mahadhan-campaigniq/v3/`. The existing app keeps serving the root. Extend `.github/workflows/deploy.yml` so the Pages artifact contains the old build at `/` and the v3 build at `/v3/`.
- **Mockups:** the client mockups are in `campaigniq-v3/docs/mockups/business-head/` (PNG). Open each image before building its screen. The file names do NOT match the screen codes: use this map.

| Mockup file | Screen (route) |
|---|---|
| BH.1.png | 1 National Command Centre (`/bh/command-centre`) |
| BH.2.png | 2 Campaign Portfolio Performance (`/bh/portfolio`) |
| — (not in mockups) | 3 Regional Performance (`/bh/portfolio/region/:region`): designed in this prompt |
| BH.3.png | 4 Territory Performance (`/bh/portfolio/territory/:territory`) |
| BH.2a.png | 5 Campaign Effectiveness (`/bh/portfolio/region/:region/effectiveness`) |
| BH.2b.png | 6 Campaign Diagnostics (right drawer on screen 5) |
| BH.3a.png | 7 Marketing Investment & ROI (`/bh/investment`) |
| BH.3b.png | 8 Campaign Investment (`/bh/investment/region/:region`) |
| BH.3d.png | 9 Commercial Returns (`/bh/investment/region/:region/returns`) |
| BH.3e.png | 10 Reallocation Simulator (`/bh/investment/region/:region/reallocation`) |
| BH.4.png | 11 Market Opportunity (`/bh/themes/opportunity`) |
| BH.4b.png | 12 Theme Approval Inbox (`/bh/themes/inbox`) |
| BH.4c.png | 13 Theme Detailed Review (`/bh/themes/:themeId/review`) |
| BH.4d.png | 14 Theme Decision (modal on screen 13) |
| BH.4e.png | 15 Suggest Strategic Theme (`/bh/themes/suggest`) |
| BH.4f.png | 16 Recommendation Review & Submit (right drawer on screen 15) |
| BH.5.png | 17 Management Action Tracker (`/bh/interventions`) |
| BH.5a.png | 18 Intervention Request (right drawer on screen 17) |
| BH.5b.png | 19 Portfolio Learning & Next-Year Priorities (`/bh/interventions/learning`) |
| BH.6.png | 20 Decision Assistant (`/bh/assistant`) |

## How to work (token-efficient)
- First write `campaigniq-v3/CLAUDE.md` with sections 1–3 of this prompt (hygiene, design system, data rules), ≤80 lines. It is the standard for every later step.
- TodoWrite plan: (A) foundation, (B) screens 1–6, (C) screens 7–10, (D) screens 11–16, (E) screens 17–20, (F) verification and deploy. One phase per run; I'll `/clear` between phases.
- Look at each mockup image once, build the screen, move on. Grep, don't read whole files. `npm run build` + ≤5-line summary + commit after every phase.

---

## 1. Hygiene rules (non-negotiable; enforced by a check script in phase F)

1. **No placeholder language anywhere in the UI:** "Illustrative", "Illustrative Dataset", "Illustrative YTD", "Sample", "Demo", "Mock", "Synthetic", "Dummy", "Placeholder", "Lorem", "TBD", "V2". The data looks and reads as real.
2. **No AI wording or styling:** none of "AI", "Copilot", "Smart", "Intelligence", "Intelligent", "Insight" (as an AI label), "Generated", "Powered by", "Magic", "Auto-suggest"; no sparkle/wand icons, no gradient "AI" accents, no emoji.
   - The mockup "AI Copilot" becomes **Decision Assistant**.
   - "Market Opportunity Intelligence" becomes **Market Opportunity**.
   - "Strategic Intelligence & Decision Copilot" becomes **Decision Assistant**.
3. **No guidance or disclaimer text in screens.** Remove sentences that explain the tool, for example:
   - "Descriptive efficiency, not incremental acquisition cost…"
   - "Unspent budget is not automatically available…"
   - "Business Head suggested changes are recommendations only…"
   - "Creates a DRAFT subject to…"
   - "No decision sent or recorded yet"
   - "Theme approval does not authorize…"
   - the "Role Flow (Strategic → Execution)" strip
   - every "Sources: BH.5A · PM.8 …" row
   
   Status is shown with status chips and the workflow stepper instead.
4. **No screen codes in the UI:** no "BH.1", "→ BH.5", "MH.2", "PM.10C", "TM.IM1", no "READ-ONLY" chips. Buttons use plain names ("Marketing investment & ROI"). Codes may exist only in route constants.
5. **One consistent shell, typography and colour on every screen** (section 2). The mockups vary (some titles carry codes, some section headers are solid green bars, one top bar says "Reporting Period: YTD"). Normalise to the system: white card headers, "YTD through Feb 2027" everywhere, no codes.
6. **Sentence case** for headings, labels and buttons (proper nouns stay: Croptek, Mahadhan, ABP, ROI, region/crop names). Indian number format: ₹ L / ₹ Cr, en-IN grouping (1,860).
7. **Every number comes from the data module** (section 3). Nothing is hard-coded in JSX. Totals are computed and must reconcile.
8. **Cross-persona references** (Marketing Head, Zonal Manager and Field Sales Manager records) open a read-only evidence drawer inside the Business Head workspace, built from the same data. Never link to screens that don't exist yet.

## 2. Design system (match the mockups' look, made consistent)

- **Font:** Inter.
  - Page title 22/700 `#123D24`
  - Card title 14/700 `#123D24`
  - Body and table 13
  - Labels 12/600 `#4B5A53`
  - KPI value 22/700 tabular
  - Minimum 12px
- **Colours:**
  - brand `#1F6B3A`, dark `#123D24`, tint `#E3F1E7`, light green `#A9D5B5`
  - second series / attention `#E0A82E` (amber), soft amber `#FBF0DC`
  - risk `#C0392B` on `#FBE9E7`
  - neutral `#EEF1F0` / `#4B5A53`
  - lines `#E3E8E5`, canvas `#F5F7F6`, cards white
  - Planned / approved = `#1F6B3A` or `#A9D5B5`; observed / actual / recorded = amber or brand. Pick one mapping per chart type and keep it everywhere.
- **Shell:**
  - **Top bar (60px):** logo "Mahadhan CampaignIQ", persona selector ("Business Head", other personas listed but disabled), FY selector (FY 2026–27), scope selector (National portfolio / region), period selector (YTD through Feb 2027), help, notifications, avatar "BH".
  - **Left sidebar (232px):** National Command Centre · Campaign Portfolio Performance · Marketing Investment & ROI · Strategic Themes & Approvals · Strategic Interventions · Decision Assistant. Active item = tint background + 3px brand inset bar.
- **Page anatomy:** breadcrumb → title row (status chip on the right if any) → filter bar (labelled selects) → KPI row (icon tile + label + value + sub-line) → content cards → footer action bar (Back on the left, secondary buttons in the middle, one primary green button on the right).
- **Shared components:** `KpiCard`, `Card`, `DataTable` (light grey header, right-aligned numbers, amber-tinted total row, selected-row tint), `StatusChip` (ok / warn / neutral / risk / info), `ProgressCell`, `SegmentedControl`, `FilterBar`, `WorkflowStepper`, `Drawer` (right, 900px, dimmed page), `Modal`, `FooterBar`, chart wrappers (`GroupedBars`, `HBars`, `Waterfall`, `Donut`, `HeatGrid`).

## 3. Data (single module `src/data/bh.ts`; exact values from the mockups)

**National (FY 2026–27, YTD through Feb 2027)**
- ABP ₹50.0 Cr; achievement ₹42.8 Cr (85.6%)
- Marketing budget ₹2.50 Cr; actual ₹1.90 Cr (76%); unspent ₹60 L
- Active campaigns 12; recorded adopters 1,860; incremental sales and net ROI "Pending attribution"

**Regions**

| Region | ABP | Achieved | Campaigns | Planned / observed | Approved | Actual | Unspent | Adopters | ₹ per adopter |
|---|---|---|---|---|---|---|---|---|---|
| West | ₹16.0 Cr | ₹14.2 Cr | 4 | 82 / 76 | ₹90 L | ₹72 L | ₹18 L | 760 | ₹9,474 |
| South | ₹14.0 Cr | ₹11.8 Cr | 3 | 78 / 71 | ₹70 L | ₹54 L | ₹16 L | 490 | ₹11,020 |
| North | ₹11.0 Cr | ₹9.1 Cr | 3 | 74 / 68 | ₹55 L | ₹39 L | ₹16 L | 370 | ₹10,541 |
| East | ₹9.0 Cr | ₹7.7 Cr | 2 | 70 / 66 | ₹35 L | ₹25 L | ₹10 L | 240 | ₹10,417 |

National totals: 76% planned / 70% observed execution, ₹10,215 per adopter.

**Themes**

| Theme | Campaigns | Investment | Adopters | Learning direction |
|---|---|---|---|---|
| Conversion & Adoption | 4 | ₹64 L | 720 | Refine |
| Retailer Enablement | 3 | ₹48 L | 460 | Validate |
| Trial & Follow-up | 3 | ₹50 L | 420 | Redesign |
| Crop Nutrition Awareness | 2 | ₹28 L | 260 | Assess |

Region × theme counts (Conversion / Retailer / Trial / Awareness): West 2/1/1/0, South 1/1/0/1, North 1/0/1/1, East 0/1/1/0.

**West campaigns**

| Campaign | Planned / observed | Adoption target | Adopters | Approved | Actual | Unspent |
|---|---|---|---|---|---|---|
| Retailer-led Croptek conversion | 80 / 72 | 250 | 180 | ₹12 L | ₹9 L | ₹3 L |
| Product adoption drive | 84 / 80 | 300 | 260 | ₹28 L | ₹23 L | ₹5 L |
| Retailer enablement | 82 / 76 | 250 | 180 | ₹28 L | ₹22 L | ₹6 L |
| Trial & follow-up | 82 / 76 | 200 | 140 | ₹22 L | ₹18 L | ₹4 L |

- **West totals:** 1,000 target, 760 adopters, 76% adoption achievement, ₹9,474 per adopter.
- **Croptek business case:** forecast incremental sales ₹48 L, variable costs 65% (₹31.2 L), contribution 35% (₹16.8 L), investment ₹12 L, forecast net return ₹4.8 L, forecast net ROI +0.40×. Other campaigns: "Business case pending".

**Ambad (Jalna) territory**
- All-product ABP ₹4.20 Cr; activities 9 / 13 (69.2%); adopters 72; trials 160; trial-to-adoption 45.0%; campaign-linked sales ₹5.4 L (provisional)
- Onion all-product ABP ₹1.90 Cr
- Villages: Dhanora 24 / 62 = 38.7%, Wadi Gaon 48 / 98 = 49.0%; gap 10.3 pp
- Interventions: demonstrations 3/4, retailer activation 2/3, farmer meetings 2/3, digital advisory 1/1, follow-ups 1/2

**Market and themes**
- Business gaps: West ₹1.8 Cr, South ₹2.2 Cr, North ₹1.9 Cr, East ₹1.3 Cr (total ₹7.2 Cr)
- Maharashtra penetration 14–18%
- Theme queue: Croptek conversion — next season (West / Maharashtra, Onion / Croptek, High, review pending); Multi-region retailer advocacy (High, review pending); North region crop nutrition awareness (Medium, clarification requested)
- Interventions register: the 4 items in BH.5.png with their triggers and statuses
- Reallocation default: ₹2 L from Trial & follow-up to Retailer-led Croptek conversion

**Region detail for screen 3 (not in mockups).** West territories with ABP / YTD sales:

| Territory | ABP | YTD sales | Campaigns | Activities | Adopters |
|---|---|---|---|---|---|
| Ambad (Jalna) | ₹4.20 Cr | ₹3.62 Cr | 2 | 9 / 13 | 72 |
| Jalna | ₹3.80 Cr | ₹3.15 Cr | 1 | — | — |
| Aurangabad | ₹4.60 Cr | ₹4.02 Cr | 1 | — | — |
| Nashik | ₹3.40 Cr | ₹3.41 Cr | 0 | — | — |

Sum = ₹16.0 Cr ABP / ₹14.2 Cr YTD. Unknown cells show "Pending".

**Validation (unit test `bh.test.ts`):** regions sum to national (ABP, achievement, budget, actual, adopters, campaigns); themes sum to national; region × theme sums to 12; West campaigns sum to West; every percentage recomputes from its parts.

---

## 4. Screens (build each to mirror its mockup; changes vs mockup noted)

1. **National Command Centre**
   - Filters: region, crop, product, theme, campaign.
   - 6 KPIs: business vs YTD ABP, marketing investment vs approved, active campaigns, recorded adoption, validated incremental sales, portfolio net ROI.
   - Region-wise table with achievement chip, execution bar, View.
   - Row of 3 cards: planned vs observed grouped bars; theme approval queue; management attention list (4 computed alerts).
   - Footer: View campaign portfolio · View investment & ROI · Review strategic themes · primary "Suggest new strategic theme".
   - Region "View" → screen 3.
2. **Campaign Portfolio Performance**
   - Analytical view segmented control: theme / crop / product / geography. Each view changes the table grouping; the theme view is the mockup.
   - 4 KPIs; theme table with total; region × theme heat grid; adopters-by-theme bars.
   - Footer: Back · Regional performance · Campaign effectiveness · primary Investment & ROI.
3. **Regional Performance (new):**
   - 4 KPIs: region achievement, campaigns, planned / observed, adopters.
   - Territory table (row → screen 4); planned vs observed by campaign; adopters by campaign.
   - Same anatomy as screen 4.
4. **Territory Performance (Ambad):** as BH.3.png. KPIs, crop × product table ("SKU mapping pending" chips), campaign-linked sales card, village trial-to-adoption bars with gap, intervention execution bars, strategic opportunities table.
5. **Campaign Effectiveness (West):**
   - As BH.2a.png: scorecard with adoption achievement bars, target vs recorded bars, selected-campaign commercial effectiveness strip and evidence chips.
   - Selecting a scorecard row changes the commercial strip.
   - "Campaign diagnostics" opens screen 6.
6. **Campaign Diagnostics (drawer):** as BH.2b.png. KPIs (−8 pp, 70 shortfall, 75%), variance table, driver matrix, target achievement bars. Primary "Request strategic intervention" opens screen 18 prefilled.
7. **Marketing Investment & ROI:** as BH.3a.png. Analytical view control; regional table with utilisation bars; approved vs actual bars; investment per adopter (highlight the highest); financial status chips.
8. **Campaign Investment (West):** as BH.3b.png. Allocation stacked bars (actual + unspent); reallocation readiness.
9. **Commercial Returns (West):** as BH.3d.png. Return matrix with the selected campaign; forecast waterfall (computed from the business case); business case metrics; attribution readiness.
10. **Reallocation Simulator:**
    - As BH.3e.png, fully interactive. From / to selects, ₹ slider (0 to the "from" campaign's unspent), scenario name.
    - The table, chart and checks recalculate live. Net adjustment stays ₹0.
    - Save scenario → local store + toast. "Approve reallocation" stays disabled until finance validation.
    - Primary: "Request Marketing Head & Finance review" creates an intervention (screen 17 register).
11. **Market Opportunity:** as BH.4.png. Gap table (row select drives the opportunity card), gap bars, crop × product × geography tiles, theme candidates with Select (→ screen 15 prefilled).
12. **Theme Approval Inbox:** as BH.4b.png. Status KPIs, queue (row select updates the evidence, readiness and brief cards), workflow stepper. Primary "Review selected theme".
13. **Theme Detailed Review:** as BH.4c.png. Header facts, alignment table (View → evidence drawer), theme review, readiness checklist, prior-evidence bars.
14. **Theme Decision (modal):**
    - As BH.4d.png. Proposal vs recommended direction table, checklist, decision radio (Approve / Return with modifications / Request clarification / Reject), comments, recipient, version, stepper.
    - The primary button label follows the radio choice, e.g. "Return theme to Marketing Head" or "Approve theme".
    - Submitting updates the queue status, the stepper and the tracker.
15. **Suggest Strategic Theme:** as BH.4e.png. Configuration form, proposed success measures (editable targets), existing theme alignment with link option, recipient and deliverable, stepper. Primary opens screen 16.
16. **Recommendation Review & Submit (drawer):** as BH.4f.png. Submit → status "Sent", toast, new tracker item.
17. **Management Action Tracker:** as BH.5.png. KPIs, category filter chips, register (row select updates the detail card), status donut. Primary "Review strategic intervention" opens screen 18.
18. **Intervention Request (drawer):** as BH.5a.png. Business trigger table, configuration, deliverables, stepper. Submit → status "Sent", counts update.
19. **Portfolio Learning & Next-Year Priorities:** as BH.5b.png. Theme learning table with selectable rows, investment share vs adoption share bars (computed), priority matrix with selection, target FY, recipient, status. "Submit for Marketing Head assessment".
20. **Decision Assistant:**
    - As BH.6.png, renamed. Question box, prepared questions, answers built deterministically from the data module (no external model): investigation priorities table, Ambad reference bars, current-context panel, next steps.
    - Each answer row links to its screen.
    - Primary "Create draft strategic recommendation" → screen 15 prefilled.

**Navigation map (every button must go exactly here; no button without a target):**

| Screen | Back | Secondary buttons | Primary | Other links |
|---|---|---|---|---|
| 1 Command Centre | — | Portfolio (2) · Investment & ROI (7) · Theme inbox (12) | Suggest new theme (15) | Region View → 3; queue row → 13; each attention item → its screen (West lag → 5, North adoption → 3 North, themes → 12, ROI → 9) |
| 2 Portfolio | 1 | Investment & ROI (7) | Regional performance (3, region from filter, default West) | Heat-grid cell → 3 for that region |
| 3 Regional | 2 | Territory (4) | Campaign effectiveness (5) | Territory row → 4 |
| 4 Territory | 3 | Effectiveness (5) · Market opportunity (11) | Suggest theme (15, prefilled with territory, crop, product) | — |
| 5 Effectiveness | 3 | Diagnostics (6) · Attribution evidence (evidence drawer) | Campaign investment (8, same region) | — |
| 6 Diagnostics drawer | close → 5 | Territory (4) · Campaign investment (8) · Suggest revised theme (15, linked to the campaign) | Request intervention → 17 with drawer 18 open, prefilled | — |
| 7 Investment & ROI | 1 | ROI evidence (evidence drawer) | Campaign investment (8, region from filter) | Region row View → 8 |
| 8 Campaign investment | 7 | Effectiveness (5) · Simulate reallocation (10) | Commercial returns (9) | — |
| 9 Returns | 8 | Business case · Attribution evidence (both evidence drawers) | Simulate reallocation (10) | — |
| 10 Reallocation | 9 | Reset · Save scenario | Request MH & Finance review → 17, new "Investment" item selected | — |
| 11 Opportunity | 1 | Territory (4) · Theme inbox (12) | Suggest theme (15) | Candidate Select → 15 prefilled |
| 12 Inbox | 11 | Suggest new theme (15) | Review selected theme (13) | No approve, reject or clarify actions here: decisions happen only in 14, after review |
| 13 Review | 12 | Source evidence (evidence drawer) | Theme decision (14) | — |
| 14 Decision modal | close → 13 | View original · Save draft | Label follows the chosen option; submit → 12 with status updated and a toast | — |
| 15 Suggest | 11 | Opportunity evidence · Save draft | Review recommendation (16) | — |
| 16 Submit drawer | close → 15 | Linked theme · Save draft | Submit → 17, new "Strategic theme" item selected | — |
| 17 Tracker | 1 | Linked campaign (5) · Portfolio learning (19) | Open selected intervention (18 for that item) | — |
| 18 Intervention drawer | close → 17 | Linked campaign (5) · Save draft | Submit → status "Awaiting response", KPI counts update | — |
| 19 Learning | 17 | Campaign evidence · Save draft | Submit for MH assessment → 17, new item | — |
| 20 Assistant | 1 | Source evidence · Request market assessment | Create draft recommendation (15 prefilled) | Every answer row → its screen |

- The sidebar "Strategic Themes & Approvals" opens 12 (Inbox), which has a tab link to 11.
- Sidebar "Strategic Interventions" opens 17.
- One workflow stepper set, with identical labels wherever it appears:
  - **Theme review (12, 14):** Proposal submitted → Business Head review → Decision → Marketing Head assignment → Campaign development
  - **Theme suggestion (15, 16):** Business Head draft → Marketing Head assessment → Refined theme → Business Head approval → Campaign development
  - **Intervention (18):** Intervention draft → Marketing Head assessment → Recovery plan → Business Head review → Action tracking
- Drill-downs keep their scope: a region chosen on 2, 3 or 7 stays chosen on 5, 8, 9 and 10, and the top-bar scope updates to match.

**Flow and state:**
- Keep a `useBhStore` (Zustand-free: React context + localStorage) for theme decisions, scenarios, interventions and recommendations, so actions on one screen show up on the others (queue, tracker, KPIs, management attention).
- Filters and scope (top bar) drive the data on every screen.
- Breadcrumbs reflect the path.
- Browser back works.

---

## 5. Phase F: verification (must pass) and deploy
- `npm run test` (data reconciliation) and `npm run build` with 0 errors.
- `node scripts/hygiene.mjs` greps `src/` for the banned words in rule 1 and rule 2 (case-insensitive, whole words), screen-code patterns `\b(BH|MH|PM|TM|ZM|FSM)\.\d`, "Sources:" and "READ-ONLY". Expect 0 hits. It also flags hex colours outside `theme.ts` and font sizes below 12px.
- Playwright click-through: follow every row of the navigation map and assert the target route, drawer or modal opens with the right prefill. Assert there are 0 buttons without a handler.
- Playwright at 1440×900 and 1366×768 over every route: 0 console errors, no horizontal scroll, no text overflow; every drawer and modal opens and closes. Save screenshots to `docs/screens/` and compare each side by side with its mockup: same structure and content.
- Commit: "Business Head persona (v3) built from client mockups" → push → confirm the Pages deploy; the URL is `…/mahadhan-campaigniq/v3/#/bh/command-centre`.
