"""Load a CampaignIQ data workbook (.xlsx) into the database.

The synthetic seed workbook lives at ``server/data/seed/mahadhan_synthetic_data.xlsx`` and is produced by
``server/scripts/generate_synthetic_workbook.py``. The same loader accepts any workbook with the same
sheet / column layout, so real exports can replace the synthetic rows sheet by sheet.

* Sheets named after a database table (``mu``, ``market_data`` ...) replace that table. Only columns
  that exist in the table are loaded; extra reference columns are ignored.
* Sheets named ``ds.<dataset>`` become uploaded screen datasets (``GET /api/datasets/<dataset>``).
* Campaign plans are recomputed with the planning engine, so ``result_json``, ``plan_line`` and
  ``plan_check`` always match the market data and playbooks in the workbook.
* ``_meta`` may set ``reference_date`` and ``shift_dates``: dates are then moved forward by
  (today - reference_date) so a seeded season stays current. ``CAMPAIGNIQ_SEED_SHIFT_DATES=0`` disables it.

CLI:  python -m campaign_api.workbook [path.xlsx] [--no-shift]
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, BinaryIO

from .engine import DEFAULT_CONFIG, calculate_plan

SEED_WORKBOOK = Path(os.environ.get(
    "CAMPAIGNIQ_SEED_WORKBOOK",
    Path(__file__).resolve().parents[1] / "data" / "seed" / "mahadhan_synthetic_data.xlsx",
))

# Load order respects foreign keys; clearing runs in reverse.
TABLE_ORDER = [
    "geo_unit", "mu", "field_staff", "crop", "crop_stage", "season", "product", "crop_product_dose", "market_data",
    "segment_rule", "activity_type", "playbook", "config", "campaign_plan", "activity_event", "farmer",
    "consent_withdrawal", "event_contact", "callback", "audit_flag", "sales_import", "demo_result",
]
DERIVED_TABLES = ["plan_audit", "plan_check", "plan_line", "mu_segment_override"]

# Date / datetime columns that move with the reference date. Seasons stay fixed (they carry names).
SHIFT_COLUMNS = {
    "market_data": ["as_of_date"],
    "campaign_plan": ["anchor_date", "created_at"],
    "activity_event": ["scheduled_date", "actual_date"],
    "callback": ["called_at"],
    "consent_withdrawal": ["withdrawn_at"],
    "sales_import": ["month"],
}


class WorkbookError(ValueError):
    """The workbook does not have the expected layout."""


def read_workbook(source: str | Path | BinaryIO) -> dict[str, list[dict[str, Any]]]:
    """Return {sheet name: [row dicts]} using the first row of each sheet as the header."""
    from openpyxl import load_workbook  # imported lazily: only needed when a workbook is loaded

    try:
        wb = load_workbook(source, read_only=True, data_only=True)
    except Exception as exc:  # openpyxl raises several unrelated exception types for bad files
        raise WorkbookError(f"Not a readable .xlsx workbook: {exc}") from exc
    sheets: dict[str, list[dict[str, Any]]] = {}
    for ws in wb.worksheets:
        rows = ws.iter_rows(values_only=True)
        header = next(rows, None)
        if not header or header[0] is None:
            continue
        names = [str(h).strip() if h is not None else None for h in header]
        data = []
        for values in rows:
            if values is None or all(v is None for v in values):
                continue
            data.append({name: value for name, value in zip(names, values) if name})
        sheets[ws.title] = data
    wb.close()
    return sheets


def _shift_value(value: Any, days: int, column: str) -> Any:
    if value is None or days == 0:
        return value
    if column == "month":
        text = str(value)
        moved = date.fromisoformat(f"{text}-01") + timedelta(days=days)
        return moved.strftime("%Y-%m")
    if isinstance(value, datetime):
        return value + timedelta(days=days)
    if isinstance(value, date):
        return value + timedelta(days=days)
    text = str(value)
    try:
        return (datetime.fromisoformat(text) + timedelta(days=days)).isoformat(sep="T" if "T" in text else " ") if len(text) > 10 \
            else (date.fromisoformat(text) + timedelta(days=days)).isoformat()
    except ValueError:
        return value


def _cell(value: Any, column: str) -> Any:
    if isinstance(value, datetime):
        if column in ("created_at", "called_at", "withdrawn_at"):
            return value.isoformat(timespec="seconds")
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, bool):
        return int(value)
    return value


def _table_columns(db: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in db.execute(f"PRAGMA table_info({table})")]


def load_workbook_into(db: sqlite3.Connection, source: str | Path | BinaryIO, *, shift_dates: bool | None = None,
                       today: date | None = None) -> dict[str, Any]:
    """Replace all seedable tables and datasets with the workbook contents. Runs inside the caller's transaction."""
    sheets = read_workbook(source)
    missing = [table for table in ("geo_unit", "mu", "crop", "season", "product", "crop_product_dose", "market_data") if table not in sheets]
    if missing:
        raise WorkbookError(f"Workbook is missing required sheets: {', '.join(missing)}")

    meta = {str(row.get("key")): row.get("value") for row in sheets.get("_meta", [])}
    if shift_dates is None:
        shift_dates = str(meta.get("shift_dates", "false")).lower() == "true" and os.environ.get("CAMPAIGNIQ_SEED_SHIFT_DATES", "1") != "0"
    shift_days = 0
    if shift_dates and meta.get("reference_date"):
        shift_days = max(((today or date.today()) - date.fromisoformat(str(meta["reference_date"])[:10])).days, 0)
    source_label = str(meta.get("source_label") or "Data workbook")

    db.execute("PRAGMA foreign_keys = OFF")
    try:
        for table in DERIVED_TABLES + list(reversed(TABLE_ORDER)):
            if table in sheets or table in DERIVED_TABLES or table in ("campaign_plan", "activity_event"):
                db.execute(f"DELETE FROM {table}")
        counts: dict[str, int] = {}
        for table in TABLE_ORDER:
            rows = sheets.get(table)
            if rows is None:
                continue
            columns = [c for c in _table_columns(db, table) if rows and c in rows[0]]
            if table == "campaign_plan":
                columns = [c for c in columns if c != "result_json"]
            shift = SHIFT_COLUMNS.get(table, []) if shift_days else []
            values = []
            for row in rows:
                record = []
                for column in columns:
                    value = row.get(column)
                    if column in shift:
                        value = _shift_value(value, shift_days, column)
                    record.append(_cell(value, column))
                values.append(record)
            if values:
                placeholders = ", ".join("?" for _ in columns)
                db.executemany(f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})", values)
            counts[table] = len(values)
        problems = [tuple(row) for row in db.execute("PRAGMA foreign_key_check")]
        if problems:
            raise WorkbookError(f"Workbook rows reference missing ids (first: table {problems[0][0]}, row {problems[0][1]} -> {problems[0][2]})")
    finally:
        db.execute("PRAGMA foreign_keys = ON")

    counts["campaign_plan_recomputed"] = _recompute_plans(db)
    counts["datasets"] = _load_datasets(db, sheets, source_label)
    return {"rows": counts, "shift_days": shift_days, "source": source_label}


