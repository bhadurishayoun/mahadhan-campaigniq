# UI audit: how every screen is opened

Generated from the source (`go()` / `to=` links). Sidebar shows top-level sections only; every sub-screen opens from a button, row or drawer on its parent screen.

| Screen | Title | Parent screen | Opening button / label | Other entry points |
|---|---|---|---|---|
| TM.1 | My Performance & Annual Business Plan | Sidebar section (top level) | Sidebar item | 0 |
| TM.2 | Territory Network & Channel Mapping | TM.1 My Performance & Annual Business Plan | Plan Territory | 0 |
| TM.3 | Outlet Business Planning & Target Allocation | TM.2 Territory Network & Channel Mapping | Proceed to Outlet Planning | 0 |
| TM.4 | Village-wise Crop, Product & Coverage Planning | TM.3 Outlet Business Planning & Target Allocation | Proceed to Crop & Product Plan | 0 |
| TM.5 | Business & Crop Plan Review and Approval | TM.4 Village-wise Crop, Product & Coverage Planning | Proceed to Review & Approval | 0 |
| CW.1 | Campaign Objective & Targeting | Sidebar section (top level) | Sidebar item | 1 |
| CW.2 | Campaign Activity & Budget Mix Planner | CW.1 Campaign Objective & Targeting | Continue to activity mix | 0 |
| CW.3 | Campaign Scenario & Expected Outcomes | CW.2 Campaign Activity & Budget Mix Planner | Continue to scenarios | 0 |
| CW.4 | Campaign Review & Submit | CW.3 Campaign Scenario & Expected Outcomes | Continue to final review | 0 |
| TM.EX1 | Campaign Execution & Live Control Tower | Sidebar section (top level) | Sidebar item | 1 |
| TM.EX2 | Activity Execution & Corrective Action Workspace | TM.EX1 Campaign Execution & Live Control Tower | Open Corrective Workspace | 0 |
| TM.IM1 | Campaign Impact & Business Performance | Sidebar section (top level) | Sidebar item | 1 |
| TM.IM2 | Campaign Diagnostics & Learning Studio | TM.IM1 Campaign Impact & Business Performance | Open Diagnostics | 0 |
| TM.AI1 | Territory Business & Campaign Copilot Workspace | Sidebar section (top level) | Sidebar item | 1 |
| MH.1 | National Marketing Opportunity & Performance Command Centre | Sidebar section (top level) | Sidebar item | 0 |
| MH.2 | Regional Market Opportunity & Product Sales Intelligence | Sidebar section (top level) | Sidebar item | 1 |
| MH.3 | Business & Crop Plan Alignment Review | Sidebar section (top level) | Sidebar item | 1 |
| MH.3A | Regional Business Plan Detail & Marketing Intervention Review | MH.3 Business & Crop Plan Alignment Review | Open Regional Detail -> MH.3A | 0 |
| MH.3B | Contributing Territory Plan Detail and Marketing Opportunity Review | MH.3A Regional Business Plan Detail & Marketing Intervention Review | Open Territory Contribution -> MH.3B | 0 |
| MH.4 | AI Campaign Discovery & Recommendation Studio | Sidebar section (top level) | Sidebar item | 1 |
| MH.4A | Farmer Conversion Investigation & Growth Barrier Diagnosis | MH.4 AI Campaign Discovery & Recommendation Studio | Investigate Barriers -> MH.4A | 0 |
| MH.4A-I2 | Regional Growth Barrier Investigation | MH.4A Farmer Conversion Investigation & Growth Barrier Diagnosis | Open Regional Barrier Lens -> MH.4A-I2 | 0 |
| MH.4A-I3 | Territory Conversion Barrier Deep-dive | MH.4A-I2 Regional Growth Barrier Investigation | Open Territory Deep-dive -> MH.4A-I3 | 0 |
| MH.4A-I4 | Updated Farmer Conversion Investigation & Diagnosis | MH.4A-I3 Territory Conversion Barrier Deep-dive | Update Investigation View -> MH.4A-I4 | 0 |
| MH.4B | Refreshed AI Campaign Recommendations & Selection | MH.4A-I4 Updated Farmer Conversion Investigation & Diagnosis | Refresh Recommendations -> MH.4B | 0 |
| MH.5 | Campaign Strategy Brief & Portfolio Theme Alignment | MH.4B Refreshed AI Campaign Recommendations & Selection | Build Strategy Brief -> MH.5 | 0 |
| MH.6 | Regional Campaign Mix, Budget & Calendar | MH.5 Campaign Strategy Brief & Portfolio Theme Alignment | Open Mix & Budget -> MH.6 | 0 |
| MH.7 | Campaign Portfolio Review & Refinement | MH.6 Regional Campaign Mix, Budget & Calendar | Review Portfolio -> MH.7 | 0 |
| MH.7A | Detailed Campaign Proposal & Business Case Review | MH.7 Campaign Portfolio Review & Refinement | Open Proposal Detail -> MH.7A | 0 |
| MH.7B | Exception Review & Conditional Authorization | MH.7A Detailed Campaign Proposal & Business Case Review | Open Exception Review -> MH.7B | 0 |
| MH.8 | Approval Inbox & Rollout Planning | Sidebar section (top level) | Sidebar item | 1 |
| MH.8A | Approved Campaign Recommendation Release & Territory Rollout | MH.8 Approval Inbox & Rollout Planning | Release Approved Recommendations -> MH.8A | 0 |
| MH.9 | Portfolio Performance Summary | Sidebar section (top level) | Sidebar item | 1 |
| MH.9A | Regional Programme Performance & Rollout | MH.9 Portfolio Performance Summary | View Regional Programme -> MH.9A | 0 |
| MH.9B | Regional Campaign Performance Driver Diagnostics | MH.9A Regional Programme Performance & Rollout | Investigate Drivers -> MH.9B | 2 |
| MH.9C | Territory Impact Explorer | MH.9B Regional Campaign Performance Driver Diagnostics | View Territory Impact -> MH.9C | 0 |
| MH.9D | Campaign Optimization Review Request | MH.9C Territory Impact Explorer | Request Optimization Review | 1 |
| MH.AI1 | Strategic Marketing Intelligence Copilot | Sidebar section (top level) | Sidebar item | 1 |
| BH.1 | National Business & Marketing Command Centre | Sidebar section (top level) | Sidebar item | 3 |
| BH.2 | National Campaign Portfolio Performance | Sidebar section (top level) | Sidebar item | 1 |
| BH.3 | Regional & Territory Campaign Performance Intelligence | BH.1 National Business & Marketing Command Centre | Button / row action | 5 |
| BH.3A | Territory Campaign Performance Detail | BH.3 Regional & Territory Campaign Performance Intelligence | Button / row action | 1 |
| BH.4 | Campaign Effectiveness & Attribution | BH.2 National Campaign Portfolio Performance | Campaign effectiveness · BH.4 | 3 |
| BH.5 | Marketing Investment & ROI | Sidebar section (top level) | Sidebar item | 5 |
| BH.5A | Investment Detail | BH.5 Marketing Investment & ROI | View investment detail · BH.5A | 0 |
| BH.5B | ROI Evidence & Attribution | BH.4 Campaign Effectiveness & Attribution | View ROI evidence · BH.5B | 1 |
| BH.5C | Budget Reallocation Simulator | BH.5 Marketing Investment & ROI | Simulate reallocation · BH.5C | 1 |
| BH.6 | Market Opportunity Intelligence | BH.3 Regional & Territory Campaign Performance Intelligence | Explore market opportunity · BH.6 | 6 |
| BH.7 | Strategic Theme Approval Inbox | Sidebar section (top level) | Sidebar item | 6 |
| BH.7A | Strategic Theme Business Alignment & Detailed Review | BH.7 Strategic Theme Approval Inbox | Review selected theme · BH.7A | 1 |
| BH.7B | Strategic Theme Decision | BH.7 Strategic Theme Approval Inbox | Open decision · BH.7B | 1 |
| BH.8 | Suggest Strategic Marketing Theme | BH.1 National Business & Marketing Command Centre | Suggest a strategic theme · BH.8 | 4 |
| BH.9 | Strategic Intervention & Management Tracker | Sidebar section (top level) | Sidebar item | 1 |
| BH.9A | Strategic Intervention Request | BH.9 Strategic Intervention & Management Tracker | Create intervention request · BH.9A | 1 |
| BH.10 | Portfolio Learning & Next-Year Strategic Priorities | BH.1 National Business & Marketing Command Centre | Portfolio learning · BH.10 | 1 |
| BH.AI1 | Strategic Intelligence & Decision Copilot | Sidebar section (top level) | Sidebar item | 1 |
| PM.1 | My Performance & Product Portfolio ABP | Sidebar section (top level) | Sidebar item | 1 |
| PM.2 | Consolidated Territory Business & Crop Plans | Sidebar section (top level) | Sidebar item | 3 |
| PM.2A | SKU-to-Portfolio ABP Reconciliation | PM.10A Crop × Product × Geography Detail | Mapping | 1 |
| PM.2B | SKU Mapping Correction Request | PM.2A SKU-to-Portfolio ABP Reconciliation | Review Mapping | 0 |
| PM.3 | Territory Plan Validation & Endorsement | PM.2 Consolidated Territory Business & Crop Plans | View | 1 |
| PM.3B | Territory Plan Correction Request | PM.3 Territory Plan Validation & Endorsement | Request Changes to Territory Manager | 1 |
| PM.3C | Revised Plan Comparison & Revalidation | PM.3 Territory Plan Validation & Endorsement | Revised plan review (after TM resubmission) | 0 |
| PM.3D | Marketing Head Feedback & Clarification | PM.3C Revised Plan Comparison & Revalidation | Marketing Head clarification (later state) | 0 |
| PM.4 | Assigned Marketing Themes & Brief Review | Sidebar section (top level) | Sidebar item | 10 |
| PM.4A | Strategic Theme Brief & Evidence | PM.8D Audience Overlap & Benefit Reconciliation | MH.5 Theme Brief | 3 |
| PM.4B | Theme Clarification Request | PM.5 Campaign Concept Development Studio | Request Further Evidence / Clarification | 1 |
| PM.4C | Theme Acknowledgement & Commitment | PM.4 Assigned Marketing Themes & Brief Review | Acknowledge & Develop Campaign Concepts | 0 |
| PM.5 | Campaign Concept Development Studio | Sidebar section (top level) | Sidebar item | 17 |
| PM.5A | Campaign Concept Builder | PM.5 Campaign Concept Development Studio | Edit | 1 |
| PM.5B | AI Concept Rationale & Evidence | PM.8B Financial Assumptions & Calculation Logic | PM.5B Evidence | 4 |
| PM.5C | Concept Comparison & Consolidation | PM.8D Audience Overlap & Benefit Reconciliation | PM.5C Concept Comparison | 1 |
| PM.6 | Product Proposition & Intervention Designer | PM.8A Proposal Consolidation & Submission | View PM.6 Proposition | 9 |
| PM.6A | Intervention Configuration & KPI Design | PM.8B Financial Assumptions & Calculation Logic | PM.5B Evidence | 3 |
| PM.6B | Proposition, Claim & Agronomy Validation | PM.8A Proposal Consolidation & Submission | Request Technical Validation | 1 |
| PM.7 | Campaign Collateral & Content Studio | PM.8 Campaign Business Case & Scenario Simulator | Adjust Assumptions | 8 |
| PM.7A | AI Collateral Designer | PM.7 Campaign Collateral & Content Studio | Open / Edit | 4 |
| PM.7B | Collateral Template Selection & AI Draft | PM.7 Campaign Collateral & Content Studio | Add Asset / Generate with AI | 0 |
| PM.7C | Collateral Version Comparison | PM.7 Campaign Collateral & Content Studio | Versions | 5 |
| PM.7D | Collateral Approval Tracker | PM.8F Returned Proposal Revision & Resubmission | PM.6 Proposition | 6 |
| PM.7E | Collateral Packaging & Playbook Release | PM.7D Collateral Approval Tracker | Playbook release readiness (later state) | 1 |
| PM.8 | Campaign Business Case & Scenario Simulator | PM.8A Proposal Consolidation & Submission | View PM.8 Business Case | 9 |
| PM.8A | Proposal Consolidation & Submission | PM.8 Campaign Business Case & Scenario Simulator | Proposal review | 1 |
| PM.8B | Financial Assumptions & Calculation Logic | PM.8 Campaign Business Case & Scenario Simulator | View Assumptions & Calculation Logic | 4 |
| PM.8C | Scenario Comparison & Sensitivity | PM.8 Campaign Business Case & Scenario Simulator | Compare Scenarios | 3 |
| PM.8D | Audience Overlap & Benefit Reconciliation | PM.8A Proposal Consolidation & Submission | Compare Proposals | 2 |
| PM.8E | Proposal Submission Confirmation | PM.8A Proposal Consolidation & Submission | Open submission confirmation | 0 |
| PM.8F | Returned Proposal Revision & Resubmission | PM.8A Proposal Consolidation & Submission | Revise & Resubmit | 0 |
| PM.OPT1 | Incoming Campaign Optimization & Revision Workspace | MH.9D Campaign Optimization Review Request | Submit Optimization Request to Product Manager | 0 |
| PM.9B | Activity Plan Approval Inbox | Sidebar section (top level) | Sidebar item | 1 |
| PM.9 | Territory Activity Plan Review & Approval | PM.9B Activity Plan Approval Inbox | Review Plan | 1 |
| PM.9A | Activity Detail & Exception Review | PM.9 Territory Activity Plan Review & Approval | MH.8A approved PM campaign playbook | 0 |
| PM.9C | Activity Plan Correction Request | PM.9B Activity Plan Approval Inbox | Request Clarification | 1 |
| PM.9D | Exception & Authorization Review | PM.9 Territory Activity Plan Review & Approval | Escalate Exception | 0 |
| PM.9E | Consolidated Plan Approval & Handoff | PM.9 Territory Activity Plan Review & Approval | Review Consolidated Plan for Approval | 0 |
| PM.10 | Campaign Performance & Crop-wise Uplift | Sidebar section (top level) | Sidebar item | 4 |
| PM.10A | Crop × Product × Geography Detail | PM.10 Campaign Performance & Crop-wise Uplift | View | 0 |
| PM.10B | Territory Campaign Impact Explorer | PM.10 Campaign Performance & Crop-wise Uplift | View Territory Results | 1 |
| PM.10C | Source Evidence & Attribution Validation | PM.10A Crop × Product × Geography Detail | Source | 3 |
| PM.11 | Campaign Diagnostics & Learning Studio | PM.10 Campaign Performance & Crop-wise Uplift | Investigate Crop-wise Uplift & Learning | 3 |
| PM.11A | Village Conversion Driver Investigation | PM.10A Crop × Product × Geography Detail | Investigate Village Performance | 2 |
| PM.11B | Intervention Effectiveness Diagnostics | PM.11 Campaign Diagnostics & Learning Studio | Activity completion is separate from causal impact. | 1 |
| PM.11C | Collateral Effectiveness Diagnostics | PM.11 Campaign Diagnostics & Learning Studio | Button / row action | 1 |
| PM.11D | Next-Season Learning & Recommendations | PM.11 Campaign Diagnostics & Learning Studio | Submit Strategic Recommendations to Marketing Head (review required) | 0 |
| PM.AI1 | Product & Campaign Intelligence Copilot | Sidebar section (top level) | Sidebar item | 1 |
