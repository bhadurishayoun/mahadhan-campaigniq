"""Validate the generated canonical workbook and screen data snapshots."""
from __future__ import annotations

import json
import math
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "data" / "seed" / "mahadhan_synthetic_data.xlsx"
REPORT = ROOT / "data" / "seed" / "validation_report.md"
CATALOG = json.loads((ROOT / "data" / "datasets" / "catalog.json").read_text(encoding="utf-8"))
MASTER = json.loads((ROOT / "data" / "reference" / "masters.json").read_text(encoding="utf-8"))
GEOGRAPHY = json.loads((ROOT / "data" / "reference" / "geography.json").read_text(encoding="utf-8"))
PRODUCTS = json.loads((ROOT / "data" / "reference" / "products.json").read_text(encoding="utf-8"))

checks: list[tuple[str, bool, str]] = []
wb = load_workbook(BOOK, read_only=True, data_only=True)
checks.append(("Workbook sheets", {"Data dictionary", "README", "ds.portfolio.campaigns"}.issubset(wb.sheetnames), f"{len(wb.sheetnames)} sheets"))
datasets = {entry["name"]: entry for entry in CATALOG.get("datasets", [])}
snapshot_dir = ROOT.parent / "web" / "src" / "data" / "snapshot"
snapshots: dict[str, list[dict]] = {}
for name, entry in datasets.items():
    path = snapshot_dir / f"{name.replace('.', '__')}.json"
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        snapshots[name] = rows
        columns = {column["name"] for column in entry.get("columns", [])}
        checks.append((f"Dataset {name}", bool(rows) and all(set(row) >= columns for row in rows[:1]), f"{len(rows)} rows"))
    except (OSError, json.JSONDecodeError):
        checks.append((f"Dataset {name}", False, "snapshot missing/invalid"))

campaigns = snapshots.get("portfolio.campaigns", [])
regions = {"West", "South", "North", "East"}
themes = {"Conversion & Adoption", "Retailer Enablement", "Trial & Follow-up", "Crop Nutrition Awareness"}
filter_coverage = bool(campaigns) and all(any(row.get(key) == value for row in campaigns) for key, values in (("region", regions), ("theme", themes), ("crop", {row.get("crop") for row in campaigns}), ("product", {row.get("product") for row in campaigns}), ("period", {row.get("period") for row in campaigns}), ("fy", {row.get("fy") for row in campaigns}), ("state", {row.get("name") for row in GEOGRAPHY.get("states", [])})) for value in values)
checks.append(("Campaign filter coverage", filter_coverage, "each region/state/crop/product/theme/period/FY has rows"))
states = {row.get("name") for row in GEOGRAPHY.get("states", [])}
product_names = {row.get("name") for row in PRODUCTS.get("products", [])}
crop_names = {row.get("name") for row in MASTER.get("crops", [])}
checks.append(("Campaign master foreign keys", bool(campaigns) and all(row.get("state") in states and row.get("product") in product_names and row.get("crop") in crop_names and row.get("region") in regions and row.get("theme") in themes for row in campaigns), "state/product/crop/region/theme"))
numeric_ok = all(isinstance(value, (int, float)) and math.isfinite(value) and value >= 0 for row in campaigns for key, value in row.items() if isinstance(value, (int, float)))
pct_ok = all(0 <= row.get(key, 0) <= 100 for row in campaigns for key in ("planned_pct", "observed_pct", "achievement_pct", "trial_to_purchase_pct"))
checks.append(("Numeric and percentage ranges", numeric_ok and pct_ok, "nonnegative finite; percentages 0–100"))
achievement_reconciles = all(abs(row["achievement_pct"] - (row["actual_sales_lakh"] / row["abp_lakh"] * 100 if row["abp_lakh"] else 0)) <= 0.5 for row in campaigns)
rollup_total = sum(row["investment_lakh"] for row in campaigns)
region_rollup = sum(sum(row["investment_lakh"] for row in campaigns if row["region"] == region) for region in regions)
state_rollup = sum(sum(row["investment_lakh"] for row in campaigns if row["state"] == state) for state in {row["state"] for row in campaigns})
checks.append(("Achievement and region/state roll-ups", achievement_reconciles and abs(rollup_total - region_rollup) <= rollup_total * .005 and abs(rollup_total - state_rollup) <= rollup_total * .005, "achievement = actual/target; regional and state sums reconcile"))
anchor = next((r for r in campaigns if r.get("name") == "Onion Croptek Conversion" and r.get("state") == "Maharashtra" and r.get("district") == "Jalna" and r.get("period") == "YTD" and r.get("fy") == "FY 2026-27" and r.get("theme") == "Conversion & Adoption"), None)
activity = snapshots.get("tm.campaign_activities", [])
anchor_lines = [r for r in activity if r.get("campaign") == "Onion Croptek Conversion" and r.get("state") == "Maharashtra" and r.get("crop") == "Onion" and r.get("period") == "YTD" and r.get("theme") == "Conversion & Adoption"]
checks.append(("Story anchors", bool(anchor and anchor.get("investment_lakh") == 3.0 and anchor.get("trial_to_purchase_pct") == 36 and anchor.get("trials") == 150 and anchor.get("adopters") == 54 and sum(r.get("investment_lakh", 0) for r in anchor_lines) == 3.0), "Onion campaign ₹3.00 L; 54/150; 36%; activity budget ₹3.00 L"))
checks.append(("PM ABP anchor", any(row.get("portfolio_abp_lakh") == 600.0 for row in snapshots.get("pm.portfolio_abp", [])), "₹6.00 Cr"))
checks.append(("Ambad / Jalna anchors", any(row.get("territory") == "Ambad" and row.get("territory_abp_lakh") == 420.0 for row in snapshots.get("tm.territory_plan", [])) and any(row.get("district") == "Jalna" and row.get("addressable_opportunity_lakh") == 1000.0 for row in snapshots.get("mh.regional_opportunity", [])), "Ambad ₹4.20 Cr; Jalna cluster ₹10.00 Cr"))
checks.append(("Catalog dataset screens", all(entry.get("screens") or entry.get("screen") for entry in datasets.values()), f"{len(datasets)} datasets registered"))

failed = [name for name, passed, _ in checks if not passed]
lines = ["# Workbook validation report", "", f"Result: {'PASS' if not failed else 'FAIL'}", ""]
lines.extend(f"- [{'PASS' if passed else 'FAIL'}] {name}: {detail}" for name, passed, detail in checks)
REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Validation: {'PASS' if not failed else 'FAIL'} ({len(checks) - len(failed)}/{len(checks)} checks)")
print(f"Campaign rows: {len(campaigns):,}; registered snapshots: {len(snapshots)}/{len(datasets)}")
print(f"Report: {REPORT.relative_to(ROOT)}")
if failed:
    for name in failed[:15]:
        print(f"FAIL: {name}")
    raise SystemExit(1)
