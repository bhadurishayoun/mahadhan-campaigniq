# PROMPT: Build the backend for the Mahadhan Automated Campaign Management Tool

Copy everything below this line into the LLM / coding agent, together with the mockups folder.

---

## 1. Your role and the job

You are a senior full-stack engineer. Build the **backend logic, database and APIs** for an **Automated Campaign Management Tool** for **Mahadhan (Deepak NextGen)**, a crop nutrition (fertilizer) company. Then **connect the backend to the existing UI mockups** in the attached folder so every number, table, chart and button on the mockups works from real calculations.

The tool helps the marketing team decide, for each small market area:
- which **segment** the area is in,
- what **volume** to chase,
- which **activities** to run (demos, farmer meetings, field days and so on), **how many**, **when**,
- what the **budget** is,
- and then tracks **field execution** and **results**.

The tool is built by modifying an existing herbicide intelligence platform called **WeedIntel**. Keep its market, map and segmentation ideas but point them at crop nutrition.

**Do not build an ERP.** No inventory, invoicing, accounting, payroll, order processing or dealer ledger. Sales, dispatch and stock are only **imported** (CSV/API) and read.

---

## 2. Work in this order

1. **Read the mockups folder first.** List every screen. For each screen write down:
   - every number, KPI tile, table, chart, filter, form and button;
   - where its value must come from (stored data, a calculation in Section 5, or user input).

   Save this as `docs/screen-inventory.md`. Do not change the mockups' look or layout.
2. **Detect the mockups' tech** (plain HTML/JS, React, Vue and so on).
   - Default backend: **Node.js + Express + PostgreSQL** (SQLite is fine for the demo).
   - If the mockups or the user's setup point to Python, use **FastAPI + PostgreSQL** instead.
3. **Build the database** (Section 4) and **load the seed data** (Section 9).
4. **Build the calculation engine** (Section 5) as **pure functions** in one module (`engine/`), separate from the API code, with unit tests (Section 10).
5. **Build the APIs** (Section 7).
6. **Connect each mockup screen** to its APIs (Section 8).
7. Run the tests and the end-to-end demo script (Section 10), then give a short report of what works and what is still a placeholder.

---

## 3. Key terms (use these names in code)

| Term | Meaning |
|---|---|
| **MU** (Marketing Unit) | Smallest planning unit: about 10–12 villages (a tehsil/mandal). Goal, segment, activity plan and budget are set **per MU, per crop, per season**. |
| **Hierarchy** | MU → MDO (field officer) → SIO territory → MIE/AMM region → Zone → BU. The level names must be configurable. |
| **Crop area** | Acres of the crop in the MU. |
| **AMP** | Available Market Potential: the % of crop area Mahadhan can realistically treat. |
| **Treated %** | % of crop area currently using Mahadhan product = (Mahadhan volume sold ÷ dose per acre) ÷ crop area. |
| **Penetration of potential** | Treated % ÷ AMP %. Decides the segment. |
| **Activity (X)** | A demand-generation activity type, e.g. crop demo, field day, group farmer meeting. |
| **n** | How many units of an activity are planned. |
| **r** | Farmers reached per unit of an activity. |
| **k** | Conversion rate: share of reached farmers who buy. Learned from call-centre call-backs. |
| **c** | Unit cost of an activity (₹). |
| **LRR** | Liquidation Run Rate: the pace of sell-through to farmers. |

---

## 4. Database (minimum tables)

Use these tables; add fields if the mockups need them. Every master table has `id`, `name`, `active`, `created_at` and `updated_at`.