def _read_config(db: sqlite3.Connection) -> dict[str, Any]:
    config = DEFAULT_CONFIG.copy()
    for row in db.execute("SELECT key, value FROM config"):
        if row[0] in config:
            try:
                config[row[0]] = json.loads(row[1])
            except json.JSONDecodeError:
                config[row[0]] = float(row[1])
    return config


def _recompute_plans(db: sqlite3.Connection) -> int:
    from .db import get_market_input, get_playbook_lines  # local import avoids a circular import with db.py

    rules = [
        {"segment": r[0], "min_pen": r[1], "max_pen": r[2] if r[2] is not None else float("inf"), "objective": r[3], "spend_cap_pct": r[4]}
        for r in db.execute("SELECT segment, min_pen, max_pen, objective, spend_cap_pct FROM segment_rule ORDER BY min_pen")
    ]
    config = _read_config(db)
    plans = db.execute("SELECT id, mu_id, crop_id, season_id, product_id, target_treated_pct FROM campaign_plan ORDER BY id").fetchall()
    for plan in plans:
        market = get_market_input(db, plan[1], plan[2], plan[3], plan[4])
        penetration = market["current_treated_pct"] / market["amp_pct"] if market["amp_pct"] else 0
        segment = next((r["segment"] for r in rules if r["min_pen"] <= penetration < r["max_pen"]), rules[-1]["segment"])
        result = calculate_plan({
            **market,
            "crop_area": market["crop_area_acres"],
            "target_treated_pct": plan[5],
            "segment_rules": rules,
            "lines": get_playbook_lines(db, segment),
            "config": {**config, "mdo_count": market["mdo_count"], "villages_count": market["villages_count"]},
        })
        db.execute("UPDATE campaign_plan SET result_json = ? WHERE id = ?", (json.dumps(result), plan[0]))
        for line in result["lines"]:
            db.execute(
                """
                INSERT INTO plan_line (plan_id, activity_type_id, share_pct, r, k, c, n, budget, budget_pre, budget_on, budget_post, line_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (plan[0], line["activity_type_id"], line["share_pct"], line["r"], line["k"], line["c"], line["n"],
                 line["budget"], line["budget_pre"], line["budget_on"], line["budget_post"], json.dumps(line)),
            )
        for check in result["checks"]:
            db.execute(
                "INSERT INTO plan_check (plan_id, check_name, value, limit_value, status, message) VALUES (?, ?, ?, ?, ?, ?)",
                (plan[0], check["check_name"], check.get("value"), check.get("limit"), check["status"], check["message"]),
            )
        db.execute(
            "INSERT INTO plan_audit (plan_id, action, user_name, after_json) VALUES (?, 'imported', 'Data workbook', ?)",
            (plan[0], json.dumps({"segment": result["segment"], "budget_total": result["budget_total"]})),
        )
    return len(plans)


def _load_datasets(db: sqlite3.Connection, sheets: dict[str, list[dict[str, Any]]], source_label: str) -> int:
    from .datasets import load_catalog

    catalog = load_catalog()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS dataset_upload (
            name TEXT PRIMARY KEY, rows_json TEXT NOT NULL, row_count INTEGER NOT NULL,
            source TEXT, uploaded_by TEXT, uploaded_at TEXT NOT NULL
        )
        """
    )
    uploaded_at = datetime.now().astimezone().isoformat(timespec="seconds")
    loaded = 0
    for sheet, rows in sheets.items():
        if not sheet.startswith("ds."):
            continue
        name = sheet[3:]
        entry = catalog.get(name)
        if entry is None:
            raise WorkbookError(f"Sheet '{sheet}' does not match a dataset in server/data/datasets/catalog.json")
        required = [c["name"] for c in entry.get("columns", []) if c.get("required", True)]
        absent = [c for c in required if rows and c not in rows[0]]
        if absent:
            raise WorkbookError(f"Sheet '{sheet}' is missing required columns: {', '.join(absent)}")
        clean = [{key: _cell(value, key) for key, value in row.items()} for row in rows]
        db.execute(
            """
            INSERT INTO dataset_upload (name, rows_json, row_count, source, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET rows_json = excluded.rows_json, row_count = excluded.row_count,
              source = excluded.source, uploaded_by = excluded.uploaded_by, uploaded_at = excluded.uploaded_at
            """,
            (name, json.dumps(clean, ensure_ascii=False), len(clean), source_label, "workbook loader", uploaded_at),
        )
        loaded += 1
    return loaded


def main(argv: list[str]) -> int:
    from .db import connect, initialize_database

    args = [a for a in argv if not a.startswith("--")]
    path = Path(args[0]) if args else SEED_WORKBOOK
    initialize_database(seed=False)
    with connect() as db:
        summary = load_workbook_into(db, path, shift_dates=False if "--no-shift" in argv else None)
    print(f"Loaded {path} (dates shifted by {summary['shift_days']} days)")
    for table, count in summary["rows"].items():
        print(f"  {table:28s} {count:>7,}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
