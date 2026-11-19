# Screen data inventory

Generated from TS/TSX source by `server/scripts/inventory_screen_data.py`.

## App.tsx
- Source: `App.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: BH_TAB_ICONS, DEFAULT_FILTERS, FILTER_LABELS, JALNA_ONION, MH_REGION_STATES, MH_TAB_ICONS, MODULE_ICONS, NATIONAL, PM_TAB_ICONS, REGISTRY, TM_TAB_ICONS
- Entities: regions, states, districts, territories, products, crops, themes, campaigns, people
- Fields referenced: crop, name, period, target
- Story values: none detected

## bh/nav.ts
- Source: `bh/nav.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: BH_SCREENS, BH_TABS
- Entities: regions, territories, themes, campaigns
- Fields referenced: none detected
- Story values: none detected

## bh.1, bh.10, bh.2, bh.3, bh.3a, bh.4, bh.5, bh.5a, bh.5b, bh.5c, bh.6, bh.7, bh.7a, bh.7b, bh.8, bh.9, bh.9a
- Source: `bh/screens.tsx`
- Datasets: portfolio.campaigns
- Data imports: none
- Inline arrays/objects: BH_FACTS
- Entities: regions, states, districts, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: abp, actual, adopters, crop, investment, investment_lakh, name, observed, observed_pct, period, planned, planned_pct, product, quarter, region, roi, state, status, target, theme
- Story values: ₹16.0 Cr, ₹14.2 Cr, 88.8%, ₹72 L, ₹14.0 Cr, ₹11.8 Cr, 84.3%, ₹54 L, ₹11.0 Cr, ₹9.1 Cr, 82.7%, ₹39 L

## chartTheme.ts
- Source: `chartTheme.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: CROP, PRODUCT, SEGMENT, SERIES, STATUS
- Entities: products, crops
- Fields referenced: none detected
- Story values: ₹4.2 L, ₹1.9 Cr

## data/copilot.ts
- Source: `data/copilot.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: BROWSER_STATUS, FREE_ENDPOINTS
- Entities: campaigns, people
- Fields referenced: status
- Story values: none detected

## data/datasets.ts
- Source: `data/datasets.ts`
- Datasets: portfolio.campaigns
- Data imports: none
- Inline arrays/objects: none detected
- Entities: regions, states, districts, products, crops, themes, campaigns
- Fields referenced: crop, district, name, season, status
- Story values: none detected

## data/reference.ts
- Source: `data/reference.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ALL, BUNDLED_REFERENCE
- Entities: states, districts, products, crops, campaigns
- Fields referenced: crop, district, name, season
- Story values: none detected

## icons.ts
- Source: `icons.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ICON
- Entities: none detected
- Fields referenced: none detected
- Story values: none detected

## login.tsx
- Source: `login.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: PERSONA_ICON
- Entities: campaigns, people
- Fields referenced: target
- Story values: none detected

## map/IndiaDistrictMap.tsx
- Source: `map/IndiaDistrictMap.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MAP_TONES
- Entities: states, districts
- Fields referenced: district, name, state, taluka, target
- Story values: 50%, 100%, 1 / 1

## mh/charts.tsx
- Source: `mh/charts.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MH_CHARTS, REGIONS
- Entities: regions, states, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: crop, name, objective, observed, planned, product, region, status, target, theme
- Story values: 20%, 13%, 10%, 15%, INR 40L, INR 43L, INR 45L, INR 48L, INR 1.76 Cr, ₹7, 18%, ₹5

## mh/filtering.ts
- Source: `mh/filtering.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MARKET_PULSE
- Entities: regions, states, products, crops
- Fields referenced: crop, product, region
- Story values: none detected

## mh/index.tsx
- Source: `mh/index.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: REGISTRY
- Entities: people
- Fields referenced: none detected
- Story values: none detected

## mh/nav.ts
- Source: `mh/nav.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MH_IDS, MH_SCREENS, MH_TABS
- Entities: regions, territories, products, crops, themes, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## MH.9C, MH.9D
- Source: `mh/screens.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: CORE_ROWS, SCREEN_INSIGHTS, SCREEN_METRICS
- Entities: regions, states, districts, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: crop
- Story values: ₹1.90 Cr, ₹40L, ₹48L, 18%, ₹7, 50%, ₹100, ₹80, 20%

## nav.ts
- Source: `nav.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MODULES, PERSONAS, SCREENS
- Entities: regions, districts, territories, villages, crops, themes, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## personaAuth.ts
- Source: `personaAuth.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: MASTER_CREDENTIAL, PERSONA_CREDENTIALS
- Entities: regions, territories, products, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## PM.9, PM.9B
- Source: `pm/approvals.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: CORRECTIONS, EXCEPTIONS
- Entities: regions, states, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: activity, budget, name, status, units, village
- Story values: ₹3 L, ₹12 L, ₹1.05 L, 50%, ₹3.00 L