- `hierarchy_level` (level_no, configurable name)
- `geo_unit` (id, name, level, parent_id): state, district, tehsil, MU
- `mu` (id, geo_unit_id, villages_count, mdo_user_id)
- `user` (id, name, role: `admin | head_office | zone | region_manager | mdo | call_centre`, language, geo scope)
- `crop` (id, name, stage_anchor: `sowing | transplanting | planting | pruning`)
- `crop_stage` (crop_id, stage_name, start_day, end_day): days counted from the stage anchor date
- `product` (id, name, category, pack_kg, price_per_pack)
- `crop_product_dose` (crop_id, product_id, stage_id, dose_packs_per_acre)
- `season` (id, name e.g. "Rabi 2026", start_date, end_date, budget_lock_date)
- `market_data` (mu_id, crop_id, season_id, crop_area_acres, amp_pct, current_treated_pct, avg_area_per_farmer, competition_note, soil_deficiency_json, rainfall_dev_pct, crop_price, active_dealers, source, as_of_date)
- `segment_rule` (segment, min_pen, max_pen, objective, spend_cap_pct)
- `activity_type` (id, name, typical_reach r_default, conversion k_default, unit_cost c, phase_split_pre, phase_split_on, phase_split_post, evidence_required, bucket: `proven | scaling | pilot`)
- `playbook` (segment, activity_type_id, share_pct): which activities each segment uses and their share
- `campaign_plan` (id, mu_id, crop_id, season_id, product_id, target_treated_pct, anchor_date, status: `draft | submitted | approved | locked | live | closed`, version, created_by)
- `plan_line` (plan_id, activity_type_id, share_pct, r, k, c, n, budget, budget_pre, budget_on, budget_post), stored output of the engine
- `plan_check` (plan_id, check_name, value, limit, status: `green | amber | red`, message)
- `plan_audit` (plan_id, action, user_id, reason, before_json, after_json, at): every change, approval and replan
- `village`, `farmer` (village_id, phone, type: `innovative | potential`, area_acres, consent_record bool, consent_advice bool, consent_proof_url, language)
- `activity_event` (plan_id, activity_type_id, scheduled_date, mdo_user_id, status: `scheduled | done | missed | moved`, actual_date, attendance, actual_cost, gps_lat, gps_lng, photo_hash, photo_url)
- `event_contact` (activity_event_id, farmer_id)
- `callback` (farmer_id, activity_event_id, called_at, will_buy bool, bought bool, motivating_activity_type_id)
- `audit_flag` (activity_event_id, flag_type, detail, resolved)
- `sales_import` (mu_id, crop_id, product_id, month, packs_liquidated, po_packs)
- `demo_result` (activity_event_id, treated_yield, control_yield, unit, price)
- `config` (key, value): global defaults such as the capacity limit, call-back sample %, envelope split, prior strength

All defaults below are **seed values stored in tables/config, never hard-coded** in logic.

---

## 5. Calculation engine (the core; implement exactly)

### 5.0 The equation

The company's planning equation is:

> **Y = f(n₁X₁ + n₂X₂ + n₃X₃ + … + nₙXₙ)**
> Y = Goal (volume), X = which activity, n = how many of each activity.

The engine runs it **backwards**: start from the goal Y, work out how many farmers must convert, then the number n of each activity X, then the budget. Implement Steps 1–8 as pure functions with exactly these inputs and outputs.

### Step 1: Segment

```
penetration = current_treated_pct / amp_pct
segment = the segment_rule row where min_pen <= penetration < max_pen
```

Seed bands:

| Segment | Penetration | Objective | Spend cap |
|---|---|---|---|
| Emerging | < 0.25 | Establish | 0.30 |
| Growing | 0.25 – < 0.50 | Grow | 0.20 |
| Maturing | 0.50 – < 0.80 | Consolidate | 0.12 |
| Matured | ≥ 0.80 | Sustain | 0.08 |

A manager may override the segment, but must give a reason, and the override is stored in `plan_audit`.

### Step 2: Incremental area and volume goal (Y)

```
current_area      = crop_area × current_treated_pct
target_area       = crop_area × target_treated_pct
incremental_area  ΔA = target_area − current_area                   (if ≤ 0 → retention plan, see 5.9)
Y_packs           = target_area × dose_packs_per_acre               (total volume goal)
incremental_packs = ΔA × dose_packs_per_acre
Y_tons            = Y_packs × pack_kg / 1000
incremental_value = incremental_packs × price_per_pack
total_value       = Y_packs × price_per_pack
```

