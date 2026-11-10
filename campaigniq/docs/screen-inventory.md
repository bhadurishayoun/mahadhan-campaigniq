# CampaignIQ screen inventory

The web app reproduces the photographed mockups in `ui-mockups/Sayak's Mockups/`. Every screen is reachable from the sidebar, the screen list under the active module, the header search box and the in-page navigation-flow footers. URLs use the hash form `http://localhost:5173/#/s4.3`.

All figures on these screens are the mockups' illustrative demo values (Croptek Onion Conversion — Ambad, Jalna, Late Rabi 2026-27). They are held in the screen components. Panels with a **DEMO / LIVE** badge switch to uploaded data automatically (see the README, section 5.3, and [screen-api-map.md](./screen-api-map.md)). The **ADM Data Sources & Integrations** screen (`#/admin.1`, at the bottom of the sidebar) is an addition that is not in the mockups.

| Module | Screen | Route | Mockup photo |
|---|---|---|---|
| Prototype Showcase | P.1 Prototype Overview & Feature Map | `#/p.1` (landing page) | New: prototype walkthrough |
| | P.2 Live Campaign Planning Engine | `#/p.2` | New: live backend (engine + workflow) |
| | P.3 Live Execution & Performance | `#/p.3` | New: live backend (field, callbacks, KPIs) |
| Strategy Command Centre | S1.1 Executive Strategy Command Centre | `#/s1.1` | `3.03.22 PM` |
| | S1.2 Campaign Portfolio Dashboard | `#/s1.2` | `3.03.21 PM` |
| | S1.3 Campaign Executive Summary | `#/s1.3` | `3.03.19 PM` |
| | S1.4 Strategic Risk Analysis | `#/s1.4` | `3.03.18 PM` |
| | S1.5 Recovery & Replanning | `#/s1.5` | `3.03.17 PM (1)` |
| Opportunity Atlas | S2.1 Crop × Geography Opportunity Atlas | `#/s2.1` | `3.03.17 PM` |
| | S2.2 Jalna District / Taluka Intelligence | `#/s2.2` | `3.03.16 PM (2)` |
| | S2.3 Ambad Micro-Market Segmentation | `#/s2.3` | `3.03.16 PM (1)` |
| | S2.4 Ambad Competition & Channel Intelligence | `#/s2.4` | `3.03.16 PM` |
| | S2.5 Opportunity Prioritization & Campaign Recommendations | `#/s2.5` | `3.03.15 PM (1)` |
| Crop Nutrition Intelligence | S3.1 Crop Nutrition Calendar & Growth Stage Tracker | `#/s3.1` | `3.03.15 PM` |
| | S3.2 Stage-wise Crop Nutrition Intelligence | `#/s3.2` | `3.03.14 PM (2)` |
| | S3.3 Complete Crop Nutrition Programme Builder | `#/s3.3` | `3.03.14 PM (1)` |
| | S3.4 Campaign Trigger & Recommendation Engine | `#/s3.4` | `3.03.14 PM` |
| Campaign Strategy Studio | S4.1 Campaign Portfolio & Template Library | `#/s4.1` | `3.03.13 PM (1)` |
| | S4.2 Campaign Creation Wizard | `#/s4.2` | `3.03.13 PM` |
| | S4.3 Activity & Channel Mix Planner | `#/s4.3` | `3.03.12 PM (2)` |
| | S4.4 Campaign Scenario Simulator | `#/s4.4` | `3.03.12 PM (1)` |
| | S4.5 Campaign Approval & Review | `#/s4.5` | `3.03.12 PM` |
| Demand & Channel Readiness | S5.1 Campaign Demand Projection | `#/s5.1` | `3.03.11 PM` |
| | S5.2 Stock Readiness & Supply Gap Intelligence | `#/s5.2` | `3.03.10 PM` |
| | S5.3 Dealer & Retailer Readiness Intelligence | `#/s5.3` | `3.03.23 PM (1)` |
| | S5.4 Supply Risk & Replenishment Planner | `#/s5.4` | `3.03.25 PM (1)` |
| Campaign Orchestration Hub | S6.1 Unified Campaign Execution Control Tower | `#/s6.1` | `3.03.23 PM` |
| Live Control Tower | S6.2 Activity Execution & Action Workspace | `#/s6.2` | `3.03.23 PM (2)` |
| Campaign Impact & Learning | S7.1 Campaign Impact & Effectiveness Dashboard | `#/s7.1` | `3.03.25 PM` |
| | S7.2 Campaign Diagnostics & Learning Studio | `#/s7.2` | `3.02.43 PM` |
| AI Co-pilot | AI.1 Intelligent Copilot Workspace | `#/ai.1` | `3.03.24 PM`, `3.02.42 PM` |

## Main story flow

S1.1 → S1.2 → S1.3 → S1.4 → S1.5 (executive diagnosis and recovery) · S2.1 → S2.5 (opportunity drill-down) → S3.1 → S3.4 (crop-stage nutrition and triggers) → S4.1 → S4.5 (campaign design, simulation and approval) → S5.1 → S5.4 (demand, stock, retailer and supply readiness) → S6.1 → S6.2 (execution) → S7.1 → S7.2 (impact and learnings). AI.1 links into S5.2, S6.2, S7.1 and S7.2.

## Interactive behaviour

- Shell: per-module filter bar, screen search, notifications toast, module sub-navigation.
- S4.3 activity counts recalculate budgets, shares and the budget-mix donut; S4.4 assumption sliders recalculate the funnel, demand, revenue, contribution and net ROI; S5.1 assumptions recalculate adopters and demand.
- Selection states (scenarios, templates, risks, kanban cards, trigger campaigns) update the related detail panels; approval and replanning actions update status pills/audit rows and confirm with a toast.