## PM.8, PM.8A, PM.8B, PM.8C, PM.8D, PM.8F
- Source: `pm/business.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ASSUMPTIONS, RETURNED
- Entities: regions, states, territories, products, crops, themes, campaigns, people
- Fields referenced: name, roi, sales, status, target
- Story values: ₹12 L, 35%, 36%, ₹48 L, ₹16.8 L

## pm/charts.tsx
- Source: `pm/charts.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: PM_CHARTS, PM_DRAWER_CHARTS, PM_PULSE
- Entities: regions, states, districts, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: abp, product
- Story values: 86 / 100, 86%, 78 / 100, 78%, 71 / 100, 71%, 10%

## PM.7, PM.7A, PM.7B, PM.7C, PM.7D, PM.7E
- Source: `pm/collateral.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ASSET_STAGES, CHANGES, REVIEW_ROWS
- Entities: states, products, crops, themes, campaigns, people
- Fields referenced: name, owner, status
- Story values: 30%, 36%, 38%, 12%, 34%, 18%, 48%, 10%, 4%, 26%, 22%

## pm/data.ts
- Source: `pm/data.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ACTIVITIES, ACTIVITY_TOTAL, AMBAD, C1, C2, CLAIMS, COLLATERALS, CROP_PLAN, DHANORA, EVIDENCE, IMPACT, JOURNEY, LOCAL_PLAN, PORTFOLIO, PORTFOLIO_TOTAL, SCENARIOS, THEME, VILLAGES
- Entities: regions, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: none detected
- Story values: ₹4.20 Cr, ₹3.80 Cr, ₹0.40 Cr, ₹40 L, ₹1.65 Cr, 50%, ₹100 , ₹80, ₹1.10 Cr, ₹1.05 Cr, ₹1.90 Cr

## PM.10, PM.10A, PM.11, PM.11D
- Source: `pm/impact.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: LEARNINGS, PM_FACTS, QUESTIONS
- Entities: regions, states, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: abp, activity, adopters, budget, crop, name, objective, planned, product, roi, sales, status, territory, units, village
- Story values: ₹6.00 Cr, 50%, ₹3 L, 36%, 1 / 2, 2 / 3, ₹12 L

## pm/index.tsx
- Source: `pm/index.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: REGISTRY
- Entities: themes, people
- Fields referenced: none detected
- Story values: none detected

## pm/kit.tsx
- Source: `pm/kit.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: PM_PULSE
- Entities: states, products, crops, people
- Fields referenced: name, state, status
- Story values: 45%, 65%, 100%, 82%, 64%, 71%

## pm/nav.ts
- Source: `pm/nav.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: PM_IDS, PM_SCREENS, PM_TABS
- Entities: territories, villages, products, crops, themes, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## PM.1, PM.2, PM.2A, PM.3, PM.3C
- Source: `pm/reviews.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: COMPARISON, EXCEPTIONS, MH_QUESTIONS, SKU_ROWS, TERRITORIES
- Entities: states, territories, villages, products, crops, themes, campaigns, people
- Fields referenced: abp, crop, product, status, territory
- Story values: ₹4.80 Cr, ₹6.00 Cr, 25%, ₹1.20 Cr, 25.0%, 100%, 94%, ₹0.62 Cr, ₹0.80 Cr

## PM.5, PM.5C, PM.6
- Source: `pm/studio.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: COMPARE_ROWS, CONCEPTS
- Entities: regions, states, villages, products, crops, themes, campaigns, people
- Fields referenced: name, objective
- Story values: 50%

## PM.4
- Source: `pm/themes.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: DELIVERABLES, TOPICS
- Entities: regions, states, products, crops, themes, campaigns, people
- Fields referenced: name, objective, status
- Story values: 50%, 36%, ₹25 L, ₹4.20 Cr

## screens/ai.tsx
- Source: `screens/ai.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ANSWERS, INITIAL_HISTORY, LEVEL_TONE, MATCHERS, RECOMMENDED, SIGNALS, SUGGESTED
- Entities: villages, products, crops, campaigns, people
- Fields referenced: owner, target
- Story values: 32%, 68%, 69%, 58%, 55%

