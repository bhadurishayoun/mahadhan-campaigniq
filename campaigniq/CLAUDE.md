# CampaignIQ — working rules

## Consistency system (supersedes earlier rules on titles, KPIs, charts, filters, footers)
Keep the look: white sidebar + green active item, existing top bar, tokens in `design-system.css`, Inter. No new colours,
fonts or npm libs; never change calculations, data or routes; `login.css` untouched. Components live in `web/src/ui/system.tsx`
(+ `system.css`), charts in `web/src/ui/viz.tsx`, chart config in `web/src/chartTheme.ts`, filters in `web/src/ui/filters.tsx`.
1. **SectionTitle**: green "N." + UPPERCASE title (13/700, .05em) + " — {context from active filters}" (grey) + one muted
   13px subtitle. Numbers come from a CSS counter per page (reading order); never hard-code them; n={0} = unnumbered.
2. **Metric**: 32px icon tile (brand-100) + UPPERCASE label 12/600 → value 24/700 tabular → delta "▲/▼ value comparator"
   (12, ok/risk). Comparator: BH/MH "vs LY", ZM "vs ABP", FSM "vs plan". No comparator data → muted 12px note instead.
   **KpiStrip** = 4–6 Metrics, `repeat(auto-fit,minmax(190px,1fr))`, gap 16, one strip per page.
3. **Charts** (viz.tsx only, styled from `chartTheme`): RankedBars, GroupedColumns, TrendLine, DonutMetric, HeatGrid, map.
   12px axis text, dashed grid `3 3`, square 14px bars, bold value + grey share at bar end, legend top-right only if >1
   series, Planned = `--data-plan`, Actual/Observed = `--data-actual`.
4. **InsightStrip**: every chart card ends with divider + Sparkles + "**Insight:** one factual sentence" (13px). Use the
   screen's existing insight text. No floating insight boxes.
5. **Card**: white, 1px line, radius 10, sh-1, padding 18px 20px, gap 14. No coloured header bars or persona card classes.
   Layout grids `cq-grid2` (minmax 420px) / `cq-grid3` (minmax 320px), gap 16.
6. **Page frame**: top bar → `Page` (PageHeader: title 22/700 brand-900, one-line subtitle, filter chips right; no
   synthetic-data badge) → `NumberedTabs` for sub-screens → body padding 20px 28px, gap 16.
7. **Filters**: only in the sidebar box under the logo (`SidebarFilters`, fields per persona in `filters.tsx`), shared
   state via `useSideFilters()`; chips and section-title context read from it. No selects in top bars or page bodies.
8. **ActionCard** ("Next best actions"): icon tile + 14/600 title + 13px detail + green "Open … →"; grid minmax 220px.
9. **Page ending**: keep the Back control and functional action buttons; remove "Next steps" labels, guided next-copy,
   synthetic/source/date footers, and duplicate footer content from every route.
10. **Tables** (`cq-table`): 12px UPPERCASE header on grey band, 14px cells, numbers right, one value per cell (secondary
    as 12px caption), bold totals row, status as `StatusPill` (ok/warn/neutral/risk).
11. **Numbers**: ₹ crore/lakh and × multiples always 2 decimals; nothing ever shows >2 decimals; one value per cell.
12. **Text**: ≥12px; sentence case except section titles and metric/table labels; ₹ via fmtINR; no emoji; Sparkles only
    for insights/AI.

## Rollout (one phase per run; /clear between)
- [x] A — components + BH.2 and TM.1 rebuilt as proof
- [x] B — frame + sidebar filters on every route (App owns frame; persona wrappers use PersonaHeader + tabsFor)
- [x] C — kit components re-implemented on the system (Panel/Box/BhCard/ChartCard → Card; Kpi/KpiCard/Strip/Metrics
      → MetricTile; HBars/VBars/Bars/Donut/RankedBarChart → viz with auto insight; footers → StepsPortal)
- [ ] D — consistency greps + headless-Chrome checks at 1366px (no Playwright installed; use CDP like `.scratch/cdp.mjs`)
- [ ] E — release screenshots to `docs/release-screens/`, build, commit, push, confirm Pages deploy

Working mode: Grep/Glob, never read whole large files; bulk edits via scripts; `npx vite build` + commit after each phase.
Note: `docs/ui-reference/*.html` were never added to the repo; Phase A followed this spec + the WeedIntel exec page.