Validation: `target_treated_pct ≤ amp_pct`. If it is higher, raise a red check: "Target exceeds market potential".

### Step 3: Farmers to convert

```
F = ΔA / avg_area_per_farmer
```

Keep F as a decimal; do not round it.

### Step 4: Activity mix

Take the playbook rows for the MU's segment. The user may edit shares, but the shares must sum to 100% (validate this).

```
F_i = F × share_i
```

### Step 5: How many of each activity (n)

```
converts_per_unit_i = r_i × k_i
n_i = ceil( F_i / converts_per_unit_i )
```

r_i and k_i come from the learned values (5.8) if available, otherwise from `activity_type` defaults. Store which source was used, so the UI can show "default" or "learned (sample size N)".

### Step 6: Budget and phasing

```
budget_i = n_i × c_i
B        = Σ budget_i
budget_pre_i  = budget_i × phase_split_pre_i
budget_on_i   = budget_i × phase_split_on_i
budget_post_i = budget_i × phase_split_post_i        (the three splits sum to 1)
```

### Step 7: Checks (each saved to `plan_check` with green / amber / red)

| Check | Formula | Rule |
|---|---|---|
| Spend ratio | B ÷ incremental_value | red if > cap; amber if ≥ 0.9 × cap; else green |
| Cost per new farmer | B ÷ F | info (compare across MUs) |
| Cost per incremental acre | B ÷ ΔA | info |
| Cost per incremental pack | B ÷ incremental_packs | info |
| Field capacity | Σ n_i ÷ (MDOs in MU × active weeks) | red if > config `max_activities_per_mdo_week` (default 6) |
| Demo farmers | n of demo activity vs innovative farmers mapped (or villages × 3 if not yet mapped) | red if there are not enough |
| Shares | Σ share_i | red if ≠ 100% |
| Target vs AMP | target_treated_pct ≤ amp_pct | red if exceeded |
| Planned converts | Σ (n_i × r_i × k_i) ≥ F | green if met |

A plan with any **red** check cannot be submitted. If the spend ratio is red, the engine must **suggest a cheaper mix**: shift share from the highest cost-per-convert activity (c_i ÷ (r_i × k_i)) to the lowest, then re-run Steps 4–7.

### Step 8: Envelope split (region / BU level)

Group all plan lines in a region by the activity's `bucket` and show the share of budget in each against the target split **70% proven / 20% scaling / 10% pilot** (configurable). Flag any bucket off its target by more than 5 percentage points. The bucket labels are an interpretation of the source deck; keep them editable.

### 5.8 Learning conversion rates (call-centre loop)

- Every day, randomly sample **10%** (config) of farmers in `event_contact` for that day and create call-back tasks for the call centre.
- Each call-back records `will_buy`, `bought` and which activity motivated the farmer.
- Update k per activity × crop × segment with a smoothed rate, so small samples don't swing it:

```
k_learned = (k_default × m + positives) / (m + calls)
m = prior strength, config default 50; positives = will_buy count (use bought once sales confirm)
```

Show the sample size next to every learned k.

### 5.9 Retention plan (ΔA ≤ 0, e.g. Matured MUs)

Here F = farmers to retain = current_area ÷ avg_area_per_farmer × retention_focus (config, default 0.2). Use the Matured playbook (mass media, retailer activities) and apply the same Steps 5–7. The spend ratio base becomes total_value instead of incremental_value.

### 5.10 Calendar generation (after approval)

- Each crop stage has a window: `anchor_date + start_day … anchor_date + end_day`.
- Each activity type maps to a season phase:
  - **pre** = before the anchor date (default window: anchor − 120 days to anchor − 1 day),
  - **on** = from the anchor to the last crop stage,
  - **post** = harvest.
- For each plan line, create `n_i` `activity_event` rows spread evenly over its phase window, split by its phase percentages. Skip Sundays (configurable) and assign the MU's MDO.
- **Stock-needed-by date** = first stage date that uses the product − dealer lead time (config, default 15 days). Required packs per month come from the stage dose schedule.