## P.1, P.2, P.3
- Source: `screens/prototype.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: CHECK_TONE, DEMO_PATH, FEATURES, ROADMAP, SEGMENT_TONE, STATUS_META, STATUS_TONE, WORKFLOW_STEPS
- Entities: regions, states, districts, territories, products, crops, campaigns, people
- Fields referenced: activity, budget, district, name, objective, planned, state, status, target
- Story values: 100%

## screens/s1.tsx
- Source: `screens/s1.tsx`
- Datasets: portfolio.campaigns
- Data imports: none
- Inline arrays/objects: CAMPAIGNS, DEPENDENCIES, IMPACT_GROUPS, IMPACT_SERIES, RISKS, SCENARIOS, STAGE_TONE, STATE_INFO, STATE_TONE, TIMELINE
- Entities: regions, states, districts, territories, villages, products, crops, campaigns, people
- Fields referenced: crop, name, objective, roi, status, target
- Story values: ₹2.9 Cr, 51%, ₹5.8 Cr, 42%, ₹4.1 Cr, 46%, ₹2.6 Cr, 44%, ₹3.9 Cr, 38%

## screens/s2.tsx
- Source: `screens/s2.tsx`
- Datasets: atlas.taluka_ranking, atlas.top_markets
- Data imports: none
- Inline arrays/objects: COHORTS, COMPETITORS, HOTSPOTS, HOTSPOT_LEGEND, INFLUENCE, INSIGHTS, JALNA_TALUKA_MAP, OUTCOMES, PLAYBOOK, PRIO, PRIORITY_VILLAGES, QUADS, SEGMENT_ROWS, SHORTLIST, STOCK, STRATEGIES, SWITCHING_BARRIERS, TALUKAS, TIMELINE, TOP_MARKETS
- Entities: states, districts, villages, products, crops, campaigns, people
- Fields referenced: name, product, roi, state, status, taluka, target, village
- Story values: ₹2.4 Cr, ₹1.8 Cr, ₹1.6 Cr, ₹1.1 Cr, ₹1.0 Cr, 46%, 52%, 62%, 70%

## screens/s3.tsx
- Source: `screens/s3.tsx`
- Datasets: nutrition.triggers
- Data imports: none
- Inline arrays/objects: CAMPAIGNS, DISTRIBUTION, INITIAL_INPUTS, INITIAL_ROWS, INTERVENTION_ICONS, LOGIC_STEPS, OBJECTIVE_OPTIONS, PRODUCT_OPTIONS, READINESS, STAGES, STAGE_OPTIONS, TRIGGERS, TRIGGER_ICONS, VALIDATION_LABEL, WINDOW_OPTIONS
- Entities: states, villages, products, crops, campaigns, people
- Fields referenced: campaign, name, objective, product, state, status, target
- Story values: 56%, 85%, 58%, 60%, 29%, 17%, 24%, 25%

## screens/s4.tsx
- Source: `screens/s4.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ACTIVITIES, BARRIERS, EXEC_MONTHS, EXEC_ROWS, GANTT_MONTHS, GANTT_ROWS, PORTFOLIO, SAVED_TEMPLATES, SCENARIO_LABEL, STATUS_TONE, TEMPLATES, WIZARD_STEPS
- Entities: regions, states, villages, products, crops, campaigns, people
- Fields referenced: adopters, budget, name, objective, owner, roi, status, target
- Story values: 1832 / 74, 8 / 74, 6 / 32, 5 / 8, ₹8.0 L, 7632 / 100, ₹52 L, 34%, 46/74, ₹8 L, ₹0.40 L

## screens/s5.tsx
- Source: `screens/s5.tsx`
- Datasets: readiness.cluster_supply, readiness.dealers, readiness.stock_heatmap, readiness.village_demand
- Data imports: none
- Inline arrays/objects: ACTIONS, BASE, CALLOUTS, CAMPAIGN_ITEM, CLUSTERS, CLUSTER_PLACE, DEALERS, HEAT_ROWS, PHASES, QUADS, SCENARIOS, SKU_BASE, STOCK_COLOR, STOCK_ROWS, TIMELINE, VILLAGE_BASE
- Entities: regions, states, villages, products, crops, campaigns, people
- Fields referenced: adopters, name, owner, state, status, target, village
- Story values: ₹8.00 L, ₹52 L, 29%, 100%, ₹13.7 L, ₹8.0 L, 56%, 51%, 32%, 17%

## screens/s6.tsx
- Source: `screens/s6.tsx`
- Datasets: orchestration.owners
- Data imports: none
- Inline arrays/objects: ALERT_ROWS, ATTENDANCE, CLUSTERS, COLUMNS, COL_PILL, COL_STATUS, EVIDENCE_TABS, INITIAL_ACTIVITIES, INITIAL_CARDS, INITIAL_TASKS, OWNERS, OWNER_ROWS, PLAN_ROWS, STAGES, STATUS_TONE, SUPPLY_ROWS, TYPE_ICON, WEEKS
- Entities: villages, products, crops, campaigns, people
- Fields referenced: activity, name, owner, status, target
- Story values: 7 / 10, 9 / 12, 6 / 10, 10 / 12, 5 / 10, 15%, 12%, 8%, 32%, 13%, 18%

