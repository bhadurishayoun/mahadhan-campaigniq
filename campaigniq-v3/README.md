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
| C | Screens 7–10: Investment & ROI, Campaign investment, Commercial returns, Reallocation simulator | To do |
| D | Screens 11–16: Market opportunity, Theme inbox, Theme review, Decision modal, Suggest theme, Submit drawer | To do |
| E | Screens 17–20: Action tracker, Intervention drawer, Portfolio learning, Decision Assistant | To do |
| F | Click-through of the navigation map, 1440×900 and 1366×768 checks, side-by-side with mockups, deploy | To do |

Known gaps until C–E land: buttons that target screens 7–20 fall back to the command centre.
Crop-wise and product-wise portfolio views use breakdowns defined in `bh.ts` (they reconcile to the national totals;
the mockups show only the theme view).
