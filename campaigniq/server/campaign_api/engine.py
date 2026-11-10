"""Pure campaign planning calculations."""

from __future__ import annotations

from math import ceil
from typing import Any


SEGMENT_RULES = [
    {"segment": "Emerging", "min_pen": 0.0, "max_pen": 0.25, "objective": "Establish", "spend_cap_pct": 0.30},
    {"segment": "Growing", "min_pen": 0.25, "max_pen": 0.50, "objective": "Grow", "spend_cap_pct": 0.20},
    {"segment": "Maturing", "min_pen": 0.50, "max_pen": 0.80, "objective": "Consolidate", "spend_cap_pct": 0.12},
    {"segment": "Matured", "min_pen": 0.80, "max_pen": float("inf"), "objective": "Sustain", "spend_cap_pct": 0.08},
]

DEFAULT_CONFIG = {
    "max_activities_per_mdo_week": 6,
    "active_weeks": 16,
    "mdo_count": 1,
    "retention_focus": 0.20,
    "contingency_pct": 0.0,
    "amber_factor": 0.90,
    "innovative_farmers_mapped": None,
    "villages_count": 10,
    "demo_farmers_per_village": 3,
    "share_tolerance": 1e-6,
    "callback_sample_pct": 0.10,
    "prior_strength": 50,
    "dealer_lead_time_days": 15,
    "rainfall_risk_threshold_pct": -30,
    "rainfall_risk_window_days": 15,
    "pre_season_days": 120,
    "on_season_days": 90,
    "post_season_days": 60,
    "skip_sundays": True,
    "envelope_tolerance_pct": 0.05,
    "attendance_floor_pct": 0.50,
    "max_cost_multiple": 1.20,
    "late_report_days": 3,
    "market_stale_days": 90,
}


