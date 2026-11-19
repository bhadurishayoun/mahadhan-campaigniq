# Zonal Manager persona (CampaignIQ V2)

The app now has a **persona layer**. The original module view (Business Overview, Market Opportunities, ... ) is the
*Strategy Head* persona; the *Zonal Manager* persona is the first of the V2 persona-wise journeys. Switch personas from
the avatar menu at the top-right. Every screen has its own hash route (for example `#/pm.3b`), so any state can be linked
directly or found with the top-bar search.

Source of truth for the layouts: `ui-mockups/V2-persona-mockup-specs.md` (the approved mockup prompts, one per screen).
All figures are synthetic; the spec is deliberately strict about never showing pending checks as done, never summing
all-product territory figures into the product-portfolio ABP, and never treating campaign-linked sales as incremental.

## Code layout

```
web/src/pm/
├── nav.ts         PM_TABS (7 sidebar tabs), PM_SCREENS (48 screens: code, title, tab, parent, kind, period)
├── index.tsx      screen registry + PmScreen shell (renders drawers / modals over the dimmed parent screen)
├── kit.tsx        shared building blocks: PmPage, Drawer, Modal, Status (tone inferred from wording), Workflow,
│                  Table, Facts, Strip, Box, AiBox, Sources, Checklist, Actions, Cta (locked = disabled + reason),
│                  Field / Input / Select / Radios / Chips, Bars, Meter, Creative (CSS-drawn collateral previews)
├── data.ts        the synthetic numbers shared by all screens (portfolio ABP, Ambad plan, scenarios, activities …)
├── pm.css         persona styling (overlay stage, drawer, modal, creatives, chat …)
├── reviews.tsx    PM.1, PM.2, PM.2A, PM.2B, PM.3, PM.3B, PM.3C, PM.3D
├── themes.tsx     PM.4, PM.4A, PM.4B, PM.4C
├── studio.tsx     PM.5, PM.5A, PM.5B, PM.5C, PM.6, PM.6A, PM.6B
├── collateral.tsx PM.7, PM.7A, PM.7B, PM.7C, PM.7D, PM.7E
├── business.tsx   PM.8, PM.8A, PM.8B, PM.8C, PM.8D, PM.8E, PM.8F
├── approvals.tsx  PM.9B, PM.9, PM.9A, PM.9C, PM.9D, PM.9E
└── impact.tsx     PM.10, PM.10A, PM.10B, PM.10C, PM.11, PM.11A, PM.11B, PM.11C, PM.11D, PM.AI1
```

`nav.ts` at the web root merges `PM_SCREENS` into `SCREENS` (module `pm`), so search, hash routing and `Btn to=` work
unchanged. `App.tsx` swaps the sidebar and the filter bar when the current screen belongs to the persona.

## Screens

