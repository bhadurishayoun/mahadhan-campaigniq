"""Dataset placeholders: the bridge between illustrative screen data and real data feeds.

Every chart/table on the web screens that can take real data is declared in
``server/data/datasets/catalog.json`` (name, screen, description, expected source system and
columns). The web app imports the same file and calls ``useDataset(name, DEMO_ROWS)``.

Until a dataset is uploaded, ``GET /api/datasets/{name}`` returns 404 and the screen shows its
illustrative demo rows. After ``POST /api/datasets/{name}`` (CSV or JSON upload, or a future ETL
job writing to the same table) the screen switches to the uploaded rows automatically.

Rows may carry scope columns (``season``, ``state``, ``district``, ``taluka``, ``crop``,
``product``, ``campaign_type``); the GET endpoint filters on them using the filter-bar values, which
is how more states, districts and products are supported without screen changes.
"""

from __future__ import annotations

import csv
import io
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response

from . import db as database

CATALOG_PATH = Path(os.environ.get("CAMPAIGNIQ_DATASET_CATALOG", Path(__file__).resolve().parents[1] / "data" / "datasets" / "catalog.json"))
SCOPE_COLUMNS = ("season", "state", "district", "taluka", "crop", "product", "campaign_type")
MAX_ROWS = 50_000

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def initialize_dataset_store() -> None:
    with database.connect() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS dataset_upload (
                name TEXT PRIMARY KEY,
                rows_json TEXT NOT NULL,
                row_count INTEGER NOT NULL,
                source TEXT,
                uploaded_by TEXT,
                uploaded_at TEXT NOT NULL
            )
            """
        )


def load_catalog() -> dict[str, dict[str, Any]]:
    if not CATALOG_PATH.exists():
        return {}
    entries = json.loads(CATALOG_PATH.read_text(encoding="utf-8")).get("datasets", [])
    return {entry["name"]: entry for entry in entries}


def _catalog_entry(name: str) -> dict[str, Any]:
    entry = load_catalog().get(name)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown dataset '{name}'. Add it to server/data/datasets/catalog.json first.")
    return entry


def _norm(value: Any) -> str:
    return str(value).strip().lower().replace(" ", "-")


def filter_rows(rows: list[dict[str, Any]], scope: dict[str, str | None]) -> list[dict[str, Any]]:
    """Keep rows whose scope columns match the requested scope. Rows without a scope column are global."""
    active = {key: _norm(value) for key, value in scope.items() if value}
    if not active:
        return rows
    kept = []
    for row in rows:
        if all(key not in row or row[key] in (None, "") or _norm(row[key]) == value for key, value in active.items()):
            kept.append(row)
    return kept


def _coerce(value: str) -> Any:
    text = value.strip()
    if text == "":
        return None
    lowered = text.lower()
    if lowered in ("true", "false"):
        return lowered == "true"
    try:
        number = float(text.replace(",", ""))
    except ValueError:
        if text[:1] in "[{":
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return text
        return text
    return int(number) if number.is_integer() and "." not in text else number


def parse_upload(filename: str, content: bytes) -> list[dict[str, Any]]:
    text = content.decode("utf-8-sig")
    if filename.lower().endswith(".json"):
        payload = json.loads(text)
        rows = payload.get("rows") if isinstance(payload, dict) else payload
        if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
            raise HTTPException(status_code=422, detail="JSON upload must be an array of objects or {\"rows\": [...]}")
        return rows
    reader = csv.DictReader(io.StringIO(text))
    return [{key.strip(): _coerce(value or "") for key, value in row.items() if key} for row in reader]


def _validate(entry: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    if not rows:
        raise HTTPException(status_code=422, detail="Upload contains no rows")
    if len(rows) > MAX_ROWS:
        raise HTTPException(status_code=422, detail=f"Upload exceeds {MAX_ROWS} rows")
    required = [column["name"] for column in entry.get("columns", []) if column.get("required", True)]
    missing = [name for name in required if any(name not in row for row in rows)]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")


@router.get("")
def list_datasets() -> dict[str, Any]:
    catalog = load_catalog()
    with database.connect() as db:
        uploads = {row["name"]: dict(row) for row in db.execute("SELECT name, row_count, source, uploaded_at FROM dataset_upload")}
    items = []
    for name, entry in sorted(catalog.items()):
        upload = uploads.get(name)
        items.append({**entry, "status": "live" if upload else "demo", "row_count": upload["row_count"] if upload else None,
                      "uploaded_at": upload["uploaded_at"] if upload else None})
    return {"items": items, "scope_columns": list(SCOPE_COLUMNS)}


@router.get("/{name}/template", response_class=Response)
def dataset_template(name: str) -> Response:
    entry = _catalog_entry(name)
    flat = [column["name"] for column in entry.get("columns", []) if column.get("type") not in ("array", "object")]
    buffer = io.StringIO()
    csv.writer(buffer).writerow([*flat, *[column for column in SCOPE_COLUMNS if column not in flat]])
    return Response(buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{name}.csv"'})


@router.get("/{name}")
def get_dataset(
    name: str,
    season: str | None = None,
    state: str | None = None,
    district: str | None = None,
    taluka: str | None = None,
    crop: str | None = None,
    product: str | None = None,
    campaign_type: str | None = None,
) -> dict[str, Any]:
    with database.connect() as db:
        row = db.execute("SELECT rows_json, source, uploaded_at FROM dataset_upload WHERE name = ?", (name,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{name}' has not been uploaded; the screen uses illustrative demo data.")
    scope = {"season": season, "state": state, "district": district, "taluka": taluka, "crop": crop, "product": product, "campaign_type": campaign_type}
    rows = filter_rows(json.loads(row["rows_json"]), scope)
    if not rows:
        raise HTTPException(status_code=404, detail=f"Dataset '{name}' has no rows for the selected scope.")
    return {"name": name, "rows": rows, "source": row["source"], "uploaded_at": row["uploaded_at"]}


@router.post("/{name}", status_code=201)
async def upload_dataset(
    name: str,
    file: UploadFile = File(...),
    source: str | None = Query(default=None, max_length=200),
) -> dict[str, Any]:
    """Replace a dataset with an uploaded CSV/JSON file. Add authentication before production use."""
    entry = _catalog_entry(name)
    rows = parse_upload(file.filename or "", await file.read())
    _validate(entry, rows)
    uploaded_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with database.connect() as db:
        db.execute(
            """
            INSERT INTO dataset_upload (name, rows_json, row_count, source, uploaded_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET rows_json = excluded.rows_json, row_count = excluded.row_count,
              source = excluded.source, uploaded_at = excluded.uploaded_at
            """,
            (name, json.dumps(rows, ensure_ascii=False), len(rows), source or file.filename, uploaded_at),
        )
    return {"name": name, "row_count": len(rows), "uploaded_at": uploaded_at}


@router.delete("/{name}")
def delete_dataset(name: str) -> dict[str, Any]:
    """Remove uploaded rows so the screen falls back to illustrative demo data."""
    with database.connect() as db:
        deleted = db.execute("DELETE FROM dataset_upload WHERE name = ?", (name,)).rowcount
    return {"name": name, "deleted": bool(deleted)}


def read_dataset_rows(name: str, scope: dict[str, str | None] | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """Helper for server-side consumers such as the copilot context builder."""
    with database.connect() as db:
        row = db.execute("SELECT rows_json FROM dataset_upload WHERE name = ?", (name,)).fetchone()
    if row is None:
        return []
    return filter_rows(json.loads(row["rows_json"]), scope or {})[:limit]


def uploaded_dataset_names() -> list[str]:
    with database.connect() as db:
        return [row["name"] for row in db.execute("SELECT name FROM dataset_upload ORDER BY name")]
