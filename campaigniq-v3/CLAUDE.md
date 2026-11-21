# CampaignIQ v3 — working rules (Business Head first; other personas later in the same shell)

Source of truth: `docs/mockups/business-head/*.png` (client-approved; file names ≠ screen codes, see `src/routes.ts`)
and `../business-head-prompt.md`. Open each mockup once before building its screen.

## 1. Hygiene (checked by `npm run hygiene`; must report 0)
1. No placeholder language: Illustrative, Sample, Demo, Mock, Synthetic, Dummy, Placeholder, Lorem, TBD, V2.
2. No AI wording or styling: AI, Copilot, Smart, Intelligence, Intelligent, Insight (as label), Generated, Powered by,
   Magic, Auto-suggest; no Sparkles/Wand icons, no gradients, no emoji. Exception: the exact name **AI Copilot workspace**
   (client decision); "National Command Centre" is now **Marketing and Command Centre**;
   "Market Opportunity Intelligence" → **Market Opportunity**.
3. No guidance or disclaimer sentences, no "Sources: …" rows, no role-flow strips. Status = StatusChip + WorkflowStepper.
4. No screen codes in UI text (BH.1, MH.2, PM.10C, TM.IM1 …), no "READ-ONLY" chips. Codes live only in `routes.ts`.
5. One shell, one type scale, one palette on every screen; white card headers (no solid green bars); period label is
   always "YTD through Feb 2027".
6. Sentence case for headings, labels, buttons (keep proper nouns: Croptek, Mahadhan, ABP, ROI, place names).
   ₹ L / ₹ Cr with at most 2 decimals; en-IN grouping (1,860). Min font 12px.
7. Every number comes from `src/data/bh.ts`; totals computed there and reconciled by `bh.test.ts`. No numbers in JSX.
8. Cross-persona records (Marketing Head, Zonal Manager, Field Sales Manager) open the read-only `EvidenceDrawer`
   inside the Business Head workspace. Never link to screens that don't exist.
9. No canvas gaps: cards in a row are equal height; stacked columns stretch to the row's bottom edge.
10. Every button has a target (see navigation map in the prompt). No dead buttons.
11. Sign-in page (`src/auth/login.tsx`, `login.css`) is copied unchanged from the v2 app and is exempt from rules 1–2;
    do not edit it. Master login MASTER001 / Mahadhan@2026 opens every persona.

## 2. Design system (`src/theme.ts` holds every hex; CSS uses the `--` variables from `styles.css`)
- Font Inter. Page title 22/700 dark · card title 14/700 dark · body/table 13 · label 12/600 neutral-ink ·
  KPI value 22/700 tabular.
- Colours: brand #1F6B3A, dark #123D24, tint #E3F1E7, light green #A9D5B5, amber #E0A82E, soft amber #FBF0DC,
  risk #C0392B on #FBE9E7, neutral #EEF1F0 / #4B5A53, lines #E3E8E5, canvas #F5F7F6, cards white.
- Chart mapping (fixed everywhere): planned / approved / target = brand (#1F6B3A) or light green (#A9D5B5 when the
  other series is brand); observed / actual / recorded = amber (#E0A82E).
- Shell: 60px top bar (logo, persona selector — others disabled, FY, scope, period, help, notifications, avatar);
  232px sidebar (6 items; active = tint + 3px brand inset bar).
- Page anatomy: breadcrumb → title row (+ status chip) → FilterBar → KPI row → cards → FooterBar
  (ONLY Back left and Next right — Next follows the screen order; other actions live in card headers).
  Drawers and modals: PanelFooter = Back left + the panel's one action right.
- Components only from `src/ui/`: KpiCard, Card, DataTable, StatusChip, ProgressCell, SegmentedControl, FilterBar,
  WorkflowStepper, Drawer (right, 900px), Modal, FooterBar, EvidenceDrawer, charts (GroupedBars, HBars, Waterfall,
  Donut, HeatGrid).

## 3. Data and state
- `src/data/bh.ts`: national, regions, themes, region × theme, West campaigns, Croptek business case, Ambad,
  market/themes, interventions, West territories. Values exactly as the prompt; derived values computed.
- `src/store/bhStore.tsx`: React context + localStorage for theme decisions, scenarios, interventions,
  recommendations, scope. Actions on one screen must show on the others (queue, tracker, KPIs, attention list).
- Filters and top-bar scope drive data; a region chosen on a drill-down stays chosen downstream.

## Workflow
- Phases: A foundation · B screens 1–6 · C 7–10 · D 11–16 · E 17–20 · F verification + deploy.
- After each phase: `npm test`, `npm run build`, `npm run hygiene`, update READMEs (root + this app), commit.
- Verify visually with headless Chrome over CDP (Chrome is installed; Playwright is not).
