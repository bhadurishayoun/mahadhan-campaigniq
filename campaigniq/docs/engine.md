# Campaign planning engine

The Python engine in `server/campaign_api/engine.py` is a pure function. It accepts market/product inputs, activity mix rows and configuration, and returns intermediate values, plan lines and checks. The HTTP layer supplies database values and persists only saved plans.

## Equations

1. **Segment:** `penetration = current_treated_pct / amp_pct`; select the configured band where `min_pen ≤ penetration < max_pen`.
2. **Goal:** `current_area = crop_area × current_treated_pct`; `target_area = crop_area × target_treated_pct`; `ΔA = target_area − current_area`; `Y_packs = target_area × dose`; `incremental_packs = max(ΔA, 0) × dose`; `Y_tons = Y_packs × pack_kg / 1000`.
3. **Farmers:** for growth, `F = ΔA / avg_area_per_farmer`; for retention, `F = current_area / avg_area_per_farmer × retention_focus`.
4. **Mix:** `F_i = F × share_i`; shares must sum to 1 within configured tolerance.
5. **Activity count:** `converts_per_unit_i = r_i × k_i`; `n_i = ceil(F_i / converts_per_unit_i)`. Learned `k` uses the configured prior: `(k_default × prior_strength + positives) / (prior_strength + calls)`.
6. **Budget:** `budget_i = n_i × c_i`; line phasing multiplies cost by the pre/on/post split. The splits are validated when the activity library is edited.
7. **Checks:** spend ratio vs segment cap (amber at 90% of cap); unit-cost information; MDO weekly activity capacity; demo-farmer availability; share total; target vs AMP; planned conversions vs required farmers. Red checks block submit.
8. **Envelope:** group plan-line budgets by proven/scaling/pilot and compare to the configured split; flag deviations greater than five percentage points.

Retention plans use total value as the spend-ratio denominator. Growth plans use incremental value.
Currency display strings use Indian digit grouping; numeric API values remain unformatted for calculations.

## Worked example: Emerging onion MU

Inputs: 3,000 acres, AMP 30%, current treated 5%, target 10%, dose 2 packs/acre, 50 kg pack, ₹1,800/pack, 2 acres/farmer.

- Current area = 150 acres; target area = 300; incremental area = 150 acres.
- Goal = 600 total packs (30 tonnes), including 300 incremental packs worth ₹5,40,000.
- Required farmers = 150 / 2 = 75.
- Emerging mix: demo 40%, field/harvest day 30%, meeting 20%, one-to-one 10%.
- Quantities: 10 demos, 3 field days, 15 group meetings and 50 contacts.
- Direct activity budget = ₹1,52,500; phasing = ₹37,875 pre-season, ₹74,625 on-season and ₹40,000 post-season.
- Spend ratio = 28.24%, amber under the 30% cap; field load = 78 / 16 = 4.875 units per MDO/week.

Product doses and prices in the demo database are placeholders, not approved agronomic guidance.