def calculate_plan(data: dict[str, Any]) -> dict[str, Any]:
    """Calculate a plan from crop, product, activity, and mix inputs."""
    config = {**DEFAULT_CONFIG, **data.get("config", {})}
    crop_area = _nonnegative(data, "crop_area")
    amp_pct = _fraction(data, "amp_pct")
    current_pct = _fraction(data, "current_treated_pct")
    target_pct = _fraction(data, "target_treated_pct")
    dose = _nonnegative(data, "dose_packs_per_acre")
    pack_kg = _nonnegative(data, "pack_kg")
    price = _nonnegative(data, "price_per_pack")
    avg_area = _positive(data, "avg_area_per_farmer")

    penetration = current_pct / amp_pct if amp_pct > 0 else 0.0
    rules = data.get("segment_rules") or SEGMENT_RULES
    auto_rule = next(
        (rule for rule in rules if rule["min_pen"] <= penetration < rule["max_pen"]),
        rules[-1],
    )
    override_segment = data.get("segment_override")
    rule = next((r for r in rules if r["segment"] == override_segment), auto_rule)

    current_area = crop_area * current_pct
    target_area = crop_area * target_pct
    incremental_area = target_area - current_area
    mode = "retention" if incremental_area <= 0 else "growth"
    y_packs = target_area * dose
    incremental_packs = max(incremental_area, 0) * dose
    y_tons = y_packs * pack_kg / 1000
    incremental_value = incremental_packs * price
    total_value = y_packs * price
    farmers_to_convert = (
        incremental_area / avg_area
        if mode == "growth"
        else (current_area / avg_area) * config["retention_focus"]
    )

    lines = []
    for item in data.get("lines", []):
        activity = item["activity"]
        share = float(item.get("share_pct", 0))
        reach = _nonnegative(activity, "r")
        conversion = _fraction(activity, "k")
        unit_cost = _nonnegative(activity, "c")
        converts_per_unit = reach * conversion
        farmers_i = farmers_to_convert * share
        computed_n = ceil(farmers_i / converts_per_unit) if converts_per_unit > 0 and farmers_i > 0 else 0
        override_n = item.get("n_override")
        n = max(0, int(override_n)) if override_n is not None else computed_n
        budget = n * unit_cost
        phase = [
            _fraction(activity, "phase_split_pre"),
            _fraction(activity, "phase_split_on"),
            _fraction(activity, "phase_split_post"),
        ]
        lines.append(
            {
                "activity_type_id": activity["activity_type_id"],
                "name": activity["name"],
                "kind": activity.get("kind", ""),
                "bucket": activity.get("bucket", "proven"),
                "share_pct": share,
                "r": reach,
                "k": conversion,
                "c": unit_cost,
                "r_source": activity.get("r_source", "default"),
                "k_source": activity.get("k_source", "default"),
                "k_sample_size": activity.get("k_sample_size"),
                "farmers_i": farmers_i,
                "converts_per_unit": converts_per_unit,
                "n": n,
                "budget": budget,
                "budget_pre": budget * phase[0],
                "budget_on": budget * phase[1],
                "budget_post": budget * phase[2],
                "phase_split_pre": phase[0],
                "phase_split_on": phase[1],
                "phase_split_post": phase[2],
                "planned_converts": n * converts_per_unit,
                "cost_per_convert": unit_cost / converts_per_unit if converts_per_unit > 0 else float("inf"),
            }
        )

    budget = sum(line["budget"] for line in lines)
    contingency_pct = config["contingency_pct"]
    contingency = budget * contingency_pct / (1 - contingency_pct) if contingency_pct > 0 else 0
    budget_total = budget + contingency
    budget_pre = sum(line["budget_pre"] for line in lines)
    budget_on = sum(line["budget_on"] for line in lines)
    budget_post = sum(line["budget_post"] for line in lines)
    total_units = sum(line["n"] for line in lines)
    planned_converts = sum(line["planned_converts"] for line in lines)
    spend_ratio_base = "incremental_value" if mode == "growth" else "total_value"
    base_value = incremental_value if mode == "growth" else total_value
    spend_ratio = budget_total / base_value if base_value > 0 else 0
    result = {
        "mode": mode,
        "penetration": penetration,
        "segment": rule["segment"],
        "segment_auto": auto_rule["segment"],
        "segment_overridden": bool(override_segment and override_segment != auto_rule["segment"]),
        "objective": rule["objective"],
        "spend_cap_pct": rule["spend_cap_pct"],
        "current_area": current_area,
        "target_area": target_area,
        "incremental_area": incremental_area,
        "y_packs": y_packs,
        "y_tons": y_tons,
        "incremental_packs": incremental_packs,
        "incremental_value": incremental_value,
        "total_value": total_value,
        "farmers_to_convert": farmers_to_convert,
        "lines": lines,
        "total_units": total_units,
        "budget": budget,
        "contingency": contingency,
        "budget_total": budget_total,
        "budget_pre": budget_pre,
        "budget_on": budget_on,
        "budget_post": budget_post,
        "spend_ratio": spend_ratio,
        "spend_ratio_base": spend_ratio_base,
        "cost_per_farmer": budget_total / farmers_to_convert if farmers_to_convert > 0 else 0,
        "cost_per_acre": budget_total / incremental_area if incremental_area > 0 else 0,
        "cost_per_pack": budget_total / incremental_packs if incremental_packs > 0 else 0,
        "planned_converts": planned_converts,
    }
    result["checks"] = _checks(data, result, config)
    result["can_submit"] = not any(check["status"] == "red" for check in result["checks"])
    return result


