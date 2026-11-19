"""Canonical screen datasets shared by the workbook and static snapshot generator."""
from __future__ import annotations

import random
from typing import Any

REGIONS = {
    "West": ["Maharashtra", "Gujarat", "Madhya Pradesh", "Rajasthan"],
    "South": ["Karnataka", "Andhra Pradesh", "Telangana", "Tamil Nadu"],
    "North": ["Uttar Pradesh", "Punjab", "Haryana"],
    "East": ["Odisha", "West Bengal", "Bihar"],
}
THEMES = ["Conversion & Adoption", "Retailer Enablement", "Trial & Follow-up", "Crop Nutrition Awareness"]
OBJECTIVE_THEME = {
    "New-market adoption": THEMES[0], "Competitive conversion": THEMES[0], "Repeat adoption": THEMES[0],
    "Loyalty & visibility": THEMES[1], "Channel readiness": THEMES[1], "Stage-based education": THEMES[3],
    "Underperforming territories": THEMES[2],
}
PRODUCT_CATEGORY = {
    "Croptek": "Croptek", "Solutek": "Water Soluble", "Smartek": "Specialty Nutrition",
    "Bensulf": "Specialty Nutrition", "Mahadhan 24:24:0": "Primary Nutrition",
}
ACTIVITY_LINES = [
    ("Field Demonstrations", 4, "units", "Dhanora 2 · Wadi Gaon 2", "Before bulb initiation", "R. Jadhav", 1.05),
    ("Retailer Activation", 3, "sessions", "3 linked retailers", "Preparation window", "S. Patil", 0.75),
    ("Farmer Meetings", 3, "meetings", "Dhanora · Wadi Gaon", "Stage window", "V. Shinde", 0.60),
    ("Opt-in Digital Advisory", 1, "wave", "Consenting farmers", "Stage window", "P. Kale", 0.30),
    ("Farmer Follow-ups", 2, "rounds", "Dhanora · Wadi Gaon", "After demonstrations", "P. Kale", 0.30),
]
FY_VALUES = ["FY 2024-25", "FY 2025-26", "FY 2026-27"]
SEASON_BY_FY = {"FY 2024-25": "Rabi 2024-25", "FY 2025-26": "Rabi 2025-26", "FY 2026-27": "Late Rabi 2026-27"}
PERIOD_VALUES = ["YTD", "QTD", "Monthly"]
CROPS = ["Onion", "Sugarcane", "Grapes", "Cotton", "Maize", "Soybean", "Pomegranate", "Tomato", "Banana", "Groundnut"]


def _theme(objective: str, campaign_type: str) -> str:
    if objective in OBJECTIVE_THEME:
        return OBJECTIVE_THEME[objective]
    value = f"{objective} {campaign_type}".lower()
    if "retail" in value or "channel" in value or "dealer" in value:
        return THEMES[1]
    if "trial" in value or "follow" in value or "underperform" in value:
        return THEMES[2]
    if "aware" in value or "education" in value:
        return THEMES[3]
    return THEMES[0]


def _product_for_crop(crop: str) -> str:
    return {"Onion": "Croptek", "Sugarcane": "Smartek", "Grapes": "Solutek", "Cotton": "Bensulf",
            "Maize": "Mahadhan 24:24:0", "Soybean": "Croptek", "Pomegranate": "Solutek", "Tomato": "Croptek",
            "Banana": "Croptek", "Groundnut": "Bensulf"}[crop]


def build_campaign_rows(state_regions: dict[str, str], state_districts: dict[str, str], seed: int = 20261118) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    rows: list[dict[str, Any]] = []
    state_names = list(state_regions)
    for fy in FY_VALUES:
        for state in state_names:
            region = state_regions[state]
            district = "Jalna" if state == "Maharashtra" else state_districts.get(state, state)
            for crop in CROPS:
                product = _product_for_crop(crop)
                for theme in THEMES:
                    for period in PERIOD_VALUES:
                        is_anchor = state == "Maharashtra" and district == "Jalna" and crop == "Onion" and product == "Croptek" and theme == THEMES[0] and fy == "FY 2026-27" and period == "YTD"
                        investment = 3.00 if is_anchor else round(rng.uniform(1.2, 48), 2)
                        adoption = 36 if is_anchor else rng.randint(20, 45)
                        planned = 80 if is_anchor else rng.randint(68, 94)
                        observed = 72 if is_anchor else rng.randint(55, min(planned, 92))
                        roi = 1.4 if is_anchor else round(rng.uniform(.8, 2.2), 2)
                        theme_index = THEMES.index(theme)
                        objective = ["Competitive conversion", "Channel readiness", "Underperforming territories", "Stage-based education"][theme_index]
                        campaign_type = ["adoption", "channel", "retention", "awareness"][theme_index]
                        quarter = 4 if period != "Monthly" else rng.randint(1, 4)
                        sales = round(investment * roi, 2)
                        abp = round(investment * 2.2, 2)
                        rows.append({
                            "name": "Onion Croptek Conversion" if is_anchor else f"{product} {crop} {theme} · {district}",
                            "objective": objective, "theme": theme, "campaign_type": campaign_type,
                            "region": region, "state": state, "district": district, "geography": f"{district}, {state}",
                            "crop": crop, "product": product, "product_category": PRODUCT_CATEGORY[product],
                            "investment_lakh": investment, "investment": investment, "budget": f"₹{investment / 100:.2f} Cr",
                            "adopters": 54 if is_anchor else rng.randint(70, 1600), "trials": 150 if is_anchor else rng.randint(200, 2200),
                            "trial_to_purchase_pct": adoption, "trial": f"{adoption}%", "planned_pct": planned, "planned": planned,
                            "observed_pct": observed, "observed": observed, "progress": observed, "quarter": quarter,
                            "period": period, "fy": fy, "season": SEASON_BY_FY[fy], "stage": "Execute" if fy == "FY 2026-27" else "Review",
                            "risk": "Medium", "roi": roi, "actual_sales_lakh": round(investment * roi, 2),
                            "abp_lakh": abp, "achievement_pct": round(sales / abp * 100, 2) if abp else 0, "next": "Pending attribution",
                        })
    return rows