## screens/s7.tsx
- Source: `screens/s7.tsx`
- Datasets: impact.channel_effectiveness, impact.cluster_conversion, impact.geo_performance
- Data imports: none
- Inline arrays/objects: CHANNEL_ROWS, CLUSTER_ROWS, FACTORS, GEO_ROWS, INSIGHTS, LEARNINGS, REL_TONE, ROI_ROWS
- Entities: villages, products, crops, campaigns, people
- Fields referenced: adopters
- Story values: 58%, 56%, 49%, 41%, 55%, ₹8.0 l, ₹52 l, ₹13.7 l, 68%, 72%, 46%, 63%

## CW.1, CW.2, CW.3, CW.4
- Source: `tm/campaigns.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ACTIVITY_ICONS, COMMENTS, JOURNEY, MIX_COLORS, OWNERS, PLACES, READINESS, SCENARIOS, STAGES, TIMINGS, VILLAGE_CHOICES
- Entities: regions, states, districts, villages, products, crops, campaigns, people
- Fields referenced: abp, activity, budget, crop, name, objective, owner, roi, sales, season, status, target, timing, units, where
- Story values: ₹4.20 Cr, ₹25 L, ₹3.80 Cr, ₹15 L, ₹165 L, ₹40 L

## tm/costModel.ts
- Source: `tm/costModel.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: COST_CONFIG
- Entities: crops, people
- Fields referenced: activity, owner, timing, units, where
- Story values: none detected

## tm/data.ts
- Source: `tm/data.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ACHIEVEMENT, ACTIVITIES, APPROVED, CAMPAIGN, CAMPAIGN_RETAILERS, CROP_PLAN, DEALER_PLAN, GANTT, IMPACT_VILLAGES, ONION_VILLAGES, OUTLETS, PORTFOLIO, PORTFOLIO_MONTHS, PRIORITIES, SELECTED_RETAILERS, TERRITORIES, VILLAGES
- Entities: states, territories, villages, crops, campaigns, people
- Fields referenced: none detected
- Story values: 92%, 94%, ₹48 L, ₹6.2 L, ₹4.8 L, ₹3.9 L, ₹42 L, ₹5.6 L, ₹4.1 L, ₹36 L, ₹40 L, ₹35 L

## tm/execution.tsx
- Source: `tm/execution.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: ACTIONS, TM_FACTS, TM_SUGGESTIONS
- Entities: states, territories, villages, products, crops, campaigns, people
- Fields referenced: activity, adopters, name, owner, planned, sales, state, target, units, village
- Story values: ₹25 L, ₹4.20 Cr, ₹12.0 L, 45%, 45.0%, 3 / 4, 2 / 3, 1 / 2, 31.3%, 21.4%

## tm/index.tsx
- Source: `tm/index.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: REGISTRY
- Entities: campaigns, people
- Fields referenced: none detected
- Story values: none detected

## tm/nav.ts
- Source: `tm/nav.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: TM_IDS, TM_SCREENS, TM_TABS
- Entities: territories, villages, crops, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## TM.1, TM.2, TM.3, TM.4, TM.5
- Source: `tm/plan.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: none detected
- Entities: districts, territories, villages, products, crops, people
- Fields referenced: abp, crop, name, status, target, village
- Story values: ₹2.0 Cr, ₹3.2 Cr, ₹4.2 Cr, 31.3%, ₹1.0 Cr, ₹2.8 Cr, ₹3.4 Cr, 21.4%, ₹2.4 Cr, 20.0%

## tm/state.ts
- Source: `tm/state.ts`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: APPROVAL_STEPS
- Entities: regions, states, products, crops, campaigns, people
- Fields referenced: none detected
- Story values: ₹5 L

## tm/ui.tsx
- Source: `tm/ui.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: PLAN_TABS, WIZARD
- Entities: states, territories, products, crops, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## tm/viz.tsx
- Source: `tm/viz.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: JALNA_VIEW, MAP_COLORS, VILLAGE_PLACE
- Entities: states, districts, villages, crops, campaigns, people
- Fields referenced: none detected
- Story values: none detected

## ui/kit.tsx
- Source: `ui/kit.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: CHIP_ICONS, STATUS_ICON
- Entities: states, people
- Fields referenced: status
- Story values: 100%

## ui.tsx
- Source: `ui.tsx`
- Datasets: none declared
- Data imports: none
- Inline arrays/objects: COLORS, FUNNEL_COLORS
- Entities: crops
- Fields referenced: name, target
- Story values: 60%, ₹6.4 Cr, 63%