def _checks(data: dict[str, Any], plan: dict[str, Any], config: dict[str, Any]) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    ratio = plan["spend_ratio"]
    cap = plan["spend_cap_pct"]
    ratio_status = "red" if ratio > cap else "amber" if ratio >= config["amber_factor"] * cap else "green"
    checks.append(
        {
            "check_name": "spend_ratio",
            "value": ratio,
            "limit": cap,
            "status": ratio_status,
            "message": f"Budget is {ratio:.1%} of {plan['spend_ratio_base'].replace('_', ' ')}, against the {cap:.0%} {plan['segment']} cap",
        }
    )
    for name, value, label in [
        ("cost_per_farmer", plan["cost_per_farmer"], "Cost per new farmer"),
        ("cost_per_acre", plan["cost_per_acre"], "Cost per incremental acre"),
        ("cost_per_pack", plan["cost_per_pack"], "Cost per incremental pack"),
    ]:
        checks.append(
            {
                "check_name": name,
                "value": value,
                "limit": None,
                "status": "green",
                "info": True,
                "message": f"{label}: {format_inr(value)}",
            }
        )
    denominator = max(config["mdo_count"], 1) * max(config["active_weeks"], 1)
    weekly_load = plan["total_units"] / denominator
    checks.append(
        {
            "check_name": "field_capacity",
            "value": weekly_load,
            "limit": config["max_activities_per_mdo_week"],
            "status": "red" if weekly_load > config["max_activities_per_mdo_week"] else "green",
            "message": f"{weekly_load:.2f} activities per MDO per week",
        }
    )
    demo_lines = [line for line in plan["lines"] if line["kind"] == "demo"]
    if demo_lines:
        demos = sum(line["n"] for line in demo_lines)
        available = config["innovative_farmers_mapped"]
        if available is None:
            available = config["villages_count"] * config["demo_farmers_per_village"]
        checks.append(
            {
                "check_name": "demo_farmers",
                "value": demos,
                "limit": available,
                "status": "red" if demos > available else "green",
                "message": f"{demos} demos planned; {available} innovative farmers available",
            }
        )
    share_sum = sum(float(line.get("share_pct", 0)) for line in data.get("lines", []))
    shares_ok = abs(share_sum - 1) <= config["share_tolerance"]
    checks.append(
        {
            "check_name": "shares",
            "value": share_sum,
            "limit": 1,
            "status": "green" if shares_ok else "red",
            "message": f"Activity shares total {share_sum:.1%}; must equal 100%",
        }
    )
    target_ok = data["target_treated_pct"] <= data["amp_pct"] + 1e-12
    checks.append(
        {
            "check_name": "target_vs_amp",
            "value": data["target_treated_pct"],
            "limit": data["amp_pct"],
            "status": "green" if target_ok else "red",
            "message": "Target is within market potential" if target_ok else "Target exceeds market potential",
        }
    )
    converts_ok = plan["planned_converts"] + 1e-9 >= plan["farmers_to_convert"]
    checks.append(
        {
            "check_name": "planned_converts",
            "value": plan["planned_converts"],
            "limit": plan["farmers_to_convert"],
            "status": "green" if converts_ok else "red",
            "message": f"Planned converts {plan['planned_converts']:.2f} vs {plan['farmers_to_convert']:.2f} required",
        }
    )
    return checks


def _nonnegative(data: dict[str, Any], key: str) -> float:
    value = float(data[key])
    if value < 0:
        raise ValueError(f"{key} must be non-negative")
    return value


def _positive(data: dict[str, Any], key: str) -> float:
    value = float(data[key])
    if value <= 0:
        raise ValueError(f"{key} must be greater than zero")
    return value


def _fraction(data: dict[str, Any], key: str) -> float:
    value = float(data[key])
    if not 0 <= value <= 1:
        raise ValueError(f"{key} must be between 0 and 1")
    return value


def format_inr(value: float, decimals: int = 2) -> str:
    rounded = f"{value:.{decimals}f}"
    whole, _, fraction = rounded.partition(".")
    if len(whole) > 3:
        suffix = whole[-3:]
        prefix = whole[:-3]
        groups = []
        while prefix:
            groups.append(prefix[-2:])
            prefix = prefix[:-2]
        whole = ",".join(reversed(groups)) + "," + suffix
    return f"₹{whole}" + (f".{fraction}" if decimals else "")