### 5.11 Replanning (weather)

- If `rainfall_dev_pct` ≤ −30% (config) within 15 days of the anchor date, create a risk: "suggest shifting by 14 days".
- When a manager accepts, shift the anchor date. Then move every stage window, stock date and **unreported** (scheduled) event by the same number of days. Done events are not moved. Log the reason in `plan_audit`.

### 5.12 Audit flags on field reports

Flag an `activity_event` when any of these is true:
- attendance < 50% of r for that activity;
- GPS is missing, or more than 10 km from the MU centroid;
- `photo_hash` already exists on another event;
- actual_cost > 120% of c;
- the report was submitted more than 3 days after `actual_date`.

All thresholds are config values.

### 5.13 KPIs (exact formulas)

| KPI | Formula |
|---|---|
| Activity completion | done events ÷ scheduled events due to date |
| Budget utilisation | Σ actual_cost ÷ approved B (show committed = scheduled × c) |
| Verified unique reach | count of DISTINCT farmer_id in event_contact for events with no open audit flag |
| Conversion per activity | positives ÷ calls, by activity |
| Cost per converted farmer | actual spend ÷ converted farmers |
| Liquidation vs plan | Σ packs_liquidated ÷ Σ planned packs for the months to date |
| LRR (projected) | liquidated to date ÷ days elapsed × season days, compared with Y_packs |
| % liquidation of PO | packs_liquidated ÷ po_packs |
| Forecast accuracy | 1 − abs(actual − forecast) ÷ actual (null if actual = 0) |
| Demo yield gain | (treated − control) ÷ control; extra ₹/acre = (treated − control) × price |
| Campaign ROI (estimate) | (sales growth in campaign MUs − sales growth in similar non-campaign MUs) × price ÷ spend; always label it "estimate" |
| Report quality | events with GPS, a unique photo and no flag ÷ done events |

Use Indian number formatting (₹1,52,500; lakh/crore) in API display fields. Keep raw numbers in separate fields.

---

## 6. Business rules

- Status flow: `draft → submitted → approved → locked → live → closed`. Only a region manager or above approves. A locked plan changes only through a "revise" action, which creates a new version and is logged.
- Users see only their own geography (row-level filtering by geo scope). An MDO sees only their MUs and today's or upcoming events.
- A farmer can receive advisory messages only if `consent_advice = true`. Keep a downloadable consent log, and a withdrawal endpoint that blocks the number.
- Every market_data value returns its `source` and `as_of_date`. Data older than 90 days (config) is marked "stale".
- No unexplained scores. Every insight returns the rule and the numbers behind it.

---

## 7. APIs (REST, JSON)

Each endpoint returns exactly what one mockup component needs. Rename endpoints to match the screen inventory if useful, but keep this coverage.

- `GET /api/meta/filters`: seasons, crops, products, geography tree for the scope bar
- `GET /api/dashboard?season&crop&geo`: target acres, Y_packs, budget planned/approved/spent, activities due/overdue, top 5 risks, liquidation vs plan by month
- `GET /api/market/mus?season&crop&geo`: map and table rows (area, AMP, treated %, penetration, segment, headroom acres, soil, rainfall, price, dealers, source, as_of)
- `GET /api/segments/summary`: count of MUs and acres by segment
- `PATCH /api/mus/:id/segment-override` {segment, reason}
- `GET /api/activities` / `PUT /api/activities/:id`: activity library (r, k default and learned, c, splits, bucket)
- `GET /api/playbooks/:segment` / `PUT`
- `POST /api/plans/calculate` {mu_id, crop_id, season_id, product_id, target_treated_pct, shares?}: runs Steps 1–7, **does not save**, returns every intermediate value (for the live planner screen)
- `POST /api/plans`: save a draft; `GET /api/plans/:id`; `PUT /api/plans/:id`
- `POST /api/plans/:id/suggest-cheaper`
- `POST /api/plans/:id/submit | approve | reject | lock | revise`
- `GET /api/plans/:id/brief`: data for the one-page printable MU brief
- `POST /api/plans/:id/generate-calendar`; `GET /api/calendar?geo&from&to`
- `GET /api/plans/:id/stock-needs`
- `POST /api/plans/:id/replan` {shift_days, reason}; `GET /api/risks`
- `GET /api/envelope?region&season`: 70/20/10 view
- Field app: `GET /api/mdo/today`, `POST /api/events/:id/report` (multipart: attendance, cost, GPS, photo, contacts). Accept batches of offline-queued reports with client timestamps.
- `GET /api/audit-queue`; `PATCH /api/audit-flags/:id`
- `GET /api/callbacks/queue`; `POST /api/callbacks/:id`
- `POST /api/farmers` (with consent fields); `POST /api/consent/withdraw`
- `POST /api/import/sales` (CSV); `POST /api/import/market` (CSV)
- `GET /api/performance?season&crop&geo`: funnel, conversion by activity, cost per converted farmer, LRR, % PO, forecast accuracy, demo vs control, ROI estimate
- `GET /api/reports/weekly?week` and `/monthly`: review packs (generated every Friday and Monday)

