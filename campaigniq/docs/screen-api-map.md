# Screen-to-API map

The CampaignIQ screens render the mockups' illustrative data (see [screen-inventory.md](./screen-inventory.md)).

## Extension-point endpoints used by the screens today

| Screen | Component | Endpoint | Notes |
|---|---|---|---|
| All | Filter bar (Season, Geography, District, Crop, Product, Campaign Type) | `GET /api/reference` | Falls back to the bundled copy of `server/data/reference/*.json` |
| S1.1, S1.2, S1.3 | Campaign portfolio table / selector | `GET /api/datasets/portfolio.campaigns` | 404 → demo rows |
| S2.1 | Top Opportunity Markets | `GET /api/datasets/atlas.top_markets` | |
| S2.2 | Top Taluka Opportunity Ranking | `GET /api/datasets/atlas.taluka_ranking` | |
| S3.4 | Prioritized Campaign Trigger Queue | `GET /api/datasets/nutrition.triggers` | |
| S5.1 | Village / Cluster Demand Distribution | `GET /api/datasets/readiness.village_demand` | Scaled by the forecast assumptions |
| S5.2 | Village / Cluster Stock Gap Heatmap | `GET /api/datasets/readiness.stock_heatmap` | |
| S5.3 | Dealer / Retailer Intelligence; Village Cluster Summary | `GET /api/datasets/readiness.dealers`, `readiness.cluster_supply` | |
| S6.1 | Field Owner Allocation | `GET /api/datasets/orchestration.owners` | |
| S7.1 | Cluster Adoption Performance; Channel Effectiveness | `GET /api/datasets/impact.cluster_conversion`, `impact.channel_effectiveness` | |
| S7.2 | Geography-wise Performance | `GET /api/datasets/impact.geo_performance` | |
| AI.1 | Copilot answers | `GET /api/copilot/status`, `POST /api/copilot/ask` | `mode: "demo"` → built-in answers |
| ADM | Data Sources & Integrations | `GET /api/datasets`, `GET /api/datasets/{name}/template`, `POST`/`DELETE /api/datasets/{name}` | |

All dataset GETs accept the scope query parameters `season, state, district, taluka, crop, product, campaign_type` (master ids).

## Planning workflow endpoints (available for wiring)

The table below lists the backend endpoints available for wiring the planning workflow to live data. The "Screen" column refers to the planning workflow areas these endpoints serve.

| Screen | Component | Endpoint | Response fields / action |
|---|---|---|---|
| Shared | Scope selectors | `GET /api/meta/filters` | `seasons`, `crops`, `products`, `geography` |
| Shared | Activity library | `GET /api/activities?crop_id=&segment=` | Reach, default/learned conversion, costs, phases, bucket |
| Overview | KPI tiles and market bars | `GET /api/dashboard?season_id=&crop_id=&district=` | `kpis`, `market_units` |
| Overview | Risks and liquidation chart | `GET /api/dashboard?season_id=&crop_id=&district=` | `top_risks`, `liquidation_by_month` |
| Market & segments | MU table | `GET /api/market/mus?season_id=&crop_id=&district=&limit=&offset=` | `items[]`, `total`, pagination |
| Market & segments | Segment summary | `GET /api/segments/summary?season_id=&crop_id=` | `segment`, `objective`, `mus`, `amp_acres` |
| Market & segments | Change segment | `PATCH /api/mus/{id}/segment-override` | `segment`, required `reason` |
| Planner | Live calculation | `POST /api/plans/calculate` | Goal-chain values, activity lines and checks |
| Planner | Save draft | `POST /api/plans` | Plan id, status, saved calculation |
| Planner | Edit draft | `PUT /api/plans/{id}` | Updated saved calculation |
| Planner | Submit | `POST /api/plans/{id}/submit` | Status transition, blocked by red checks |
| Planner | Cheaper mix suggestion | `POST /api/plans/{id}/suggest-cheaper` | Original budget, suggested result, savings |
| Budget & calendar | Saved plans | `GET /api/plans?status=&limit=&offset=` | Plan list and calculation payload |
| Budget & calendar | Calendar | `GET /api/calendar?mu_id=&plan_id=&from=&to=` | Event rows |
| Budget & calendar | Generate calendar | `POST /api/plans/{id}/generate-calendar` | Created event count |
| Budget & calendar | Stock needs | `GET /api/plans/{id}/stock-needs` | Stage window, needed-by date, packs |
| Execution | Field progress, funnel, sales | `GET /api/performance?mu_id=&crop_id=` | KPI, activity progress and call conversion arrays |
| Execution | Audit queue | `GET /api/audit-queue` | Open event flags |
| Field operations | MDO queue | `GET /api/mdo/today?mu_id=` | Today/upcoming scheduled events |
| Field operations | Report | `POST /api/events/{id}/report` | Attendance, cost, GPS, photo hash, farmer contacts |
| Field operations | Resolve flag | `PATCH /api/audit-flags/{id}` | `resolved` |
| Call centre | Callback tasks | `GET /api/callbacks/queue` | Pending callback rows |
| Call centre | Record callback | `POST /api/callbacks/{id}` | Will-buy, bought and motivating activity |
| Farmer consent | Register farmer | `POST /api/farmers` | Farmer and explicit consent fields |
| Farmer consent | Withdraw | `POST /api/consent/withdraw` | Blocks future advice for the phone number |
| Farmer consent | Download log | `GET /api/consent/log` | CSV attachment |
| Imports | Market data | `POST /api/import/market` | CSV import count |
| Imports | Sales / PO data | `POST /api/import/sales` | CSV import count |
| Planning review | Envelope split | `GET /api/envelope?region=&season_id=` | Actual/target budget shares by bucket |
| Planning review | Risks | `GET /api/risks` | Rainfall trigger, rule, suggested shift |
| Planning review | Replan | `POST /api/plans/{id}/replan` | Shifts anchor and scheduled events, leaves done events |
| Reporting | Weekly/monthly review | `GET /api/reports/weekly?week=` / `GET /api/reports/monthly?month=` | Performance snapshot and risks |
