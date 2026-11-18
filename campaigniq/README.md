# Mahadhan CampaignIQ

CampaignIQ is a crop-nutrition campaign-management tool for Mahadhan (Deepak NextGen). It covers the campaign lifecycle: finding opportunities, building nutrition programmes, planning campaigns, checking demand and channel readiness, running field execution and measuring impact. An AI Copilot sits on top.

The tool has two layers:

* **Version 2 persona workspaces** (the main experience): Business Head, Marketing Head, Product Manager and Territory Manager, built from the approved mockup specs in `ui-mockups/V2-persona-mockup-specs.md`.
* **Version 1 module screens** (S1–S7, AI.1) from the 28 mockups in `ui-mockups/Sayak's Mockups/`, plus the Prototype Showcase (P.1–P.3) that drives the live planning engine.

All data is **illustrative**: the backend is filled from a synthetic data workbook and the persona screens use mockup figures. Nothing is Mahadhan's actual data. The code has placeholders so that more states, districts and products can be added by editing JSON, real data can replace the synthetic rows sheet by sheet, and a paid or self-hosted LLM can replace the free one by changing settings.

**New to the project? Read [0. Project status & next steps](#0-project-status--next-steps-start-here) first.** The rest of this README explains how to run the tool, how it is built and how to extend it.

---

## Contents

0. [Project status & next steps (start here)](#0-project-status--next-steps-start-here)
1. [Quick start](#1-quick-start)
2. [Architecture](#2-architecture)
3. [Folder structure](#3-folder-structure)
4. [How the tool was built - step by step](#4-how-the-tool-was-built---step-by-step)
5. [Extending the tool](#5-extending-the-tool)
   * [5.1 Add states, districts, talukas](#51-add-states-districts-and-talukas)
   * [5.2 Add products, crops, seasons, campaign types](#52-add-products-crops-seasons-and-campaign-types)
   * [5.3 Replace demo data with real data](#53-replace-demo-data-with-real-data)
   * [5.4 Put a placeholder on another table or chart](#54-put-a-data-placeholder-on-another-table-or-chart)
   * [5.5 Connect the AI Copilot to an LLM](#55-connect-the-ai-copilot-to-an-llm)
   * [5.6 Add a new screen](#56-add-a-new-screen)
6. [Configuration reference](#6-configuration-reference)
7. [API reference](#7-api-reference)
8. [Testing and building](#8-testing-and-building)
9. [Troubleshooting](#9-troubleshooting)
10. [Before going to production](#10-before-going-to-production)

---

## 0. Project status & next steps (start here)

*Last updated: 18 Nov 2026 (after commit `a127d87`, plain-language screen titles). Update this section with every change.*

### Recent changes (newest first)

| Commit | Change |
|---|---|
| `a127d87` | Screen, tab, breadcrumb and panel titles rewritten in plain business language across all personas (e.g. "National Business & Marketing Command Centre" → "Business & Marketing Overview"); docs use the new names; naming convention added below |
| `93585cc` | README / DEPLOYMENT rewritten as a handover guide (this section) |
| `a825e30` | Website connected to the Render backend by default |
| `6694bbb` | Live AI Copilot on free keyless LLMs (backend `/api/copilot/chat` + browser fallback) for AI.1 and the TM / PM / MH / BH copilots |
| `24d2330` | Master showcase login; Territory Manager rebuilt to mirror the V2 mockups, with maps, campaign visuals, Approval Status and Campaign Portfolio screens |
| `d6c55d8` | Synthetic data workbook and loader; backend seeds itself from it |

Full history: `git log --oneline`.

### Where things run

| What | Where | Notes |
|---|---|---|
| Website | https://bhadurishayoun.github.io/mahadhan-campaigniq/ | GitHub Pages, rebuilt on every push to `main` (`.github/workflows/deploy.yml`) |
| Backend API | https://mahadhan-campaigniq-api.onrender.com/api | Render free tier (`render.yaml`), redeploys on push. Sleeps after ~15 min idle (first call up to 1 min). Its SQLite database is rebuilt from the seed workbook on every start, so demo changes do not persist. |
| Login | `MASTER001` / `Mahadhan@2026` | Opens every persona; switch with the avatar menu. Per-persona IDs: SH001 (Business Head), PM001, TM001, MH001 (passwords in `web/src/personaAuth.ts`). Front-end only - not real security. |

### What is done

| Area | Status | Where |
|---|---|---|
| Territory Manager persona | **17 screens mirroring the approved mockups**: My Plan TM.1–TM.5, My Campaigns TM.C1 → wizard CW.1–CW.4 → TM.C2 Review & Approval → TM.C3 Campaign Portfolio, Execution TM.EX1–EX2, Impact TM.IM1–IM2, AI Copilot TM.AI1. Jalna/Ambad maps, donuts, approval pipeline, editable plans that recalculate. | `web/src/tm/` (`plan.tsx`, `campaigns.tsx`, `execution.tsx`, figures in `data.ts`, visuals in `viz.tsx`, session state in `state.ts`) |
| Product Manager persona | 48 screens (PM.1 – PM.AI1) | `web/src/pm/`, notes in `docs/product-manager-persona.md` |
| Marketing Head, Business Head personas | Workspaces exist; **not yet checked screen-by-screen against the mockups** (MH uses a generic workspace template) | `web/src/mh/`, `web/src/bh/` |
| Master login | One login for all personas, persona switching without re-login | `web/src/personaAuth.ts`, `login.tsx`, `App.tsx` |
| Synthetic data | Excel workbook (20 districts, 95 marketing units, 3 seasons, plans, field events, farmers, call-backs, sales, 12 screen datasets) loaded into the backend automatically | `server/scripts/generate_synthetic_workbook.py` → `server/data/seed/mahadhan_synthetic_data.xlsx` → `server/campaign_api/workbook.py` (see [5.3](#53-replace-demo-data-with-real-data)) |
| Live AI Copilot | All copilots answer with a real LLM, no API key: free keyless endpoints (LLM7, then Pollinations). Through the backend when reachable, otherwise straight from the browser. | `server/campaign_api/copilot/`, `web/src/data/copilot.ts`, `web/src/ui/LiveCopilot.tsx` (see [5.5](#55-connect-the-ai-copilot-to-an-llm)) |
| Hosting | Website and backend deployed and connected | see table above |
| Screen titles | All ~150 screen, tab and panel titles rewritten in plain business language (no "Command Centre", "Intelligence", "Studio" …); docs updated to match | `web/src/*/nav.ts`, screen files, `docs/` |

### Known limitations (be aware before demoing or building on it)

1. **Persona screens do not read the backend.** TM/PM/MH/BH figures come from `web/src/*/data.ts` (mockup storyline numbers). Only the S1–S7 dataset panels, P.1–P.3, AI.1 and the copilots use backend data. The two can disagree (e.g. Dhanora conversion 38.7% on TM screens vs 32% in the impact dataset).
2. **Synthetic data needs recalibration** (found in an audit): field-crop areas per marketing unit (cotton, soybean, groundnut) are 2–3× too high because the generator divides district area by the listed talukas instead of all talukas; total liquidation (~₹100 Cr/year) is 3–4× the storyline scale; Croptek doses were raised to 3–4 bags/acre so the engine's spend caps pass; prices and district crop areas are approximate and unverified.
3. **About a third of current-season plans stay drafts**: with the spec's activity costs, Growing-segment onion plans sit just above the 20% spend cap (expected to use "Suggest cheaper mix").
4. **Free LLM limits**: rate-limited (Pollinations ≈ 1 reply / 45 s per IP), best-effort availability, a 20B-class open model that occasionally gets details wrong; questions and on-screen figures go to third-party services.
5. **Approvals in the TM campaign journey are simulated** for the showcase ("Showcase: advance approval"); state lives in the browser session only.
6. **No real authentication or authorisation** (front-end credentials, `X-User-Role` header). The workbook import endpoint is disabled unless `CAMPAIGNIQ_ADMIN_TOKEN` is set.

### Suggested next steps (in priority order)

1. **Recalibrate the synthetic data**: in `generate_synthetic_workbook.py` derive marketing-unit crop area from each district's real village count, and lower the treated share so a taluka-sized territory sells ≈ ₹3–4 Cr/year; regenerate, run `python -m campaign_api.workbook`, run the tests.
2. **Rework the Marketing Head and Business Head workspaces** against `ui-mockups/V2-persona-mockup-specs.md`, the same way TM was done (hero element per screen, sub-tabs, footer with "Recommended next", no decorative charts). BH had only a brief in the mockup chat, no image prompts.
3. **Connect persona screens to backend data**: replace the constants in `web/src/*/data.ts` with `useDataset()` / API calls, keeping the current values as the demo fallback.
4. **Real data**: get Mahadhan's price list, agronomy-approved doses and one season of territory sales; replace the matching workbook sheets (same column names) and reload.
5. **Production hardening**: real login and roles, a paid or self-hosted LLM (`COPILOT_PROVIDER=openai`), a managed database, see [10](#10-before-going-to-production).

### Working conventions

* Every persona lives in `web/src/<persona>/`: `nav.ts` (screen registry), screen files, `data.ts` (figures), CSS. Register new screens in `nav.ts` and the persona's `index.tsx`.
* Keep figures consistent across screens (totals must reconcile); keep everything labelled illustrative.
* **Screen and panel titles must read like a person named them:** short, plain business words that say what the
  user does or sees (e.g. "Plan Reviews", "Outlet Targets", "Approval Status"). Avoid buzzwords such as Command Centre,
  Intelligence, Studio, Workspace, Control Tower, Engine, Hub, Unified, Deep-dive, and stacked "Strategic … &
  … & …" chains. Every assistant is called "AI Copilot". When renaming a screen, change its `nav.ts` title and every
  breadcrumb, link and doc that uses it (titles are plain strings, so a project-wide search finds them all).
* Before pushing: `npx tsc --noEmit -p web`, `npm run build -w web`, `cd server; python -m unittest discover -s tests_python`.
* On Windows, `npm run dev`'s auto-reload can leave an old API worker running on port 8000; if API changes don't show up, stop all `uvicorn` Python processes and restart.
* Update this README (this section first) in the same commit as any change.

---

## 1. Quick start

### Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.11 or newer (developed on 3.14) | `python --version` |
| Node.js | 20 or newer (developed on 24) | `node -v` |
| npm | comes with Node.js | `npm -v` |

### Install and run

Open a terminal in the `campaigniq/` folder:

```powershell
# 1. Backend (Python) packages
python -m pip install -r server/requirements.txt

# 2. Frontend + workspace packages (React, Vite, concurrently, ...)
npm install

# 3. (Optional) settings - copy the template, then edit it
Copy-Item .env.example server/.env

# 4. Start the API (port 8000) and the web app (port 5173) together
npm run dev
```

Then open **http://localhost:5173** and sign in (any name, user ID `MASTER001`, password `Mahadhan@2026`). You land on the Business Head workspace; switch personas from the avatar menu at the top right. The Prototype Showcase is at `#/p.1`.

* Each screen has its own address, for example `http://localhost:5173/#/s4.3` or `#/ai.1`.
* The API documentation (Swagger) is at **http://localhost:8000/docs**.
* On first start the API creates the SQLite database `server/data/campaigniq-python.db` and fills it from the synthetic data workbook `server/data/seed/mahadhan_synthetic_data.xlsx` (see [5.3](#53-replace-demo-data-with-real-data)).
* The **Data Sources & Integrations** link at the bottom of the sidebar (`#/admin.1`) shows which screens use demo or live data, and whether an LLM is connected.

### Demo script (prototype walkthrough, ~10 minutes)

The **Prototype Showcase** module (top of the sidebar) explains the prototype and proves the backend works:

| Screen | What to show |
|---|---|
| **P.1 Prototype Overview** (`#/p.1`) | What the tool does; live system status (API, database, engine, masters, datasets, Co-pilot); architecture (built vs proposed integrations); feature map with honest status per module; roadmap (Prototype → Pilot → Scale); guided demo path. |
| **P.2 Live Campaign Planner** (`#/p.2`) | Pick a market unit and move the target slider: the Python engine recalculates segment, goal, farmers, activity mix, budget and 8 guardrails. Then **Save draft → Submit → Approve as Marketing (blocked, HTTP 403) → Approve as Region Manager → Generate calendar & stock plan**. Raise the target until the spend-ratio check turns red to show the API refusing submission. |
| **P.3 Execution & Results (Live)** (`#/p.3`) | Real KPIs from the database. Record a call-centre callback ("Bought") and watch *Converted farmers* update; resolve an audit flag. |

The dark **Backend Activity** console on P.2/P.3 lists every API call (method, path, status, milliseconds), including rejected calls and their reasons. Follow with the designed mockup screens (S1–S7, AI.1) using the Guided Demo Path on P.1.

Screens are labelled as:
- **Live · backend connected:** P.1–P.3, ADM, AI.1 and the persona AI copilots.
- **Interactive UI · API ready:** S1–S7. These show the approved designs with illustrative data, and their backing endpoints exist.
- **Proposed:** roadmap items.

**Reset the demo data:** stop `npm run dev`, delete `server/data/campaigniq-python.db`, and start again. The database is re-created and re-seeded, which removes the plans and callbacks created during a demo.

### Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts FastAPI (with auto-reload) and Vite together |
| `npm test` | Python tests (planning engine, API, extension points) plus the legacy TypeScript tests |
| `npm run build` | Python compile check, legacy server type check and the production web build (`web/dist`) |
| `npm run seed -w server` | Creates the database schema and, if the database is empty, loads the seed workbook (idempotent) |
| `python scripts/generate_synthetic_workbook.py` (in `server/`) | Rebuilds the synthetic data workbook and the filter masters (`data/reference/*.json`) |
| `python -m campaign_api.workbook [file.xlsx]` (in `server/`) | Wipes the database and reloads it from a workbook (default: the seed workbook) |
| `npm run build -w web` | Builds only the web app |

---

## 2. Architecture

```
                         ┌───────────────────────────────────────────────┐
  Browser                │  web/ (React 18 + TypeScript + Vite)          │
  http://localhost:5173  │                                               │
                         │  login.tsx ─ sign-in (master + persona IDs)   │
                         │  App.tsx  ── sidebar, filter bar, routing     │
                         │  bh/ mh/ pm/ tm/ ─ V2 persona workspaces      │
                         │  screens/ ─ P.1–P.3, S1–S7, AI.1, ADM (V1)    │
                         │  ui/LiveCopilot.tsx ─ live AI chat            │
                         │  data/reference.ts ─ states/districts/products│
                         │  data/datasets.ts  ─ useDataset() demo↔live   │
                         │  data/copilot.ts   ─ AI Copilot client ──────┼──┐ no backend:
                         └──────────────┬────────────────────────────────┘  │ browser calls
                                        │ fetch  VITE_API_URL (/api/...)    │ the free LLM
                         ┌──────────────▼────────────────────────────────┐  │ directly
                         │  server/campaign_api (Python FastAPI)         │  │
                         │  main.py      planning, plans, field, reports │  │
                         │  engine.py    campaign planning engine        │  │
                         │  workbook.py  seed / import data workbook     │  │
                         │  reference.py /api/reference  (masters)       │  │
                         │  datasets.py  /api/datasets   (screen data)   │  │
                         │  copilot/     /api/copilot    (LLM)  ─────────┼──┤
                         └───────┬───────────────┬───────────────────────┘  │
                                 │               │                          ▼
     SQLite DB ◄─ filled from ───┘   server/data/reference/*.json     LLM provider:
     data/seed/mahadhan_synthetic_   server/data/datasets/catalog.json  free (default: LLM7 →
     data.xlsx on first start                                          Pollinations, no key) /
                                                                       OpenAI / Azure / Ollama
```

Design rules used throughout:

1. **Demo first, live when available.** Every placeholder has a working fallback. If the API is down or no data is uploaded, the UI still renders the mockup; if the backend's LLM call fails, the browser calls the free LLM itself, and only then do the built-in answers appear.
2. **One source of truth per concept.** Masters live in `server/data/reference/*.json`. Dataset definitions live in `server/data/datasets/catalog.json`. The API and the web app both read these same files.
3. **Configuration over code.** Adding a district, product or dataset upload, or switching the LLM, needs no code change.

---

## 3. Folder structure

```
campaigniq/
├── package.json              npm workspaces (server, web) + "dev/test/build" scripts
├── .env.example              all settings (copy to server/.env)
├── docs/
│   ├── screen-inventory.md   every screen, its route and source mockup photo
│   ├── product-manager-persona.md  V2 persona layer + the 48 Product Manager screens (routes, overlays, conventions)
│   ├── screen-api-map.md     which API serves which screen
│   ├── engine.md             planning-engine equations + worked example
│   └── gaps.md               open data/product questions
├── server/
│   ├── requirements.txt      fastapi, uvicorn, python-multipart, openpyxl
│   ├── campaign_api/
│   │   ├── main.py           FastAPI app + planning/plan/field/report/import endpoints
│   │   ├── engine.py         pure planning engine (segment → goal → farmers → activity mix → budget → checks)
│   │   ├── db.py             SQLite schema, migrations; seeds from the workbook (built-in seed = fallback)
│   │   ├── workbook.py       loads a data workbook (.xlsx) into the DB + datasets; CLI and /api/import/workbook
│   │   ├── settings.py       loads server/.env
│   │   ├── reference.py      /api/reference - states, districts, products, crops, seasons, campaign types
│   │   ├── datasets.py       /api/datasets  - CSV/JSON upload that replaces screen demo data
│   │   └── copilot/
│   │       ├── providers.py  LLM adapters (free [default], demo, openai, azure_openai) - add new vendors here
│   │       ├── context.py    builds the grounded evidence sent to the LLM (+ document-retrieval placeholder)
│   │       ├── schema.py     request/answer contracts (AI.1 structured answer, persona chat)
│   │       └── router.py     /api/copilot/status, /api/copilot/ask, /api/copilot/chat
│   ├── scripts/
│   │   └── generate_synthetic_workbook.py   builds data/seed/*.xlsx and data/reference/*.json (fixed seed)
│   ├── data/
│   │   ├── seed/             mahadhan_synthetic_data.xlsx                    ← all backend demo data (synthetic)
│   │   ├── reference/        geography.json, products.json, masters.json   ← edit to add states/districts/products
│   │   ├── datasets/         catalog.json                                   ← list of data placeholders
│   │   └── prompts/          copilot_system.md (AI.1), copilot_chat.md (persona copilots) ← LLM instructions
│   ├── tests_python/         unittest suites (engine, API, workbook, copilot, extension points)
│   ├── src/, tests/          legacy TypeScript/Express prototype (kept for its tests; not used by the web app)
└── web/
    ├── index.html, vite.config.ts, tsconfig.json
    └── src/
        ├── main.tsx          React entry
        ├── App.tsx           shell: sidebar, filter bar, search, toast, screen registry
        ├── nav.ts            screen/module registry, NavContext (filters, scope, reference)
        ├── ui.tsx            shared UI components (Panel, Kpi, DataTable, Donut, Funnel, DataBadge…)
        ├── styles.css        theme (Mahadhan greens), layout, components
        ├── responsive.css    phone / tablet layouts, container queries
        ├── enhance.css       visible scrollbars, tooltips, full-screen panels, sortable tables, motion
        ├── api.ts            fetch helper (VITE_API_URL) + live API call log (useApiLog)
        ├── login.tsx, personaAuth.ts, session.ts   sign-in page, master + persona credentials, session shape
        ├── data/
        │   ├── reference.ts  useReference(), filter options, filter → scope ids
        │   ├── datasets.ts   useDataset(name, demoRows), refreshDatasets()
        │   └── copilot.ts    getCopilotStatus(), askCopilot(), chatCopilot() (backend first, browser LLM fallback)
        ├── ui/               shared kit (KpiCard, MapCard, charts) + LiveCopilot.tsx (live AI chat)
        ├── map/              IndiaDistrictMap (districts, Jalna talukas, verified places in places.json)
        ├── bh/               Business Head persona (V2)
        ├── mh/               Marketing Head persona (V2)
        ├── pm/               Product Manager persona (V2): 48 screens PM.1 – PM.AI1, see docs/product-manager-persona.md
        ├── tm/               Territory Manager persona (V2): 17 screens, see section 0
        └── screens/
            ├── prototype.tsx/.css  P.1–P.3 Prototype Showcase (overview, live planner, live execution)
            ├── s1.tsx/.css   S1.1–S1.5 Business Overview
            ├── s2.tsx/.css   S2.1–S2.5 Market Opportunities
            ├── s3.tsx/.css   S3.1–S3.4 Crop Nutrition
            ├── s4.tsx/.css   S4.1–S4.5 Campaign Planning
            ├── s5.tsx/.css   S5.1–S5.4 Demand & Channel Readiness
            ├── s6.tsx/.css   S6.1–S6.2 Orchestration Hub / Activity Tracker
            ├── s7.tsx/.css   S7.1–S7.2 Campaign Results
            ├── ai.tsx/.css   AI.1 AI Copilot
            └── admin.tsx     ADM Data Sources & Integrations
```

---

## 4. How the tool was built - step by step

These are the steps in the order the tool was built. To rebuild it from scratch, or understand one part, follow the matching step.

### Step 1 - Monorepo skeleton

1. Created `campaigniq/package.json` with npm **workspaces** `["server", "web"]`. One `npm install` installs everything, and `npm run dev -w web` targets a single package.
2. Added `concurrently` so `npm run dev` starts the API and the web app in one terminal.
3. Created `docs/` for the specification notes.

### Step 2 - Backend: database and seed (`server/campaign_api/db.py`)

1. Chose **SQLite** (one file, zero setup). `CAMPAIGNIQ_DB` points to another file.
2. Defined tables for masters (season, crop, product, geography/market units), the activity library, plans and plan lines, calendar events, field reports, farmers and consent, callbacks, sales and audit flags.
3. Wrote an idempotent seed with illustrative data (Onion/Croptek, Nashik and Jalna market units, dealers, callbacks).
4. `connect()` is a context manager that commits on success, so every endpoint uses `with connect() as db:`.

### Step 3 - Backend: planning engine (`server/campaign_api/engine.py`)

A pure function, `calculate_plan(...)`, turns market inputs into a campaign plan. The steps are: segment → area goal → farmers to convert → activity mix → activity counts → budget and phasing → health checks. The equations and a worked example are in [docs/engine.md](docs/engine.md). Because it is pure, it is unit-tested directly (`tests_python/test_engine.py`).

### Step 4 - Backend: HTTP API (`server/campaign_api/main.py`)

1. Created the FastAPI app with CORS for `localhost:5173`.
2. Added endpoints for filters, market units, segments, plan calculate/save/submit/approve/lock/revise, calendar generation, stock needs, field event reporting, callbacks, consent, CSV imports and weekly/monthly reports. The full list is in [docs/screen-api-map.md](docs/screen-api-map.md).
3. Pydantic models validate every request body.

### Step 5 - Frontend scaffold (`web/`)

1. Vite + React 18 + TypeScript in strict mode (`noUnusedLocals`, `noUnusedParameters`).
2. `lucide-react` for icons. Charts (donut, funnel, bars, gantt, heatmaps, maps) are small hand-written SVG/CSS components in `ui.tsx`, so they match the mockups pixel-for-pixel.

### Step 6 - Design system from the mockups (`styles.css`, `ui.tsx`)

1. Read every mockup photo and extracted the shared look: Mahadhan dark/mid/light greens, amber and red risk colours, rounded white panels, numbered panel headers, KPI tiles with sparklines, pills, breadcrumbs and "Navigation flow" footers.
2. Encoded the colours once in `COLORS` and in CSS variables.
3. Built reusable components: `Btn`, `Pill`, `Panel`, `Kpi`/`KpiRow`, `DataTable`, `Donut`, `Funnel`, `StackFunnel`, `HBars`, `VBars`, `RegionMap`, `Breadcrumbs`, `PageHeader`, `SourceBar`, `FlowFooter`, `Stepper`, `AiItem`, `ContextStrip`, `Check`, `Grid`, `Note` and `DataBadge`.

### Step 7 - Application shell (`App.tsx`, `nav.ts`)

1. `nav.ts` lists the **modules** (sidebar items) and **screens** (`S1.1`…`AI.1`, `ADM`) with their titles.
2. `App.tsx` renders the left sidebar (the active module expands to show its screens), the top **filter bar** (Season, Geography, District, Crop, Product Portfolio, Campaign Type), the search box, notifications and the user menu.
3. Routing uses the URL hash (`#/s2.3`), so every screen can be bookmarked and the back button works.
4. `NavContext` gives every screen `go(screenId)`, `toast(message)`, the current `filters`, the master-id `scope` and the `reference` data.
5. Each module remembers its own filter selection. Strategy screens default to *India / All*; the drill-down modules default to *Maharashtra / Jalna / Onion / Croptek*, as in the mockups.
6. **Responsive layout** (`web/src/main.tsx`, `web/src/responsive.css`). One code base serves phones, tablets, laptops and large monitors:

   | Window width | Mode | What happens |
   |---|---|---|
   | < 768 px | Phone | Sidebar becomes a slide-in menu (☰). Filters sit behind a **Filters** button. Everything is one column, with KPI tiles two per row. |
   | 768–1199 px | Tablet | Slide-in menu. The filter bar wraps. Panels reflow to two columns; the KPI tiles show three per row. |
   | 1200–1535 px | Laptop | The exact mockup layout, scaled down proportionally (`--app-zoom`), so nothing is squeezed. |
   | 1536–1920 px | Desktop | Native size; the content fills the full width. |
   | > 1920 px | Wide / 4K | The 1920 px layout is scaled up, so panels don't stretch and leave empty space. |

   Widgets inside panels (two-column splits, decision trees, map callouts, gantt labels) use CSS **container queries**: they adapt to the width of their own panel, not the device. Wide tables and genuine timelines scroll sideways inside their panel; the page itself never scrolls sideways. To adjust the thresholds, change `RESPONSIVE_BELOW`, `DESIGN_WIDTH`, `WIDE_WIDTH` and `MAX_ZOOM` in `main.tsx` together with the `1199.98px` / `767.98px` media queries. New screens get this behaviour automatically when they use `Grid`, `Panel` and `KpiRow` from `ui.tsx`.

### Step 8 - The screens (`web/src/screens/*.tsx`)

Each module is one file, with one exported component per screen, built by reading the matching mockup photo panel by panel:

| File | Screens | Main interactions |
|---|---|---|
| `s1.tsx` | S1.1 Business Overview, S1.2 Portfolio, S1.3 Executive Summary, S1.4 Risk Analysis, S1.5 Recovery Plan | State map drill-down, portfolio search/risk filter, risk → root cause, replanning options |
| `s2.tsx` | S2.1 Market Opportunities, S2.2 Jalna Taluka View, S2.3 Micro-Market Segmentation, S2.4 Competition & Channel, S2.5 Recommendations | Market ranking → district → taluka → segment → campaign recommendation |
| `s3.tsx` | S3.1 Nutrition Calendar, S3.2 Stage Intelligence, S3.3 Programme Builder, S3.4 Trigger Engine | Growth-stage tracker, editable programme rows, trigger queue → campaign draft |
| `s4.tsx` | S4.1 Templates, S4.2 Creation Wizard, S4.3 Activity Mix, S4.4 Campaign Scenarios, S4.5 Approval | Shared campaign state across the studio, live budget/reach maths, approval routing and audit log |
| `s5.tsx` | S5.1 Demand Projection, S5.2 Stock Readiness, S5.3 Dealer Readiness, S5.4 Supply Risk Planner | Forecast assumptions → demand, stock-gap heatmap, dealer matrix, replenishment plan |
| `s6.tsx` | S6.1 Activity Tracker, S6.2 Activity Follow-up | Calendar, owner allocation, kanban, attendance capture, replanning |
| `s7.tsx` | S7.1 Impact Dashboard, S7.2 Diagnostics & Learning | Cluster/channel effectiveness, root-cause factors, learnings library |
| `ai.tsx` | AI.1 Copilot Workspace | Suggested questions, history, free-text questions (LLM or built-in answers) |
| `admin.tsx` | ADM Data Sources & Integrations | Dataset status, template download, upload or revert, masters, LLM status |

Each screen's mockup photo is listed in [docs/screen-inventory.md](docs/screen-inventory.md). Small inconsistencies between mockup photos were reconciled and are documented there.

### Step 9 - Reference data placeholders (more states, districts, products)

1. Moved every master list out of code into `server/data/reference/`:
   * `geography.json`: states → districts → talukas, with a `has_data` flag per district.
   * `products.json`: Mahadhan products with family, pack sizes and suitable crops.
   * `masters.json`: crops, seasons and campaign types.
2. `server/campaign_api/reference.py` validates these files with Pydantic models, rejects duplicate ids and serves them at `GET /api/reference`. `PUT /api/reference/{kind}` replaces a file after validation; this is the hook for a future admin UI or MDM sync.
3. `web/src/data/reference.ts` loads `/api/reference`. It also **bundles the same JSON files** as a fallback, so the filter bar always works. It builds the filter options (the District list follows the selected state) and converts the display names into master ids (`scope`) for the APIs.

### Step 10 - Screen data placeholders (real data later)

1. Every table that should come from a business system is declared in `server/data/datasets/catalog.json` with a name, screen(s), expected source system, refresh frequency and columns.
2. `server/campaign_api/datasets.py`:
   * `GET /api/datasets` lists every dataset as `demo` or `live`.
   * `GET /api/datasets/{name}/template` downloads an empty CSV with the right columns.
   * `POST /api/datasets/{name}` uploads CSV/JSON, checks the required columns and stores the rows in the `dataset_upload` table.
   * `GET /api/datasets/{name}?state=&district=&crop=&product=…` returns rows for the current filter scope. It returns 404 when nothing has been uploaded, which tells the screen to keep its demo data.
   * `DELETE /api/datasets/{name}` reverts to demo data.
3. `web/src/data/datasets.ts` provides the hook `useDataset(name, DEMO_ROWS)`. It returns the demo rows until live rows exist for the current scope, then switches automatically.
4. Panels pass the result to `<Panel data={...}>`, which shows a small **DEMO** or **LIVE** badge. Clicking the badge opens the Data Sources screen.
5. Twelve key tables are already connected: S1.1/S1.2/S1.3 campaign portfolio, S2.1 top markets, S2.2 taluka ranking, S3.4 trigger queue, S5.1 village demand, S5.2 stock heatmap, S5.3 dealers and cluster supply, S6.1 field owners, S7.1 cluster conversion and channel effectiveness, and S7.2 geography performance.

### Step 11 - AI Copilot LLM integration

1. **Answer contract.** `copilot/schema.py` defines `CopilotAnswer`, which has the same shape as the answer cards on AI.1: title, summary, table, chart, factors, confidence, sources, actions, primary and secondary call-to-action.
2. **Providers.** `copilot/providers.py` has an `LLMProvider` base class and four implementations:
   * `free` (default): keyless free endpoints, LLM7 then Pollinations (open-weight `gpt-oss-20b` and similar). Honours short `Retry-After` waits, then falls back to the next endpoint.
   * `demo`: no LLM.
   * `openai`: OpenAI or any OpenAI-compatible server, such as Ollama, vLLM, LM Studio or a corporate gateway.
   * `azure_openai`.

   It uses only the Python standard library (no SDK lock-in).
3. **Grounding (RAG).** `copilot/context.py` collects what the model may use: the filter scope, the products and states masters, matching rows from uploaded datasets (ranked by relevance to the question, with a size budget) and `retrieve_documents()`. `retrieve_documents()` is a placeholder for a future vector store of approved SOPs and agronomy content.
4. **Prompt.** `server/data/prompts/copilot_system.md` tells the model to answer only from the supplied context, never invent doses or prices, separate correlation from causation, and reply in the JSON contract.
5. **Endpoint.** `POST /api/copilot/ask`:
   * Builds the context and calls the provider.
   * Strips code fences and validates the JSON.
   * **Removes links to screens that do not exist** and fixes invalid table highlights.
   * Returns `mode: "demo"` when no LLM is configured, and 502 when the LLM fails or returns malformed output.
6. **Screen.** `ai.tsx` checks the copilot status (`web/src/data/copilot.ts`):
   * Typed and suggested questions go to the LLM: through the backend when it is connected, otherwise straight from the browser to the same free endpoints. The header shows "LLM connected · model".
   * If every LLM call fails, it falls back to the built-in keyword-matched answers. The layout is identical either way.
7. **Persona copilots.** TM.AI1, PM.AI1, MH.AI1 and BH.AI1 embed `web/src/ui/LiveCopilot.tsx`. Each screen passes a fact sheet of the figures that persona's screens show (e.g. `TM_FACTS` in `tm/execution.tsx`); `POST /api/copilot/chat` adds matching datasets and live KPIs and applies `server/data/prompts/copilot_chat.md`. Answers are short Markdown, labelled with the model and the route (backend or browser).

### Step 12 - Data Sources & Integrations screen (`admin.tsx`)

It lists all datasets with their status, the screens that use them, the expected source and the columns, and offers **Template / Upload / Use demo** buttons. It also shows the geography and product masters and the LLM connection status with setup instructions.

### Step 13 - Tests and verification

* `tests_python/test_engine.py`: planning-engine equations and the worked example.
* `tests_python/test_api.py`: seeded market, calculator golden case, plan lifecycle and role guard, reports.
* `tests_python/test_extensions.py`:
  * Reference listing and editing, including duplicate rejection.
  * Dataset demo → upload → scope filter → revert, and column validation.
  * Copilot demo mode, a grounded LLM answer (mock provider) with link sanitising, and malformed LLM output.
  * Free-provider default, rate-limit wait and endpoint fallback, all-endpoints-busy error, and the persona chat endpoint (all mocked, no network).
* `tests_python/test_api.py` also covers the workbook seed (all 12 datasets live), the guarded workbook import, a full reload round trip and the built-in seed fallback.
* Every screen was checked in a browser at 1536 px wide against its mockup.

---

## 5. Extending the tool

### 5.1 Add states, districts and talukas

Edit `server/data/reference/geography.json`:

```json
{
  "id": "madhya-pradesh",
  "name": "Madhya Pradesh",
  "districts": [
    { "id": "indore", "name": "Indore", "talukas": ["Mhow", "Depalpur", "Sanwer"], "has_data": false }
  ]
}
```

* `id` is lower-case kebab-case and must be unique (duplicates are rejected). Use the same id in your data files (`state`/`district` columns).
* Set `has_data: true` once real data for that district has been uploaded. The Data Sources screen shows it as "data".
* Refresh the browser. The Geography and District filters pick up the change, with no restart needed.
* Alternatively call `PUT /api/reference/geography` with the full JSON (for example from an MDM sync job).

### 5.2 Add products, crops, seasons and campaign types

* **Products:** `server/data/reference/products.json`. Add `{ "id": "newtek", "name": "Newtek", "family": "...", "pack_sizes_kg": [25], "crops": ["onion"], "active": true }`. Set `active: false` to hide a product from filters without deleting it. Agronomic doses and prices stay in the backend product tables; they are not stored here.
* **Crops, seasons, campaign types:** `server/data/reference/masters.json`. Mark the current season with `"current": true`.
* To make the *planning engine* use a new product or crop, also add it to the database master tables (`db.py` seed, or import with `POST /api/import/market` / `POST /api/import/sales`).

### 5.3 Replace demo data with real data

**The data workbook (all backend data in one Excel file):**

`server/data/seed/mahadhan_synthetic_data.xlsx` holds every backend table (geography, MUs, field force, crops and
stages, products and doses, market data, segment rules, activities, playbooks, campaign plans, field events,
farmers, call-backs, audit flags, sales and demo results), plus one `ds.<dataset>` sheet per screen dataset. Its
README sheet lists the calibration assumptions. All of it is **synthetic**: it is calibrated to approximate public
figures (district crop areas, mandi prices and MSP, typical doses, Mahadhan pack sizes), not Mahadhan actuals.

* An empty database is filled from the workbook automatically on start-up (Render rebuilds its database on every
  deploy). `CAMPAIGNIQ_SEED=builtin` uses the small hand-written seed in `db.py` instead.
* Campaign plan budgets, activity counts and checks are recomputed by the planning engine when the workbook loads.
* Dates are moved forward by (today − the workbook's reference date) so the season stays current;
  `CAMPAIGNIQ_SEED_SHIFT_DATES=0` turns this off.
* To patch in edited or real data, keep the sheet and column names and either run
  `python -m campaign_api.workbook my_data.xlsx` (in `server/`), or upload the file to the running API. Upload
  replaces all data, so it is disabled unless `CAMPAIGNIQ_ADMIN_TOKEN` is set:
  `curl.exe -H "X-Admin-Token: <token>" -F "file=@my_data.xlsx" http://localhost:8000/api/import/workbook`.
  `GET /api/import/workbook` downloads the bundled workbook as a template.
* `server/scripts/generate_synthetic_workbook.py` regenerates the synthetic workbook (fixed random seed, so the
  output is repeatable) and the filter masters in `data/reference/`.

**From the UI:**

1. Open **Data Sources & Integrations** (bottom of the sidebar), or click any **DEMO** badge on a panel.
2. Click **Template** next to the dataset to download a CSV with the right columns plus the optional scope columns.
3. Fill it from the source system (ERP, CRM, field app, ...). One file can cover many states, districts and products: fill the scope columns `season, state, district, taluka, crop, product, campaign_type` with master **ids** (or names; matching ignores case and spaces). Leave a scope column empty for rows that apply everywhere.
4. Click **Upload** and choose the file (CSV or JSON). The badge on the screen turns **LIVE**, and the panel shows the rows that match the current filters.
5. **Use demo** removes the upload and returns the screen to its illustrative values.

**From a script or ETL job:**

```powershell
curl.exe -F "file=@clusters.csv" "http://localhost:8000/api/datasets/impact.cluster_conversion?source=CRM%20export"
curl.exe "http://localhost:8000/api/datasets/impact.cluster_conversion?state=maharashtra&district=jalna"
curl.exe -X DELETE "http://localhost:8000/api/datasets/impact.cluster_conversion"
```

JSON uploads may be an array of objects or `{ "rows": [...] }`.

### 5.4 Put a data placeholder on another table or chart

Example: make the S2.4 competitor table data-driven.

1. **Declare it** in `server/data/datasets/catalog.json`:

   ```json
   {
     "name": "atlas.competitors", "title": "Competitor comparison", "screen": "s2.4", "screens": ["s2.4"],
     "source_system": "Market research", "refresh": "seasonal",
     "description": "Product value, price and retailer push by competitor.",
     "columns": [ { "name": "product", "type": "string" }, { "name": "price", "type": "string" } ]
   }
   ```

2. **Use it** in the screen component. Rows must be plain values (strings, numbers, booleans); icons and JSX stay in the render code:

   ```tsx
   import { useDataset } from '../data/datasets';

   const competitors = useDataset('atlas.competitors', COMPETITORS);   // COMPETITORS = existing demo array
   <Panel title="Competitor Comparison" data={competitors}>
     <DataTable rows={competitors.rows} columns={...} />
   </Panel>
   ```

3. Restart the API (it reads the catalog on each request, so a browser refresh is usually enough). The dataset then appears on the Data Sources screen with its template.

Good next candidates (still hard-coded): S1 KPI tiles and funnels, S2.3 segments, S2.4 competitors, S3.1 crop calendar, S4.1 templates, S5.4 transfers, S6.2 tasks and S7.2 learnings.

### 5.5 Connect the AI Copilot to an LLM

**Default: live AI with no API key.** `COPILOT_PROVIDER=free` (the default) calls free, keyless OpenAI-compatible
endpoints: LLM7 first, Pollinations as the fallback. Both serve open-weight models (mainly `gpt-oss-20b`).

* All copilots are live: AI.1 (structured analysis, `POST /api/copilot/ask`) and the persona copilots TM.AI1,
  PM.AI1, MH.AI1 and BH.AI1 (`POST /api/copilot/chat`). Each persona screen sends the figures it shows, and the
  backend adds matching datasets and live KPIs (`server/data/prompts/copilot_chat.md` holds the rules).
* Without a backend (e.g. the GitHub Pages site) the browser calls the same free endpoints directly with the same
  prompts (`web/src/data/copilot.ts`).
* Limits: the free services are best-effort and rate-limited (Pollinations: about one reply per 45 seconds per IP).
  The client honours short `Retry-After` waits and falls back between endpoints; if both are busy, the chat says
  so. Questions and on-screen (illustrative) figures are sent to these third-party services, so do not use them
  with confidential data. For production, switch to a paid or self-hosted model as below.

To use your own model instead:

1. Copy `.env.example` to `server/.env` and set the provider:

   **OpenAI**
   ```env
   COPILOT_PROVIDER=openai
   COPILOT_MODEL=gpt-4o-mini
   COPILOT_API_KEY=<your key>
   ```

   **Azure OpenAI**
   ```env
   COPILOT_PROVIDER=azure_openai
   COPILOT_AZURE_ENDPOINT=https://<resource>.openai.azure.com
   COPILOT_AZURE_DEPLOYMENT=<deployment name>
   COPILOT_API_KEY=<your key>
   ```

   **Local / self-hosted model (Ollama, vLLM, LM Studio), no key needed**
   ```env
   COPILOT_PROVIDER=openai
   COPILOT_BASE_URL=http://localhost:11434/v1
   COPILOT_MODEL=llama3.1
   ```

2. Restart `npm run dev`. `.env` changes are not picked up by auto-reload.
3. Check `http://localhost:8000/api/copilot/status`. It should show `"mode": "llm"`. AI.1 and the Data Sources screen show **LLM connected**.
4. Ask a question on AI.1. The answer is grounded in the filter scope and the uploaded datasets. With no relevant data uploaded, the model is instructed to say so and give *Low* confidence.

**Customise:**

* **Instructions / tone:** edit `server/data/prompts/copilot_system.md` (or point `COPILOT_SYSTEM_PROMPT` at another file).
* **Knowledge documents (RAG):** implement `retrieve_documents()` in `server/campaign_api/copilot/context.py`. Return `[{title, source, text}]` from your vector store (Azure AI Search, pgvector, ...). Only include approved agronomy content.
* **Another vendor** (Gemini, Bedrock, an internal API, ...): subclass `LLMProvider` in `providers.py`, implement `configured` and `generate(messages) -> str` (the JSON text), and register it in `PROVIDERS`. Then set `COPILOT_PROVIDER=<your key>`.

### 5.6 Add a new screen

1. Add the id to the `ScreenId` type and an entry to `SCREENS` in `web/src/nav.ts`.
2. Write the component (normally in the module's `screens/sN.tsx`), using the components from `ui.tsx`.
3. Register it in `REGISTRY` in `web/src/App.tsx`.
4. If the copilot may link to it, add the id to `SCREEN_IDS` in `server/campaign_api/copilot/context.py` and to the list in `copilot_system.md`.

---

## 6. Configuration reference

Settings come from real environment variables, or from `server/.env` (environment variables take precedence). See `.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `CAMPAIGNIQ_DB` | `server/data/campaigniq-python.db` | SQLite file |
| `CAMPAIGNIQ_REFERENCE_DIR` | `server/data/reference` | Folder with geography/products/masters JSON |
| `CAMPAIGNIQ_DATASET_CATALOG` | `server/data/datasets/catalog.json` | Dataset catalog |
| `CAMPAIGNIQ_ENV_FILE` | `server/.env` | Settings file location |
| `CAMPAIGNIQ_SEED` | `workbook` | Seed for an empty database: `workbook` (synthetic data workbook) or `builtin` (small hand-written seed in `db.py`) |
| `CAMPAIGNIQ_SEED_WORKBOOK` | `server/data/seed/mahadhan_synthetic_data.xlsx` | Workbook used for seeding and by `python -m campaign_api.workbook` |
| `CAMPAIGNIQ_SEED_SHIFT_DATES` | `1` | `0` stops moving workbook dates forward to today when loading |
| `CAMPAIGNIQ_ADMIN_TOKEN` | - | Enables `POST /api/import/workbook` (sent as `X-Admin-Token`); unset = import disabled |
| `CAMPAIGNIQ_CORS_ORIGINS` | - | Extra browser origins allowed to call the API (comma-separated), e.g. `https://bhadurishayoun.github.io` (set on Render) |
| `COPILOT_PROVIDER` | `free` | `free` (keyless LLM7 → Pollinations), `demo` (no LLM), `openai` or `azure_openai` |
| `COPILOT_FREE_URL`, `COPILOT_FREE_MODEL` | - | Pin the `free` provider to one OpenAI-compatible endpoint / model |
| `COPILOT_MODEL` | - | Model name (OpenAI-compatible) |
| `COPILOT_API_KEY` | - | API key (OpenAI / Azure) |
| `COPILOT_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `COPILOT_AZURE_ENDPOINT`, `COPILOT_AZURE_DEPLOYMENT`, `COPILOT_AZURE_API_VERSION` | -, -, `2024-06-01` | Azure OpenAI |
| `COPILOT_TIMEOUT_SECONDS` | `60` | LLM request timeout |
| `COPILOT_SYSTEM_PROMPT` | `server/data/prompts/copilot_system.md` | AI.1 system prompt file (the persona chat prompt is `copilot_chat.md` next to it) |
| `VITE_API_URL` (build time) | dev: `http://localhost:8000/api`; GitHub Pages: `https://mahadhan-campaigniq-api.onrender.com/api` | API address used by the web app. The Pages workflow uses the repository variable `VITE_API_URL` if set, else the Render URL. A local `npm run build` without it produces a site with no backend. |

---

## 7. API reference

Interactive documentation: **http://localhost:8000/docs**.

| Area | Endpoints |
|---|---|
| Reference masters | `GET /api/reference`, `GET /api/reference/{geography\|products\|masters}`, `PUT /api/reference/{kind}` |
| Screen datasets | `GET /api/datasets`, `GET /api/datasets/{name}?season=&state=&district=&taluka=&crop=&product=&campaign_type=`, `GET /api/datasets/{name}/template`, `POST /api/datasets/{name}` (multipart `file`), `DELETE /api/datasets/{name}` |
| AI Copilot | `GET /api/copilot/status`, `POST /api/copilot/ask` `{question, scope, screen, history}` (AI.1 structured answer), `POST /api/copilot/chat` `{question, persona, screen, page_context, scope, history}` (persona copilots, Markdown answer) |
| Data workbook | `GET /api/import/workbook` (download the seed workbook), `POST /api/import/workbook` (multipart `file`, header `X-Admin-Token`; replaces all data) |
| Planning & workflow | `GET /api/meta/filters`, `/api/market/mus`, `/api/segments/summary`, `POST /api/plans/calculate`, plan lifecycle `/api/plans/{id}/submit\|approve\|lock\|revise`, `/generate-calendar`, `/stock-needs`, field events, callbacks, consent, imports and reports. Full map: [docs/screen-api-map.md](docs/screen-api-map.md) |

---

## 8. Testing and building

```powershell
npm test            # Python unittest (engine, API, extension points) + legacy vitest
npm run build       # compile checks + production web build in web/dist
```

Run only the Python tests: `cd server; python -m unittest discover -s tests_python` (25 tests; they never call the real LLM). Type-check the web app: `npx tsc --noEmit -p web`.

**Deploying (current setup):** pushing to `main` deploys both parts automatically.

1. **Website:** `.github/workflows/deploy.yml` builds `web/` with `VITE_API_URL` and publishes it to GitHub Pages. Check the run under the repository's **Actions** tab.
2. **Backend:** Render (`render.yaml`, service `mahadhan-campaigniq-api`) redeploys from `main`, installs `requirements.txt` and starts uvicorn. Environment variables are set in the Render dashboard (`CAMPAIGNIQ_CORS_ORIGINS`, `COPILOT_PROVIDER=free`, optionally `COPILOT_API_KEY`). Step-by-step first-time setup: [DEPLOYMENT.md](../DEPLOYMENT.md).
3. **Other hosts:** serve `web/dist` from any static host (set `VITE_API_URL` at build time) and run `python -m uvicorn campaign_api.main:app --host 0.0.0.0 --port 8000` from `server/`, with the web origin in `CAMPAIGNIQ_CORS_ORIGINS`.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Page does not load at `localhost:5173` | `npm run dev` is not running. Start it and wait for "Local: http://localhost:5173". |
| Screens load but every badge says DEMO | That is expected until data is uploaded. If uploads fail, check that the API at `http://localhost:8000/api/health` responds. |
| Data Sources screen says "API is not reachable" | Start the API (`npm run dev`) or set `VITE_API_URL` correctly. |
| Upload error "Missing required columns" | Start from the **Template** CSV; column names must match exactly. |
| Upload error "Unknown dataset" | Add the dataset to `server/data/datasets/catalog.json` first. |
| Uploaded data not shown on a screen | The rows' scope columns don't match the filter bar (for example `district=nashik` while the filter is Jalna). Change the filters or leave scope columns empty. |
| Copilot still shows "Illustrative AI output" / `/api/copilot/status` says `demo` | `server/.env` sets `COPILOT_PROVIDER=demo` (an old copy of `.env.example`). Set it to `free` and restart the API. |
| Copilot says "the free service limits how often it replies" (HTTP 402/429) | The free endpoints are rate-limited (Pollinations ≈ 1 reply per 45 s per IP). Wait a minute; the client already waits out short limits and switches endpoints. For heavy use configure a paid model (section 5.5). |
| Toast "Copilot LLM unavailable (...)" on AI.1 | Both the backend and the browser LLM calls failed, or the model returned invalid JSON. The built-in answer is shown instead. |
| API changes don't take effect locally (Windows) | `uvicorn --reload` left an old worker on port 8000. Stop all `uvicorn` Python processes (Task Manager or `Get-CimInstance Win32_Process -Filter "Name='python.exe'"`), then `npm run dev` again. |
| Live site: Prototype screens say "backend unreachable" or the first copilot answer is slow | The free Render backend is waking up (up to 1 minute). Reload after a minute. |
| Local database still has the old data after changing the workbook | Seeding runs only on an empty database. Run `python -m campaign_api.workbook` in `server/` (it backs nothing up - copy the `.db` file first if you need it). |
| ₹ / — show as strange characters after editing a file | Save files as UTF-8 (without BOM). |
| Layout looks too small or too large | Expected scaling: below 1200 px the layout reflows; 1200–1535 px is scaled down; above 1920 px it is scaled up (see section 4, step 7.6). Browser zoom (Ctrl + / Ctrl −) still works on top of it. |

---

## 10. Before going to production

* **Authentication and authorisation:** the API has no login. `X-User-Role` is a demo header, not security, and the web sign-in (including the `MASTER001` showcase login) checks credentials in the browser only. The admin endpoints (`PUT /api/reference/*`, `POST`/`DELETE /api/datasets/*`, `POST /api/import/workbook`) must be restricted to administrators.
* **LLM provider:** the default `free` provider uses third-party, rate-limited, best-effort services that receive the questions and on-screen figures. Use a contracted or self-hosted model (`COPILOT_PROVIDER=openai` / `azure_openai`) for real data, and remove the browser-side fallback in `web/src/data/copilot.ts` if data must not leave your network.
* **Data:** replace the synthetic workbook with real exports (see section 0, limitations 1–2) and move persona screens from hard-coded figures to backend data.
* **Data governance:** uploaded datasets are stored as JSON rows in SQLite. For production, move to a managed database and replace manual uploads with scheduled ETL jobs that call the same endpoints or write to the same table.
* **Agronomy content:** doses, prices and crop-stage rules in the seed workbook are approximations (doses were raised to fit the engine's spend caps). They must come from approved Mahadhan sources.
* **LLM safety:** keep the system prompt's grounding rules, log questions and answers for review, and do not send personal farmer data to an external model without consent and a data-processing agreement.
* Open product and data questions are tracked in [docs/gaps.md](docs/gaps.md).
