# CampaignIQ screen inventory

The web app reproduces the photographed mockups in `ui-mockups/Sayak's Mockups/`. Every screen is reachable from the sidebar, the screen list under the active module, the header search box and the in-page navigation-flow footers. URLs use the hash form `http://localhost:5173/#/s4.3`.

All figures on these screens are the mockups' illustrative demo values (Croptek Onion Conversion — Ambad, Jalna, Late Rabi 2026-27). They are held in the screen components. Panels with a **DEMO / LIVE** badge switch to uploaded data automatically (see the README, section 5.3, and [screen-api-map.md](./screen-api-map.md)). The **ADM Data Sources & Integrations** screen (`#/admin.1`, at the bottom of the sidebar) is an addition that is not in the mockups.

| Module | Screen | Route | Mockup photo |
|---|---|---|---|
| Prototype Showcase | P.1 Prototype Overview | `#/p.1` (landing page) | New: prototype walkthrough |
| | P.2 Campaign Planner (Live) | `#/p.2` | New: live backend (engine + workflow) |
| | P.3 Execution & Results (Live) | `#/p.3` | New: live backend (field, callbacks, KPIs) |
| Business Overview | S1.1 Business Overview | `#/s1.1` | `3.03.22 PM` |
| | S1.2 Campaign Portfolio | `#/s1.2` | `3.03.21 PM` |
| | S1.3 Campaign Summary | `#/s1.3` | `3.03.19 PM` |
| | S1.4 Risks & Issues | `#/s1.4` | `3.03.18 PM` |
| | S1.5 Recovery Plan | `#/s1.5` | `3.03.17 PM (1)` |
| Market Opportunities | S2.1 Opportunities by Crop & District | `#/s2.1` | `3.03.17 PM` |
| | S2.2 Jalna Taluka View | `#/s2.2` | `3.03.16 PM (2)` |
| | S2.3 Ambad Village Segments | `#/s2.3` | `3.03.16 PM (1)` |
| | S2.4 Ambad Competition & Dealers | `#/s2.4` | `3.03.16 PM` |
| | S2.5 Opportunity Prioritization & Campaign Recommendations | `#/s2.5` | `3.03.15 PM (1)` |
| Crop Nutrition | S3.1 Crop Nutrition Calendar & Growth Stage Tracker | `#/s3.1` | `3.03.15 PM` |
| | S3.2 Stage-wise Crop Nutrition | `#/s3.2` | `3.03.14 PM (2)` |
| | S3.3 Nutrition Programme Builder | `#/s3.3` | `3.03.14 PM (1)` |
| | S3.4 Campaign Triggers | `#/s3.4` | `3.03.14 PM` |
| Campaign Planning | S4.1 Campaign Portfolio & Template Library | `#/s4.1` | `3.03.13 PM (1)` |
| | S4.2 Create a Campaign | `#/s4.2` | `3.03.13 PM` |
| | S4.3 Activity & Channel Plan | `#/s4.3` | `3.03.12 PM (2)` |
| | S4.4 Campaign Scenarios | `#/s4.4` | `3.03.12 PM (1)` |
| | S4.5 Campaign Approval | `#/s4.5` | `3.03.12 PM` |
| Demand & Channel Readiness | S5.1 Demand Forecast | `#/s5.1` | `3.03.11 PM` |
| | S5.2 Stock & Supply Gaps | `#/s5.2` | `3.03.10 PM` |
| | S5.3 Dealer & Retailer Readiness | `#/s5.3` | `3.03.23 PM (1)` |
| | S5.4 Stock Replenishment Plan | `#/s5.4` | `3.03.25 PM (1)` |
| Field Execution | S6.1 Campaign Execution Tracker | `#/s6.1` | `3.03.23 PM` |
| Activity Tracker | S6.2 Activity Follow-up | `#/s6.2` | `3.03.23 PM (2)` |
| Campaign Results | S7.1 Campaign Results | `#/s7.1` | `3.03.25 PM` |
| | S7.2 What Worked & Why | `#/s7.2` | `3.02.43 PM` |
| AI Copilot | AI.1 AI Copilot | `#/ai.1` | `3.03.24 PM`, `3.02.42 PM` |
| Zonal Manager | PM.OPT1 Campaign Change Requests | `#/pm.opt1` | Added from the PM UI Workflow; linked from MH.9D |

## Business Head V2 workspace

The Business Head uses a dedicated executive workspace based on the supplied November 17, 2026 WhatsApp mockups. It replaces the former S1–S7 module landing for this persona; the legacy routes remain available.

| Section | Screens | Routes |
|---|---|---|
| Business Overview | BH.1 | `#/bh.1` |
| Campaign Performance | BH.2, BH.3, BH.3A, BH.4, BH.10 | `#/bh.2` through `#/bh.4`, `#/bh.10` |
| Marketing Spend & ROI | BH.5, BH.5A, BH.5B, BH.5C | `#/bh.5`, `#/bh.5a` through `#/bh.5c` |
| Themes & Approvals | BH.6, BH.7, BH.7A, BH.7B, BH.8 | `#/bh.6` through `#/bh.8` |
| Interventions | BH.9, BH.9A | `#/bh.9`, `#/bh.9a` |
| AI Copilot | BH.AI1 | `#/bh.ai1` |

The PM UI Workflow document is a Zonal Manager click-through inventory, not a whole-portal or Business Head specification. Its role handoffs and approval gates are reflected in the BH theme decision flow: a BH theme decision returns to Marketing Head for assignment; the PM develops the campaign proposal and business case afterward. Theme approval does not authorize spend or field execution. The incoming optimization request handoff is linked from MH.9D to PM.OPT1. The workflow's campaign-level launch, local-plan approval, and evidence/attribution distinctions remain separate.

## Main story flow

S1.1 → S1.2 → S1.3 → S1.4 → S1.5 (executive diagnosis and recovery) · S2.1 → S2.5 (opportunity drill-down) → S3.1 → S3.4 (crop-stage nutrition and triggers) → S4.1 → S4.5 (campaign design, simulation and approval) → S5.1 → S5.4 (demand, stock, retailer and supply readiness) → S6.1 → S6.2 (execution) → S7.1 → S7.2 (impact and learnings). AI.1 links into S5.2, S6.2, S7.1 and S7.2.

## Interactive behaviour

- Shell: per-module filter bar, screen search, notifications toast, module sub-navigation.
- S4.3 activity counts recalculate budgets, shares and the budget-mix donut; S4.4 assumption sliders recalculate the funnel, demand, revenue, contribution and net ROI; S5.1 assumptions recalculate adopters and demand.
- Selection states (scenarios, templates, risks, kanban cards, trigger campaigns) update the related detail panels; approval and replanning actions update status pills/audit rows and confirm with a toast.