def build_role_datasets(campaigns: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {name: [] for name in (
        "bh.region_performance", "bh.investment_roi", "bh.theme_pipeline", "bh.interventions",
        "mh.regional_opportunity", "mh.plan_alignment", "mh.campaign_mix_calendar", "mh.approvals",
        "pm.portfolio_abp", "pm.territory_plans", "pm.activity_approvals", "pm.impact_uplift",
        "tm.territory_plan", "tm.outlets", "tm.village_coverage", "tm.campaign_activities",
        "tm.execution_weekly", "tm.impact",
    )}
    # Role screens consume compact regional/theme summaries; the complete row-level matrix stays canonical in portfolio.campaigns.
    groups: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    for c in campaigns:
        groups.setdefault((c["region"], c["theme"], c["period"], c["fy"]), []).append(c)
    for (region, theme, period, fy), rows in groups.items():
        base = {"region": region, "state": "All States", "district": "All Districts", "crop": "All Crops", "product": "All Products",
                "product_category": "All Categories", "theme": theme, "campaign_type": rows[0]["campaign_type"], "period": period, "fy": fy,
                "quarter": rows[0]["quarter"], "campaign_count": len(rows), "investment_lakh": round(sum(r["investment_lakh"] for r in rows), 2),
                "adopters": sum(r["adopters"] for r in rows), "planned_pct": round(sum(r["planned_pct"] for r in rows) / len(rows), 2),
                "observed_pct": round(sum(r["observed_pct"] for r in rows) / len(rows), 2),
                "actual_sales_lakh": round(sum(r["actual_sales_lakh"] for r in rows), 2), "abp_lakh": round(sum(r["abp_lakh"] for r in rows), 2),
                "achievement_pct": round(sum(r["achievement_pct"] for r in rows) / len(rows), 2), "roi": round(sum(r["roi"] for r in rows) / len(rows), 2), "owner": "R. Jadhav"}
        for name in ("bh.region_performance", "bh.investment_roi", "bh.theme_pipeline", "bh.interventions", "mh.regional_opportunity", "mh.plan_alignment", "mh.campaign_mix_calendar", "mh.approvals", "pm.portfolio_abp", "pm.territory_plans", "pm.activity_approvals", "pm.impact_uplift", "tm.territory_plan", "tm.outlets", "tm.village_coverage", "tm.execution_weekly", "tm.impact"):
            result[name].append({**base, "campaign": f"{theme} · {region}", "territory": region})
    # The editable CW.2 plan is the common financial source; line budgets reconcile to exactly 3.00 L.
    for activity, units, unit_label, where, timing, owner, budget in ACTIVITY_LINES:
        result["tm.campaign_activities"].append({"region": "West", "state": "Maharashtra", "district": "Jalna", "crop": "Onion", "product": "Croptek",
            "product_category": "Croptek", "theme": THEMES[0], "period": "YTD", "fy": "FY 2026-27", "campaign": "Onion Croptek Conversion",
            "activity": activity, "units": units, "unit_label": unit_label, "village_channel": where, "timing": timing,
            "assigned_owner": owner, "investment_lakh": budget})
    # Screen story anchors, expressed on the same canonical dimensions.
    anchor = {"region": "West", "state": "Maharashtra", "district": "Jalna", "crop": "Onion", "product": "Croptek", "product_category": "Croptek", "theme": THEMES[0], "campaign_type": "adoption", "period": "YTD", "fy": "FY 2026-27", "quarter": 4, "campaign": "Onion Croptek Conversion"}
    result["pm.portfolio_abp"].append({**anchor, "portfolio_abp_lakh": 600.0, "last_year_liquidation_lakh": 480.0, "abp_lakh": 600.0, "actual_sales_lakh": 428.0, "investment_lakh": 3.0, "adopters": 54, "trials": 150, "trial_to_purchase_pct": 36.0, "planned_pct": 80.0, "observed_pct": 72.0, "roi": "Pending attribution"})
    result["mh.regional_opportunity"].append({**anchor, "addressable_opportunity_lakh": 1000.0, "penetration_pct": 16.0, "investment_lakh": 3.0, "adopters": 54, "trials": 150, "trial_to_purchase_pct": 36.0})
    result["tm.territory_plan"].append({**anchor, "territory": "Ambad", "territory_abp_lakh": 420.0, "cluster_abp_lakh": 1000.0, "last_year_liquidation_lakh": 380.0, "investment_lakh": 3.0, "adopters": 54, "trials": 150, "trial_to_purchase_pct": 36.0})
    for village, reached, trials, adopters in (("Dhanora", 280, 62, 24), ("Wadi Gaon", 360, 98, 48)):
        result["tm.village_coverage"].append({**anchor, "village": village, "reached": reached, "trials": trials, "adopters": adopters, "trial_to_purchase_pct": round(adopters / trials * 100, 1), "investment_lakh": 1.5})
    # Ensure every planner context totals the five anchor activity costs.
    return result
