# UI audit: how every screen is opened

Generated from the source (`go()` / `to=` links). Sidebar shows top-level sections only; every sub-screen opens from a button, row or drawer on its parent screen.

| Screen | Title | Parent screen | Opening button / label | Other entry points |
|---|---|---|---|---|
| TM.1 | My Performance & ABP | Sidebar section (top level) | Sidebar item | 0 |
| TM.2 | Territory Network | TM.1 My Performance & ABP | Plan Territory | 0 |
| TM.3 | Outlet Targets | TM.2 Territory Network | Proceed to Outlet Planning | 0 |
| TM.4 | Village Crop Plan | TM.3 Outlet Targets | Proceed to Crop & Product Plan | 0 |
| TM.5 | Plan Review & Approval | TM.4 Village Crop Plan | Proceed to Review & Approval | 0 |
| CW.1 | Objective & Target Villages | Sidebar section (top level) | Sidebar item | 1 |
| CW.2 | Activities & Budget | CW.1 Objective & Target Villages | Continue to activity mix | 0 |
| CW.3 | Expected Results | CW.2 Activities & Budget | Continue to scenarios | 0 |
| CW.4 | Review & Submit | CW.3 Expected Results | Continue to final review | 0 |
| TM.EX1 | Activity Tracker | Sidebar section (top level) | Sidebar item | 1 |
| TM.EX2 | Activity Follow-up | TM.EX1 Activity Tracker | Open Corrective Workspace | 0 |
| TM.IM1 | Campaign Results | Sidebar section (top level) | Sidebar item | 1 |
| TM.IM2 | What Worked & Why | TM.IM1 Campaign Results | Open Diagnostics | 0 |
| TM.AI1 | AI Copilot | Sidebar section (top level) | Sidebar item | 1 |
| MH.1 | Marketing Overview | Sidebar section (top level) | Sidebar item | 0 |
| MH.2 | Market Opportunities by Region | Sidebar section (top level) | Sidebar item | 1 |
| MH.3 | Plan Reviews | Sidebar section (top level) | Sidebar item | 1 |
| MH.3A | Regional Plan Detail | MH.3 Plan Reviews | Open Regional Detail -> MH.3A | 0 |
| MH.3B | Territory Plan Detail | MH.3A Regional Plan Detail | Open Territory Contribution -> MH.3B | 0 |
| MH.4 | Campaign Ideas | Sidebar section (top level) | Sidebar item | 1 |
| MH.4A | Why Farmers Are Not Converting | MH.4 Campaign Ideas | Investigate Barriers -> MH.4A | 0 |
| MH.4A-I2 | Barriers by Region | MH.4A Why Farmers Are Not Converting | Open Regional Barrier Lens -> MH.4A-I2 | 0 |
| MH.4A-I3 | Barriers by Territory | MH.4A-I2 Barriers by Region | Open Barriers by Territory -> MH.4A-I3 | 0 |
| MH.4A-I4 | Conversion Barriers: Updated Findings | MH.4A-I3 Barriers by Territory | Update Investigation View -> MH.4A-I4 | 0 |
| MH.4B | Shortlist Campaigns | MH.4A-I4 Conversion Barriers: Updated Findings | Refresh Recommendations -> MH.4B | 0 |
| MH.5 | Campaign Brief | MH.4B Shortlist Campaigns | Build Strategy Brief -> MH.5 | 0 |
| MH.6 | Campaign Mix, Budget & Calendar | MH.5 Campaign Brief | Open Mix & Budget -> MH.6 | 0 |
| MH.7 | Campaign Portfolio Review | MH.6 Campaign Mix, Budget & Calendar | Review Portfolio -> MH.7 | 0 |
| MH.7A | Proposal & Business Case | MH.7 Campaign Portfolio Review | Open Proposal Detail -> MH.7A | 0 |
| MH.7B | Exceptions & Conditional Approval | MH.7A Proposal & Business Case | Open Exception Review -> MH.7B | 0 |
| MH.8 | Approvals & Rollout | Sidebar section (top level) | Sidebar item | 1 |
| MH.8A | Release to Territories | MH.8 Approvals & Rollout | Release Approved Recommendations -> MH.8A | 0 |
| MH.9 | Performance Summary | Sidebar section (top level) | Sidebar item | 1 |
| MH.9A | Regional Performance | MH.9 Performance Summary | View Regional Programme -> MH.9A | 0 |
| MH.9B | What Is Driving Results | MH.9A Regional Performance | Investigate Drivers -> MH.9B | 2 |
| MH.9C | Territory Results | MH.9B What Is Driving Results | View Territory Impact -> MH.9C | 0 |
| MH.9D | Request Campaign Changes | MH.9C Territory Results | Request Optimization Review | 1 |
| MH.AI1 | AI Copilot | Sidebar section (top level) | Sidebar item | 1 |
| BH.1 | Business & Marketing Overview | Sidebar section (top level) | Sidebar item | 3 |
| BH.2 | Campaign Performance | Sidebar section (top level) | Sidebar item | 1 |
| BH.3 | Performance by Region | BH.1 Business & Marketing Overview | Button / row action | 5 |
| BH.3A | Territory Performance Detail | BH.3 Performance by Region | Button / row action | 1 |
| BH.4 | Campaign Effectiveness | BH.2 Campaign Performance | Campaign effectiveness · BH.4 | 3 |
| BH.5 | Marketing Spend & ROI | Sidebar section (top level) | Sidebar item | 5 |
| BH.5A | Spend Breakdown | BH.5 Marketing Spend & ROI | View investment detail · BH.5A | 0 |
| BH.5B | ROI Evidence | BH.4 Campaign Effectiveness | View ROI evidence · BH.5B | 1 |
| BH.5C | Budget Reallocation | BH.5 Marketing Spend & ROI | Simulate reallocation · BH.5C | 1 |
| BH.6 | Market Opportunities | BH.3 Performance by Region | Explore market opportunity · BH.6 | 6 |
| BH.7 | Theme Approvals | Sidebar section (top level) | Sidebar item | 6 |
| BH.7A | Theme Review | BH.7 Theme Approvals | Review selected theme · BH.7A | 1 |
| BH.7B | Theme Decision | BH.7 Theme Approvals | Open decision · BH.7B | 1 |
| BH.8 | Propose a Marketing Theme | BH.1 Business & Marketing Overview | Suggest a strategic theme · BH.8 | 4 |
| BH.9 | Intervention Tracker | Sidebar section (top level) | Sidebar item | 1 |
| BH.9A | Request an Intervention | BH.9 Intervention Tracker | Create intervention request · BH.9A | 1 |
| BH.10 | Learnings & Next-Year Priorities | BH.1 Business & Marketing Overview | Portfolio learning · BH.10 | 1 |
| BH.AI1 | AI Copilot | Sidebar section (top level) | Sidebar item | 1 |
| PM.1 | My Performance & ABP | Sidebar section (top level) | Sidebar item | 1 |
| PM.2 | Territory Plans | Sidebar section (top level) | Sidebar item | 3 |
| PM.2A | SKU vs ABP Reconciliation | PM.10A Crop, Product & Area Detail | Mapping | 1 |
| PM.2B | SKU Mapping Correction Request | PM.2A SKU vs ABP Reconciliation | Review Mapping | 0 |
| PM.3 | Validate Territory Plan | PM.2 Territory Plans | View | 1 |
| PM.3B | Request Plan Correction | PM.3 Validate Territory Plan | Request Changes to Field Sales Manager | 1 |
| PM.3C | Revised Plan Check | PM.3 Validate Territory Plan | Revised plan review (after TM resubmission) | 0 |
| PM.3D | Marketing Head Feedback | PM.3C Revised Plan Check | Marketing Head clarification (later state) | 0 |
| PM.4 | Assigned Themes | Sidebar section (top level) | Sidebar item | 10 |
| PM.4A | Theme Brief | PM.8D Audience Overlap Check | MH.5 Theme Brief | 3 |
| PM.4B | Ask for Clarification | PM.5 Campaign Concepts | Request Further Evidence / Clarification | 1 |
| PM.4C | Accept Theme | PM.4 Assigned Themes | Acknowledge & Develop Campaign Concepts | 0 |
| PM.5 | Campaign Concepts | Sidebar section (top level) | Sidebar item | 17 |
| PM.5A | Build a Concept | PM.5 Campaign Concepts | Edit | 1 |
| PM.5B | Why This Concept | PM.8B Assumptions & Calculations | PM.5B Evidence | 4 |
| PM.5C | Compare Concepts | PM.8D Audience Overlap Check | PM.5C Concept Comparison | 1 |
| PM.6 | Product Proposition | PM.8A Submit Proposal | View PM.6 Proposition | 9 |
| PM.6A | Activities & KPIs | PM.8B Assumptions & Calculations | PM.5B Evidence | 3 |
| PM.6B | Claims & Agronomy Check | PM.8A Submit Proposal | Request Technical Validation | 1 |
| PM.7 | Campaign Collateral | PM.8 Business Case | Adjust Assumptions | 8 |
| PM.7A | Collateral Draft | PM.7 Campaign Collateral | Open / Edit | 4 |
| PM.7B | Choose a Template | PM.7 Campaign Collateral | Add Asset / Generate with AI | 0 |
| PM.7C | Compare Versions | PM.7 Campaign Collateral | Versions | 5 |
| PM.7D | Collateral Approvals | PM.8F Revise & Resubmit | PM.6 Proposition | 6 |
| PM.7E | Release Campaign Kit | PM.7D Collateral Approvals | Playbook release readiness (later state) | 1 |
| PM.8 | Business Case | PM.8A Submit Proposal | View PM.8 Business Case | 9 |
| PM.8A | Submit Proposal | PM.8 Business Case | Proposal review | 1 |
| PM.8B | Assumptions & Calculations | PM.8 Business Case | View Assumptions & Calculation Logic | 4 |
| PM.8C | Scenarios & Sensitivity | PM.8 Business Case | Compare Scenarios | 3 |
| PM.8D | Audience Overlap Check | PM.8A Submit Proposal | Compare Proposals | 2 |
| PM.8E | Proposal Submitted | PM.8A Submit Proposal | Open submission confirmation | 0 |
| PM.8F | Revise & Resubmit | PM.8A Submit Proposal | Revise & Resubmit | 0 |
| PM.OPT1 | Campaign Change Requests | MH.9D Request Campaign Changes | Submit Optimization Request to Zonal Manager | 0 |
| PM.9B | Activity Plan Approvals | Sidebar section (top level) | Sidebar item | 1 |
| PM.9 | Review Activity Plan | PM.9B Activity Plan Approvals | Review Plan | 1 |
| PM.9A | Activity Detail | PM.9 Review Activity Plan | MH.8A approved PM campaign playbook | 0 |
| PM.9C | Request Corrections | PM.9B Activity Plan Approvals | Request Clarification | 1 |
| PM.9D | Exceptions to Approve | PM.9 Review Activity Plan | Escalate Exception | 0 |
| PM.9E | Approve & Hand Off | PM.9 Review Activity Plan | Review Consolidated Plan for Approval | 0 |
| PM.10 | Campaign Results by Crop | Sidebar section (top level) | Sidebar item | 4 |
| PM.10A | Crop, Product & Area Detail | PM.10 Campaign Results by Crop | View | 0 |
| PM.10B | Results by Territory | PM.10 Campaign Results by Crop | View Territory Results | 1 |
| PM.10C | Check the Evidence | PM.10A Crop, Product & Area Detail | Source | 3 |
| PM.11 | What Worked & Why | PM.10 Campaign Results by Crop | Investigate Crop-wise Uplift & Learning | 3 |
| PM.11A | Village Conversion Gaps | PM.10A Crop, Product & Area Detail | Investigate Village Performance | 2 |
| PM.11B | Activity Effectiveness | PM.11 What Worked & Why | Activity completion is separate from causal impact. | 1 |
| PM.11C | Collateral Effectiveness | PM.11 What Worked & Why | Button / row action | 1 |
| PM.11D | Next-Season Changes | PM.11 What Worked & Why | Submit Strategic Recommendations to Marketing Head (review required) | 0 |
| PM.AI1 | AI Copilot | Sidebar section (top level) | Sidebar item | 1 |