| Tab | Screen | Kind | Route |
|---|---|---|---|
| My Performance | PM.1 My Performance & ABP | page | `#/pm.1` |
| Territory Plan Reviews | PM.2 Territory Plans | page | `#/pm.2` |
| | PM.2A SKU vs ABP Reconciliation | page | `#/pm.2a` |
| | PM.2B SKU Mapping Correction Request | drawer over PM.2A | `#/pm.2b` |
| | PM.3 Validate Territory Plan | page | `#/pm.3` |
| | PM.3B Request Plan Correction | drawer over PM.3 | `#/pm.3b` |
| | PM.3C Revised Plan Check | page | `#/pm.3c` |
| | PM.3D Marketing Head Feedback | drawer over PM.3C | `#/pm.3d` |
| Assigned Themes | PM.4 Assigned Themes | page | `#/pm.4` |
| | PM.4A Theme Brief | drawer over PM.4 | `#/pm.4a` |
| | PM.4B Ask for Clarification | drawer over PM.4 | `#/pm.4b` |
| | PM.4C Accept Theme | modal over PM.4 | `#/pm.4c` |
| Campaign Planning | PM.5 Campaign Concepts | page | `#/pm.5` |
| | PM.5A Build a Concept | drawer over PM.5 | `#/pm.5a` |
| | PM.5B Why This Concept | drawer over PM.5 | `#/pm.5b` |
| | PM.5C Compare Concepts | page | `#/pm.5c` |
| | PM.6 Product Proposition | page | `#/pm.6` |
| | PM.6A Activities & KPIs | drawer over PM.6 | `#/pm.6a` |
| | PM.6B Claims & Agronomy Check | drawer over PM.6 | `#/pm.6b` |
| | PM.7 Campaign Collateral | page | `#/pm.7` |
| | PM.7A Collateral Draft | page | `#/pm.7a` |
| | PM.7B Choose a Template | page | `#/pm.7b` |
| | PM.7C Compare Versions | page | `#/pm.7c` |
| | PM.7D Collateral Approvals | page | `#/pm.7d` |
| | PM.7E Release Campaign Kit | page | `#/pm.7e` |
| | PM.8 Business Case | page | `#/pm.8` |
| | PM.8A Submit Proposal | page | `#/pm.8a` |
| | PM.8B Assumptions & Calculations | page | `#/pm.8b` |
| | PM.8C Scenarios & Sensitivity | page | `#/pm.8c` |
| | PM.8D Audience Overlap Check | page | `#/pm.8d` |
| | PM.8E Proposal Submitted | modal over PM.8A | `#/pm.8e` |
| | PM.8F Revise & Resubmit | page | `#/pm.8f` |
| Activity Approvals | PM.9B Activity Plan Approvals | page (tab home) | `#/pm.9b` |
| | PM.9 Review Activity Plan | page | `#/pm.9` |
| | PM.9A Activity Detail | drawer over PM.9 | `#/pm.9a` |
| | PM.9C Request Corrections | drawer over PM.9 | `#/pm.9c` |
| | PM.9D Exceptions to Approve | drawer over PM.9 | `#/pm.9d` |
| | PM.9E Approve & Hand Off | modal over PM.9 | `#/pm.9e` |
| Impact & Learning | PM.10 Campaign Results by Crop | page | `#/pm.10` |
| | PM.10A Crop, Product & Area Detail | page | `#/pm.10a` |
| | PM.10B Results by Territory | drawer over PM.10A | `#/pm.10b` |
| | PM.10C Check the Evidence | drawer over PM.10A | `#/pm.10c` |
| | PM.11 What Worked & Why | page | `#/pm.11` |
| | PM.11A Village Conversion Gaps | drawer over PM.11 | `#/pm.11a` |
| | PM.11B Activity Effectiveness | drawer over PM.11 | `#/pm.11b` |
| | PM.11C Collateral Effectiveness | drawer over PM.11 | `#/pm.11c` |
| | PM.11D Next-Season Changes | page | `#/pm.11d` |
| AI Copilot | PM.AI1 AI Copilot | page | `#/pm.ai1` |

PM.1 – PM.9E use FY 2025–26; PM.10 – PM.AI1 are a later interim checkpoint (FY 2026–27, reporting Jan–Feb 2027), and the
top bar shows the period of the current screen.

## Conventions worth keeping for the next personas

* **Overlay screens** are ordinary routes with `parent` + `kind` in the registry; `PmScreen` renders the parent inside
  `.pm-dim` and the overlay on top. Closing an overlay navigates back to its parent.
* **Gated actions** use `<Cta locked="reason">`: the button is disabled and the reason is printed beside it, exactly as
  the mockups show ("Endorse & Forward … visibly DISABLED until …").
* **Statuses** are plain strings; `Status` picks the colour from the wording (Pending → amber, Verified → green,
  Not Verified / Unresolved → red, Draft → grey). Keep the spec's wording and the colours follow.
* Buttons that would call a backend (Save Draft, Request Validation …) show a toast via `<Act message="…">`.
* Links to screens of other personas (TM.3, MH.5, TM.IM1 …) are `Sources` chips that toast until those personas exist;
  give them a `to` once the screen is built.