Validate inputs, return clear 4xx errors, and paginate the lists.

---

## 8. Connecting the mockups

For every screen in `docs/screen-inventory.md`:

1. Replace each hard-coded value or demo array with a call to its API. Keep the mockup's HTML/CSS and layout exactly as designed.
2. Wire the filters (season, crop, geography) to the query params of every call on the page.
3. Add loading, empty ("No data for this selection") and error states that match the mockup's style.
4. Charts: feed the existing chart components the API arrays, using the same shape the mockup used.
5. Forms and buttons: wire them to POST/PATCH endpoints and refresh the affected parts after success.
6. **Budget & Demand Planner screen:** call `/api/plans/calculate` whenever target %, product or shares change (debounced 300 ms). Show the step-by-step values (penetration, segment, ΔA, Y, F, the table of n and budget, phasing, checks with colours).
7. If a mockup shows something the spec does not cover, add it to `docs/gaps.md` with a proposed formula. Don't invent silent numbers.
8. Produce `docs/screen-api-map.md`: screen → component → endpoint → field.

---

## 9. Seed data (for the demo)

- **Crops (9):** Banana, Cotton, Grapes, Groundnut, Onion, Pomegranate, Soybean, Sugarcane, Tomato. Stage anchors: transplanting for onion and tomato; pruning for grapes and pomegranate; planting for banana and sugarcane; sowing for cotton, soybean and groundnut.
- **Product categories:** Croptek (enhanced-efficiency), Smartek, water-soluble, micronutrients, secondary nutrients, bulk. Mark doses and prices as **placeholders**.
- **Geography:** Maharashtra → Nashik, Dhule, Jalgaon → 3–4 MUs each, with a spread of penetration values so all four segments appear.
- **Season:** "Rabi 2026"; anchor (transplanting) dates in December/January.
- **Activity library:**

| Activity | r | k | c (₹) | pre / on / post | bucket |
|---|---|---|---|---|---|
| Crop demo with control strip | 25 | 0.12 | 6,500 | 0 / 1 / 0 | proven |
| Early field day + harvest days | 150 | 0.05 | 20,000 | 1/3 / 0 / 2/3 (store at full precision) | proven |
| Group farmer meeting (8–10) | 10 | 0.10 | 1,500 | 0.65 / 0.35 / 0 | proven |
| One-to-one contact | 1 | 0.15 | 100 | 0.65 / 0.35 / 0 | proven |
| Large farmer meeting (75–100) | 90 | 0.04 | 12,000 | 0.75 / 0.25 / 0 | proven |
| Multiplier meet | 60 | 0.06 | 15,000 | 1 / 0 / 0 | scaling |
| HVC / branded van campaign | 300 | 0.02 | 25,000 | 0.25 / 0.75 / 0 | proven |
| Tray pe Charcha (retailer counter) | 30 | 0.08 | 3,000 | 0.3 / 0.7 / 0 | scaling |
| Wall painting / hoarding | 500 | 0.005 | 4,000 | 0.5 / 0.5 / 0 | proven |
| Key influencer engagement | 20 | 0.05 | 5,000 | 0.4 / 0.4 / 0.2 | pilot |

