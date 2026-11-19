#!/usr/bin/env python3
"""Build a compact, reproducible inventory of screen data dependencies."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web" / "src"
OUT = ROOT / "docs" / "data-inventory.md"
DATA_FIELDS = set("region state district taluka territory marketing_unit mu village product product_category crop theme campaign name objective campaign_type person owner status budget investment investment_lakh adopters recorded_adopters planned planned_pct observed observed_pct quarter period fy season sales abp target actual liquidation roi due_date units activity unit_label where timing assigned_owner".split())
ENTITY_TERMS = {
    "regions": r"\bregion|regions\b", "states": r"\bstate|states\b", "districts": r"\bdistrict|districts\b",
    "territories": r"\bterritor|territories\b", "villages": r"\bvillage|villages\b", "products": r"\bproduct|products\b",
    "crops": r"\bcrop|crops\b", "themes": r"\btheme|themes\b", "campaigns": r"\bcampaign|campaigns\b",
    "people": r"\bperson|people|owner|manager|mdo|retailer|dealer\b",
}


def main() -> None:
    rows = ["# Screen data inventory", "", "Generated from TS/TSX source by `server/scripts/inventory_screen_data.py`.", ""]
    count = 0
    for path in sorted([*WEB.rglob("*.tsx"), *WEB.rglob("*.ts")]):
        if path.name.endswith(".d.ts"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        relative = path.relative_to(WEB).as_posix()
        screen_codes = sorted(set(re.findall(r"(?:screen|code)\s*=\s*['\"]([A-Za-z]+\.\d+[A-Za-z0-9.]*)['\"]", text)))
        dataset_names = sorted(set(re.findall(r"useDataset(?:\s*<[^>]+>)?\s*\(\s*['\"]([^'\"]+)['\"]", text)))
        imported = []
        for module in ("pm/data", "tm/data"):
            for match in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*['\"][^'\"]*" + re.escape(module) + r"['\"]", text, re.S):
                imported.extend(f"{module}:{name.strip().split(' as ')[0]}" for name in match.group(1).split(",") if name.strip())
        constants = sorted(set(re.findall(r"\b(?:const|let)\s+([A-Z][A-Z0-9_]{1,})\s*(?::[^=]+)?=\s*(?:\[|\{)", text)))
        fields = sorted(set(re.findall(r"\.([A-Za-z_][A-Za-z0-9_]*)", text)) & DATA_FIELDS)
        low = (relative + " " + text).lower()
        entities = [name for name, pattern in ENTITY_TERMS.items() if re.search(pattern, low)]
        stories = re.findall(r"(?:₹|INR\s*)\s*[\d,.]+\s*(?:Cr|L|Lakh)?|\b\d{1,3}(?:\.\d+)?%|\b\d{1,4}\s*/\s*\d{1,4}\b", text, re.I)
        if not (dataset_names or imported or constants or screen_codes):
            continue
        label = ", ".join(screen_codes) if screen_codes else relative
        rows.extend([f"## {label}", f"- Source: `{relative}`", f"- Datasets: {', '.join(dataset_names) or 'none declared'}", f"- Data imports: {', '.join(imported[:20]) or 'none'}", f"- Inline arrays/objects: {', '.join(constants[:20]) or 'none detected'}", f"- Entities: {', '.join(entities) or 'none detected'}", f"- Fields referenced: {', '.join(fields) or 'none detected'}", f"- Story values: {', '.join(dict.fromkeys(stories[:12])) or 'none detected'}", ""])
        count += 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(rows), encoding="utf-8")
    print(f"Inventory written: {OUT.relative_to(ROOT)}")
    print(f"Source modules indexed: {count}")
    print(f"Screens with datasets: {sum(1 for line in rows if line.startswith('- Datasets: ') and line != '- Datasets: none declared')}")
    print(f"Total source files scanned: {len(list(WEB.rglob('*.tsx'))) + len(list(WEB.rglob('*.ts')))}")


if __name__ == "__main__":
    main()