- **Playbooks:**

| Segment | Mix |
|---|---|
| Emerging | demo 40%, field/harvest day 30%, group meeting 20%, one-to-one 10% |
| Growing | group meeting 25%, large meeting 20%, key influencer 15%, demo 20%, Tray pe Charcha 20% |
| Maturing | HVC 35%, Tray pe Charcha 30%, large meeting 20%, wall painting 15% |
| Matured | wall painting 40%, Tray pe Charcha 35%, HVC 25% |

- Add a few sample events, call-backs, audit flags, sales imports and one demo result, so every screen shows data.

---

## 10. Tests that must pass

### Golden test: Emerging onion MU (put this exactly into unit tests)

Inputs:
- crop_area = 3,000 acres; AMP = 0.30; current = 0.05; target = 0.10
- dose = 2 packs/acre; pack = 50 kg; price = ₹1,800/pack; avg_area_per_farmer = 2
- Emerging playbook and the activity values from Section 9

Expected results:

| Value | Expected |
|---|---|
| penetration | 0.1667 → Emerging, cap 0.30 |
| ΔA | 150 acres |
| Y_packs | 600 |
| Y_tons | 30 |
| incremental_packs | 300 |
| incremental_value | ₹5,40,000 |
| F | 75 |
| Demo | F_i 30, converts/unit 3.0, n = 10, budget ₹65,000 |
| Field/harvest day | F_i 22.5, 7.5, n = 3, ₹60,000 |
| Group meeting | F_i 15, 1.0, n = 15, ₹22,500 |
| One-to-one | F_i 7.5, 0.15, n = 50, ₹5,000 |
| Σ n | 78 |
| B | ₹1,52,500 |
| Phasing | pre ₹37,875 · on ₹74,625 · post ₹40,000 (±₹5 rounding) |
| Spend ratio | 0.2824 → **amber** (≥ 0.27, ≤ 0.30) |
| Cost per new farmer / acre / pack | ₹2,033.33 / ₹1,016.67 / ₹508.33 |
| Planned converts Σ(n·r·k) | 75 ≥ F → green |
| Capacity | 78 ÷ (1 MDO × 16 weeks) = 4.875 ≤ 6 → green |

### Other tests

- Segment boundaries: 0.25 → Growing; 0.80 → Matured.
- Target above AMP → red check and submit blocked.
- Shares summing to 95% → red.
- Cheaper-mix suggestion lowers B and keeps planned converts ≥ F.
- Learned k: k_default 0.12, m 50, 20 calls with 5 positives → (0.12×50 + 5) ÷ 70 = 0.1571.
- Replan by 14 days moves scheduled events and stock dates, not done events, and writes an audit row.
- Duplicate photo_hash creates an audit flag.
- An MDO cannot read another MDO's events.

### End-to-end demo script

Log in as region manager → open a Dhule onion MU → see it tagged Emerging → change target from 10% to 12% and watch n and B update → submit → approve → generate calendar → as MDO, report a demo offline (sync) → the audit queue shows the reused-photo flag → the call-back queue has 10% of contacts → import sales → the performance page shows the funnel, conversion by activity, LRR and the ROI estimate.

---

## 11. Deliverables

1. Backend code (engine module, APIs, migrations, seed script), runnable with one command (`docker compose up` or `npm run dev`)
2. Mockups connected to live APIs
3. `docs/screen-inventory.md`, `docs/screen-api-map.md`, `docs/gaps.md`
4. `docs/engine.md`: the formulas above with one worked example
5. Test suite and a short README (setup, env vars, how to import data, which values are placeholders)

**Keep it simple:** clear functions, no over-engineering, no AI/ML black boxes. Every number on screen must be traceable to a formula in Section 5 or a stored input.
