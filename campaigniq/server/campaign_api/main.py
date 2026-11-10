"""HTTP API for planning, market review, and field execution."""

from __future__ import annotations

import csv
import io
import json
import math
import os
import random
import sqlite3
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .db import (
    connect,
    get_market_input,
    get_playbook_lines,
    initialize_database,
)
from . import datasets, reference
from .copilot import router as copilot_router
from .engine import DEFAULT_CONFIG, SEGMENT_RULES, calculate_plan, format_inr
from .settings import load_env_file

load_env_file()

# Browsers may call this API from the local dev server, plus any origins listed in CAMPAIGNIQ_CORS_ORIGINS
# (comma-separated). For the GitHub Pages site set it to the Pages origin - scheme + host only, no path:
#   CAMPAIGNIQ_CORS_ORIGINS=https://<your-username>.github.io
_extra_origins = [o.strip().rstrip("/") for o in os.environ.get("CAMPAIGNIQ_CORS_ORIGINS", "").split(",") if o.strip()]

app = FastAPI(title="Mahadhan CampaignIQ API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *_extra_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(reference.router)
app.include_router(datasets.router)
app.include_router(copilot_router)


class PlanRequest(BaseModel):
    mu_id: int
    crop_id: int
    season_id: int
    product_id: int
    target_treated_pct: float = Field(ge=0, le=1)
    shares: dict[int, float] | None = None
    anchor_date: date | None = None


class SegmentOverrideRequest(BaseModel):
    segment: str
    reason: str = Field(min_length=5, max_length=500)
    crop_id: int | None = None
    season_id: int | None = None
    plan_id: int | None = None


class EventReportRequest(BaseModel):
    attendance: int = Field(ge=0)
    actual_cost: float = Field(ge=0)
    actual_date: date
    gps_lat: float | None = None
    gps_lng: float | None = None
    photo_hash: str | None = None
    farmer_ids: list[int] = Field(default_factory=list)
    client_timestamp: datetime | None = None


class CallbackRequest(BaseModel):
    will_buy: bool
    bought: bool | None = None
    motivating_activity_type_id: int | None = None


class ReplanRequest(BaseModel):
    shift_days: int = Field(ge=-90, le=90)
    reason: str = Field(min_length=5, max_length=500)


class FarmerRequest(BaseModel):
    mu_id: int
    name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=6, max_length=30)
    farmer_type: str = Field(pattern="^(innovative|potential)$")
    area_acres: float = Field(ge=0)
    consent_record: bool
    consent_advice: bool
    consent_proof_url: str | None = None
    language: str = "en"


class ConsentWithdrawalRequest(BaseModel):
    phone: str = Field(min_length=6, max_length=30)
    reason: str | None = Field(default=None, max_length=500)


class AuditFlagRequest(BaseModel):
    resolved: bool


class ActivityUpdateRequest(BaseModel):
    r_default: float | None = Field(default=None, ge=0)
    k_default: float | None = Field(default=None, ge=0, le=1)
    unit_cost: float | None = Field(default=None, ge=0)
    phase_split_pre: float | None = Field(default=None, ge=0, le=1)
    phase_split_on: float | None = Field(default=None, ge=0, le=1)
    phase_split_post: float | None = Field(default=None, ge=0, le=1)
    bucket: str | None = Field(default=None, pattern="^(proven|scaling|pilot)$")


class PlaybookLineRequest(BaseModel):
    activity_type_id: int
    share_pct: float = Field(ge=0, le=1)


@app.on_event("startup")
def startup() -> None:
    initialize_database()
    datasets.initialize_dataset_store()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "campaigniq-python-api"}


@app.get("/api/meta/filters")
def filters() -> dict[str, Any]:
    with connect() as db:
        crops = [dict(row) for row in db.execute("SELECT id, name, stage_anchor FROM crop ORDER BY name")]
        seasons = [dict(row) for row in db.execute("SELECT id, name, start_date, end_date FROM season ORDER BY id DESC")]
        products = [
            dict(row)
            for row in db.execute(
                """
                SELECT p.id, p.name, p.category, p.pack_kg, p.price_per_pack, p.placeholder, d.crop_id, d.dose_packs_per_acre
                FROM product p JOIN crop_product_dose d ON d.product_id = p.id ORDER BY p.name
                """
            )
        ]
        geography = [
            dict(row)
            for row in db.execute(
                """
                SELECT g.id, g.name, g.level, g.parent_id, p.name AS parent_name
                FROM geo_unit g LEFT JOIN geo_unit p ON p.id = g.parent_id
                ORDER BY CASE g.level WHEN 'state' THEN 0 WHEN 'district' THEN 1 ELSE 2 END, g.name
                """
            )
        ]
    return {"seasons": seasons, "crops": crops, "products": products, "geography": geography}


@app.get("/api/activities")
def activities(crop_id: int | None = None, segment: str | None = None) -> list[dict[str, Any]]:
    with connect() as db:
        rows = [
            dict(row)
            for row in db.execute(
                """
                SELECT id, name, kind, r_default, k_default, unit_cost, phase_split_pre, phase_split_on,
                       phase_split_post, bucket, evidence_required FROM activity_type ORDER BY id
                """
            )
        ]
        learned = _learning_values(db, crop_id, segment) if crop_id and segment else {}
    for row in rows:
        value = learned.get(row["id"])
        row["k_learned"] = value["k"] if value else None
        row["k_sample_size"] = value["sample_size"] if value else 0
        row["k_source"] = "learned" if value else "default"
    return rows


@app.put("/api/activities/{activity_id}")
def update_activity(activity_id: int, payload: ActivityUpdateRequest) -> dict[str, Any]:
    values = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not values:
        raise HTTPException(422, detail="Provide at least one activity field to update")
    split_fields = {"phase_split_pre", "phase_split_on", "phase_split_post"}
    if split_fields.intersection(values):
        with connect() as db:
            current = db.execute(
                "SELECT phase_split_pre, phase_split_on, phase_split_post FROM activity_type WHERE id = ?",
                (activity_id,),
            ).fetchone()
            if not current:
                raise HTTPException(404, detail="Activity not found")
        splits = [values.get(name, current[name]) for name in ("phase_split_pre", "phase_split_on", "phase_split_post")]
        if abs(sum(splits) - 1) > 1e-6:
            raise HTTPException(422, detail="Activity phase splits must total 100%")
    columns = ", ".join(f"{key} = ?" for key in values)
    with connect() as db:
        cursor = db.execute(
            f"UPDATE activity_type SET {columns} WHERE id = ?",
            (*values.values(), activity_id),
        )
        if not cursor.rowcount:
            raise HTTPException(404, detail="Activity not found")
        row = db.execute("SELECT * FROM activity_type WHERE id = ?", (activity_id,)).fetchone()
    return dict(row)


@app.get("/api/playbooks/{segment}")
def playbook(segment: str) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT a.id AS activity_type_id, a.name, a.kind, a.r_default AS r, a.k_default AS k,
                   a.unit_cost AS c, a.phase_split_pre, a.phase_split_on, a.phase_split_post,
                   a.bucket, p.share_pct
            FROM playbook p JOIN activity_type a ON a.id = p.activity_type_id
            WHERE p.segment = ? ORDER BY a.id
            """,
            (segment,),
        ).fetchall()
    if not rows:
        raise HTTPException(404, detail=f"No playbook found for segment '{segment}'")
    return [dict(row) for row in rows]


@app.put("/api/playbooks/{segment}")
def update_playbook(segment: str, payload: list[PlaybookLineRequest]) -> list[dict[str, Any]]:
    if not payload:
        raise HTTPException(422, detail="A playbook must include at least one activity")
    total = sum(item.share_pct for item in payload)
    if abs(total - 1) > 1e-6:
        raise HTTPException(422, detail=f"Activity shares must total 100%; received {total:.1%}")
    with connect() as db:
        known = {row["id"] for row in db.execute("SELECT id FROM activity_type")}
        if any(item.activity_type_id not in known for item in payload):
            raise HTTPException(422, detail="One or more activity types do not exist")
        db.execute("DELETE FROM playbook WHERE segment = ?", (segment,))
        db.executemany(
            "INSERT INTO playbook (segment, activity_type_id, share_pct) VALUES (?, ?, ?)",
            [(segment, item.activity_type_id, item.share_pct) for item in payload],
        )
    return playbook(segment)


@app.patch("/api/mus/{mu_id}/segment-override")
def override_segment(mu_id: int, payload: SegmentOverrideRequest) -> dict[str, Any]:
    with connect() as db:
        if payload.segment not in {rule["segment"] for rule in _read_rules(db)}:
            raise HTTPException(422, detail="Segment is not present in the configured segment rules")
        crop_id = payload.crop_id or db.execute("SELECT id FROM crop WHERE name = 'Onion'").fetchone()[0]
        season_id = payload.season_id or db.execute("SELECT id FROM season ORDER BY id DESC LIMIT 1").fetchone()[0]
        if not db.execute("SELECT 1 FROM mu WHERE id = ?", (mu_id,)).fetchone():
            raise HTTPException(404, detail="Marketing unit not found")
        existing = db.execute(
            "SELECT segment, reason FROM mu_segment_override WHERE mu_id = ? AND crop_id = ? AND season_id = ?",
            (mu_id, crop_id, season_id),
        ).fetchone()
        db.execute(
            """
            INSERT INTO mu_segment_override (mu_id, crop_id, season_id, segment, reason, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(mu_id, crop_id, season_id) DO UPDATE SET segment = excluded.segment, reason = excluded.reason, updated_at = CURRENT_TIMESTAMP
            """,
            (mu_id, crop_id, season_id, payload.segment, payload.reason),
        )
        plan_id = payload.plan_id or db.execute(
            "SELECT id FROM campaign_plan WHERE mu_id = ? AND crop_id = ? AND season_id = ? ORDER BY id DESC LIMIT 1",
            (mu_id, crop_id, season_id),
        ).fetchone()
        if plan_id:
            plan_id = plan_id["id"] if isinstance(plan_id, sqlite3.Row) else plan_id
            db.execute(
                """
                INSERT INTO plan_audit (plan_id, action, user_name, reason, before_json, after_json)
                VALUES (?, 'segment_override', 'Marketing team', ?, ?, ?)
                """,
                (
                    plan_id,
                    payload.reason,
                    json.dumps(dict(existing) if existing else None),
                    json.dumps({"segment": payload.segment, "reason": payload.reason}),
                ),
            )
    return {"mu_id": mu_id, "crop_id": crop_id, "season_id": season_id, "segment": payload.segment, "reason": payload.reason}


@app.get("/api/market/mus")
def market_mus(
    season_id: int | None = None,
    crop_id: int | None = None,
    district: str | None = None,
    segment: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    with connect() as db:
        season_id = season_id or db.execute("SELECT id FROM season ORDER BY id DESC LIMIT 1").fetchone()[0]
        crop_id = crop_id or db.execute("SELECT id FROM crop WHERE name = 'Onion'").fetchone()[0]
        rows = db.execute(
            """
            SELECT m.*, mu.id AS mu_id, mu.name AS mu_name, mu.villages_count, g.name AS district,
                   o.segment AS segment_override, o.reason AS segment_override_reason,
                   c.name AS crop, s.name AS season
            FROM market_data m JOIN mu ON mu.id = m.mu_id
            JOIN geo_unit mu_geo ON mu_geo.id = mu.geo_unit_id
            JOIN geo_unit g ON g.id = mu_geo.parent_id
            JOIN crop c ON c.id = m.crop_id JOIN season s ON s.id = m.season_id
            LEFT JOIN mu_segment_override o ON o.mu_id = m.mu_id AND o.crop_id = m.crop_id AND o.season_id = m.season_id
            WHERE m.season_id = ? AND m.crop_id = ? AND (? IS NULL OR g.name = ?)
            ORDER BY mu.name LIMIT ? OFFSET ?
            """,
            (season_id, crop_id, district, district, limit, offset),
        ).fetchall()
        count = db.execute(
            """
            SELECT COUNT(*) FROM market_data m JOIN mu ON mu.id = m.mu_id
            JOIN geo_unit mu_geo ON mu_geo.id = mu.geo_unit_id JOIN geo_unit g ON g.id = mu_geo.parent_id
            WHERE m.season_id = ? AND m.crop_id = ? AND (? IS NULL OR g.name = ?)
            """,
            (season_id, crop_id, district, district),
        ).fetchone()[0]
        rules = _read_rules(db)
        config = _read_config(db)
    items = []
    today = date.today()
    for row in rows:
        item = dict(row)
        penetration = item["current_treated_pct"] / item["amp_pct"] if item["amp_pct"] else 0
        auto_rule = next((r for r in rules if r["min_pen"] <= penetration < r["max_pen"]), rules[-1])
        rule = next((r for r in rules if r["segment"] == item["segment_override"]), auto_rule)
        item["penetration"] = penetration
        item["segment"] = rule["segment"]
        item["segment_auto"] = auto_rule["segment"]
        item["segment_overridden"] = item["segment_override"] is not None
        item["segment_override_reason"] = item["segment_override_reason"]
        item["objective"] = rule["objective"]
        item["spend_cap_pct"] = rule["spend_cap_pct"]
        item["current_area"] = item["crop_area_acres"] * item["current_treated_pct"]
        item["amp_area"] = item["crop_area_acres"] * item["amp_pct"]
        item["headroom_acres"] = item["amp_area"] - item["current_area"]
        item["soil_deficiency"] = json.loads(item.pop("soil_deficiency_json"))
        item["stale"] = (today - date.fromisoformat(item["as_of_date"])).days > config["market_stale_days"]
        if segment and segment != item["segment"]:
            continue
        items.append(item)
    return {"items": items, "total": count, "limit": limit, "offset": offset}


@app.get("/api/segments/summary")
def segments_summary(season_id: int | None = None, crop_id: int | None = None, district: str | None = None) -> list[dict[str, Any]]:
    market = market_mus(season_id=season_id, crop_id=crop_id, district=district, limit=500, offset=0)
    with connect() as db:
        rules = _read_rules(db)
    summary: dict[str, dict[str, float]] = {
        rule["segment"]: {"segment": rule["segment"], "objective": rule["objective"], "mus": 0, "amp_acres": 0}
        for rule in rules
    }
    for row in market["items"]:
        entry = summary[row["segment"]]
        entry["mus"] += 1
        entry["amp_acres"] += row["amp_area"]
    return list(summary.values())


@app.get("/api/dashboard")
def dashboard(season_id: int | None = None, crop_id: int | None = None, district: str | None = None) -> dict[str, Any]:
    market = market_mus(season_id=season_id, crop_id=crop_id, district=district, limit=500, offset=0)
    rows = market["items"]
    with connect() as db:
        plan_rows = db.execute(
            """
            SELECT p.id, p.status, p.result_json, p.target_treated_pct, mu.name AS mu_name, mu.id AS mu_id,
                   district.name AS district
            FROM campaign_plan p JOIN mu ON mu.id = p.mu_id
            JOIN geo_unit mu_geo ON mu_geo.id = mu.geo_unit_id
            JOIN geo_unit district ON district.id = mu_geo.parent_id
            WHERE (? IS NULL OR p.season_id = ?) AND (? IS NULL OR p.crop_id = ?)
            """,
            (season_id, season_id, crop_id, crop_id),
        ).fetchall()
        if district:
            plan_rows = [row for row in plan_rows if row["district"] == district]
        actual = db.execute(
            """
            SELECT COUNT(*) AS done, SUM(actual_cost) AS spent FROM activity_event e
            JOIN campaign_plan p ON p.id = e.plan_id
            WHERE e.status = 'done' AND (? IS NULL OR p.season_id = ?) AND (? IS NULL OR p.crop_id = ?)
            """,
            (season_id, season_id, crop_id, crop_id),
        ).fetchone()
        sales = db.execute(
            """
            SELECT month, SUM(packs_liquidated) AS liquidated, SUM(po_packs) AS po_packs
            FROM sales_import WHERE (? IS NULL OR crop_id = ?) GROUP BY month ORDER BY month
            """,
            (crop_id, crop_id),
        ).fetchall()
    plans = [(row, json.loads(row["result_json"] or "{}")) for row in plan_rows]
    risks = [
        {"mu_name": row["mu_name"], "risk": check["message"], "status": check["status"]}
        for row, result in plans for check in result.get("checks", []) if check.get("status") == "red"
    ][:5]
    return {
        "kpis": {
            "marketing_units": len(rows),
            "crop_area_acres": sum(row["crop_area_acres"] for row in rows),
            "amp_acres": sum(row["amp_area"] for row in rows),
            "treated_acres": sum(row["current_area"] for row in rows),
            "target_acres": sum(row["crop_area_acres"] * next((p["target_treated_pct"] for p, _ in plans if p["mu_id"] == row["mu_id"]), row["current_treated_pct"]) for row in rows),
            "planned_packs": sum(result.get("y_packs", 0) for _, result in plans),
            "planned_budget": sum(result.get("budget_total", 0) for _, result in plans),
            "approved_budget": sum(result.get("budget_total", 0) for plan, result in plans if plan["status"] in ("approved", "locked", "live", "closed")),
            "spent": float(actual["spent"] or 0),
            "activities_done": int(actual["done"] or 0),
        },
        "top_risks": risks,
        "liquidation_by_month": [dict(row) for row in sales],
        "market_units": rows,
    }


@app.get("/api/envelope")
def envelope(region: str | None = None, season_id: int | None = None) -> dict[str, Any]:
    with connect() as db:
        if season_id is None:
            season_id = db.execute("SELECT id FROM season ORDER BY id DESC LIMIT 1").fetchone()[0]
        split_row = db.execute("SELECT value FROM config WHERE key = 'envelope_split'").fetchone()
        config = _read_config(db)
        targets = json.loads(split_row["value"]) if split_row else {"proven": .70, "scaling": .20, "pilot": .10}
        rows = db.execute(
            """
            SELECT a.bucket, SUM(l.budget) AS budget
            FROM plan_line l JOIN campaign_plan p ON p.id = l.plan_id
            JOIN activity_type a ON a.id = l.activity_type_id
            JOIN mu ON mu.id = p.mu_id
            JOIN geo_unit mu_geo ON mu_geo.id = mu.geo_unit_id
            JOIN geo_unit g ON g.id = mu_geo.parent_id
            WHERE p.season_id = ? AND p.status IN ('approved', 'locked', 'live', 'closed')
              AND (? IS NULL OR g.name = ?)
            GROUP BY a.bucket
            """,
            (season_id, region, region),
        ).fetchall()
    budgets = {row["bucket"]: float(row["budget"] or 0) for row in rows}
    total = sum(budgets.values())
    return {
        "total_budget": total,
        "target_split": targets,
        "buckets": [
            {
                "bucket": bucket,
                "budget": budgets.get(bucket, 0),
                "actual_share": budgets.get(bucket, 0) / total if total else 0,
                "target_share": target_share,
                "variance": budgets.get(bucket, 0) / total - target_share if total else -target_share,
                "off_target": abs(budgets.get(bucket, 0) / total - target_share) > config["envelope_tolerance_pct"] if total else target_share > config["envelope_tolerance_pct"],
            }
            for bucket, target_share in targets.items()
        ],
    }


@app.get("/api/risks")
def risks() -> list[dict[str, Any]]:
    with connect() as db:
        config = _read_config(db)
        threshold = float(config.get("rainfall_risk_threshold_pct", -30))
        window_days = int(config.get("rainfall_risk_window_days", 15))
        rows = db.execute(
            """
            SELECT p.id AS plan_id, p.anchor_date, m.rainfall_dev_pct, mu.name AS mu_name,
                   c.name AS crop_name, s.name AS season_name, m.source, m.as_of_date
            FROM campaign_plan p JOIN market_data m
              ON m.mu_id = p.mu_id AND m.crop_id = p.crop_id AND m.season_id = p.season_id
            JOIN mu ON mu.id = p.mu_id JOIN crop c ON c.id = p.crop_id JOIN season s ON s.id = p.season_id
            WHERE p.status IN ('approved', 'locked', 'live')
            """
        ).fetchall()
    today = date.today()
    results = []
    for row in rows:
        days_to_anchor = (date.fromisoformat(row["anchor_date"]) - today).days
        if row["rainfall_dev_pct"] <= threshold and abs(days_to_anchor) <= window_days:
            results.append(
                {
                    "plan_id": row["plan_id"],
                    "mu_name": row["mu_name"],
                    "crop": row["crop_name"],
                    "season": row["season_name"],
                    "rainfall_dev_pct": row["rainfall_dev_pct"],
                    "days_to_anchor": days_to_anchor,
                    "suggested_shift_days": 14,
                    "rule": f"Rainfall deviation {row['rainfall_dev_pct']:.0f}% ≤ {threshold:.0f}% within {window_days} days of anchor",
                    "source": row["source"],
                    "as_of_date": row["as_of_date"],
                }
            )
    return results


@app.post("/api/plans/calculate")
def calculate(request: PlanRequest) -> dict[str, Any]:
    with connect() as db:
        try:
            market = get_market_input(db, request.mu_id, request.crop_id, request.season_id, request.product_id)
            pen = market["current_treated_pct"] / market["amp_pct"] if market["amp_pct"] else 0
            rules = _read_rules(db)
            override = db.execute(
                "SELECT segment FROM mu_segment_override WHERE mu_id = ? AND crop_id = ? AND season_id = ?",
                (request.mu_id, request.crop_id, request.season_id),
            ).fetchone()
            segment = override["segment"] if override else next(
                (r["segment"] for r in rules if r["min_pen"] <= pen < r["max_pen"]),
                rules[-1]["segment"],
            )
            lines = get_playbook_lines(db, segment, request.shares)
            config = _read_config(db)
            learned = _learning_values(db, request.crop_id, segment, config["prior_strength"])
            for line in lines:
                evidence = learned.get(line["activity"]["activity_type_id"])
                if evidence:
                    line["activity"].update(
                        {
                            "k": evidence["k"],
                            "k_source": "learned",
                            "k_sample_size": evidence["sample_size"],
                        }
                    )
        except LookupError as exc:
            raise HTTPException(404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(422, detail=str(exc)) from exc
    config.update({"mdo_count": market["mdo_count"], "villages_count": market["villages_count"]})
    try:
        return calculate_plan(
            {
                **market,
                "crop_area": market["crop_area_acres"],
                "target_treated_pct": request.target_treated_pct,
                "segment_rules": rules,
                "segment_override": override["segment"] if override else None,
                "lines": lines,
                "config": config,
            }
        )
    except (ValueError, KeyError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc


@app.post("/api/plans", status_code=201)
def create_plan(request: PlanRequest) -> dict[str, Any]:
    result = calculate(request)
    with connect() as db:
        market = get_market_input(db, request.mu_id, request.crop_id, request.season_id, request.product_id)
        anchor = request.anchor_date or date(2026, 12, 15)
        plan_id = db.execute(
            """
            INSERT INTO campaign_plan
            (mu_id, crop_id, season_id, product_id, target_treated_pct, anchor_date, status, result_json)
            VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
            """,
            (request.mu_id, request.crop_id, request.season_id, request.product_id, request.target_treated_pct, anchor.isoformat(), json.dumps(result)),
        ).lastrowid
        _persist_calculation(db, plan_id, result)
        db.execute(
            "INSERT INTO plan_audit (plan_id, action, user_name, after_json) VALUES (?, 'created', 'Marketing team', ?)",
            (plan_id, json.dumps(result)),
        )
    return {"id": plan_id, "status": "draft", "version": 1, **result}


@app.get("/api/plans")
def list_plans(status: str | None = None, limit: int = Query(default=100, ge=1, le=500), offset: int = Query(default=0, ge=0)) -> dict[str, Any]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT p.id, p.status, p.version, p.target_treated_pct, p.anchor_date, p.created_at,
                   mu.name AS mu_name, c.name AS crop_name, s.name AS season_name, p.result_json
            FROM campaign_plan p JOIN mu ON mu.id = p.mu_id
            JOIN crop c ON c.id = p.crop_id JOIN season s ON s.id = p.season_id
            WHERE (? IS NULL OR p.status = ?) ORDER BY p.id DESC LIMIT ? OFFSET ?
            """,
            (status, status, limit, offset),
        ).fetchall()
        total = db.execute("SELECT COUNT(*) FROM campaign_plan WHERE (? IS NULL OR status = ?)", (status, status)).fetchone()[0]
    return {
        "items": [
            {
                **{key: row[key] for key in ("id", "status", "version", "target_treated_pct", "anchor_date", "created_at", "mu_name", "crop_name", "season_name")},
                "result": json.loads(row["result_json"] or "{}"),
            }
            for row in rows
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/plans/{plan_id}")
def get_plan(plan_id: int) -> dict[str, Any]:
    with connect() as db:
        row = db.execute(
            """
            SELECT p.*, mu.name AS mu_name, c.name AS crop_name, s.name AS season_name, pr.name AS product_name
            FROM campaign_plan p JOIN mu ON mu.id = p.mu_id JOIN crop c ON c.id = p.crop_id
            JOIN season s ON s.id = p.season_id JOIN product pr ON pr.id = p.product_id WHERE p.id = ?
            """,
            (plan_id,),
        ).fetchone()
        if not row:
            raise HTTPException(404, detail="Plan not found")
        lines = [json.loads(line["line_json"]) for line in db.execute("SELECT line_json FROM plan_line WHERE plan_id = ? ORDER BY id", (plan_id,))]
        checks = [dict(check) for check in db.execute("SELECT check_name, value, limit_value AS 'limit', status, message FROM plan_check WHERE plan_id = ?", (plan_id,))]
    result = json.loads(row["result_json"] or "{}")
    result["lines"] = lines or result.get("lines", [])
    result["checks"] = checks or result.get("checks", [])
    return {**{key: row[key] for key in ("id", "status", "version", "target_treated_pct", "anchor_date", "mu_name", "crop_name", "season_name", "product_name")}, **result}


@app.put("/api/plans/{plan_id}")
def update_plan(plan_id: int, request: PlanRequest) -> dict[str, Any]:
    result = calculate(request)
    with connect() as db:
        old = db.execute("SELECT * FROM campaign_plan WHERE id = ?", (plan_id,)).fetchone()
        if not old:
            raise HTTPException(404, detail="Plan not found")
        if old["status"] != "draft":
            raise HTTPException(409, detail="Only draft plans can be edited")
        before = json.loads(old["result_json"] or "{}")
        anchor = request.anchor_date or date.fromisoformat(old["anchor_date"])
        db.execute(
            """
            UPDATE campaign_plan SET mu_id = ?, crop_id = ?, season_id = ?, product_id = ?,
              target_treated_pct = ?, anchor_date = ?, result_json = ? WHERE id = ?
            """,
            (
                request.mu_id, request.crop_id, request.season_id, request.product_id,
                request.target_treated_pct, anchor.isoformat(), json.dumps(result), plan_id,
            ),
        )
        db.execute("DELETE FROM plan_line WHERE plan_id = ?", (plan_id,))
        db.execute("DELETE FROM plan_check WHERE plan_id = ?", (plan_id,))
        _persist_calculation(db, plan_id, result)
        db.execute(
            "INSERT INTO plan_audit (plan_id, action, user_name, before_json, after_json) VALUES (?, 'updated', 'Marketing team', ?, ?)",
            (plan_id, json.dumps(before), json.dumps(result)),
        )
    return {"id": plan_id, "status": "draft", **result}


@app.get("/api/plans/{plan_id}/brief")
def plan_brief(plan_id: int) -> dict[str, Any]:
    plan = get_plan(plan_id)
    return {
        "title": f"{plan['crop_name']} campaign · {plan['mu_name']}",
        "season": plan["season_name"],
        "product": plan["product_name"],
        "status": plan["status"],
        "segment": plan["segment"],
        "objective": plan["objective"],
        "area_goal_acres": plan["incremental_area"],
        "volume_goal_packs": plan["incremental_packs"],
        "budget": plan["budget_total"],
        "spend_ratio": plan["spend_ratio"],
        "activity_lines": plan["lines"],
        "checks": plan["checks"],
    }


@app.get("/api/plans/{plan_id}/stock-needs")
def stock_needs(plan_id: int) -> dict[str, Any]:
    with connect() as db:
        row = db.execute(
            """
            SELECT p.id, p.target_treated_pct, p.anchor_date, m.crop_area_acres, d.dose_packs_per_acre,
                   c.name AS crop_name, c.stage_anchor, st.stage_name, st.start_day, st.end_day,
                   pr.name AS product_name, pr.pack_kg
            FROM campaign_plan p JOIN market_data m
              ON m.mu_id = p.mu_id AND m.crop_id = p.crop_id AND m.season_id = p.season_id
            JOIN crop c ON c.id = p.crop_id JOIN product pr ON pr.id = p.product_id
            JOIN crop_product_dose d ON d.crop_id = p.crop_id AND d.product_id = p.product_id
            LEFT JOIN crop_stage st ON st.id = d.stage_id
            WHERE p.id = ?
            """,
            (plan_id,),
        ).fetchone()
        if not row:
            raise HTTPException(404, detail="Plan or product dose schedule not found")
        config = _read_config(db)
    anchor = date.fromisoformat(row["anchor_date"])
    stage_start = anchor + timedelta(days=row["start_day"] or 0)
    needed_by = stage_start - timedelta(days=int(config["dealer_lead_time_days"]))
    packs = row["crop_area_acres"] * row["target_treated_pct"] * row["dose_packs_per_acre"]
    return {
        "plan_id": plan_id,
        "crop": row["crop_name"],
        "product": row["product_name"],
        "anchor_date": anchor.isoformat(),
        "stock_needed_by": needed_by.isoformat(),
        "stage": row["stage_name"] or row["stage_anchor"],
        "stage_window": {
            "from": stage_start.isoformat(),
            "to": (anchor + timedelta(days=row["end_day"] or 0)).isoformat(),
        },
        "required_packs": packs,
        "pack_kg": row["pack_kg"],
        "lead_time_days": int(config["dealer_lead_time_days"]),
        "placeholder_dose_schedule": True,
    }


@app.post("/api/plans/{plan_id}/replan")
def replan(plan_id: int, request: ReplanRequest) -> dict[str, Any]:
    with connect() as db:
        plan = db.execute("SELECT * FROM campaign_plan WHERE id = ?", (plan_id,)).fetchone()
        if not plan:
            raise HTTPException(404, detail="Plan not found")
        if plan["status"] not in ("approved", "locked", "live"):
            raise HTTPException(409, detail="Only approved, locked, or live plans can be replanned")
        old_anchor = date.fromisoformat(plan["anchor_date"])
        new_anchor = old_anchor + timedelta(days=request.shift_days)
        scheduled = db.execute(
            "SELECT id, scheduled_date FROM activity_event WHERE plan_id = ? AND status = 'scheduled'",
            (plan_id,),
        ).fetchall()
        for event in scheduled:
            moved = date.fromisoformat(event["scheduled_date"]) + timedelta(days=request.shift_days)
            db.execute("UPDATE activity_event SET scheduled_date = ? WHERE id = ?", (moved.isoformat(), event["id"]))
        db.execute("UPDATE campaign_plan SET anchor_date = ? WHERE id = ?", (new_anchor.isoformat(), plan_id))
        db.execute(
            """
            INSERT INTO plan_audit (plan_id, action, user_name, reason, before_json, after_json)
            VALUES (?, 'replan', 'Marketing team', ?, ?, ?)
            """,
            (
                plan_id,
                request.reason,
                json.dumps({"anchor_date": old_anchor.isoformat(), "scheduled_events_moved": len(scheduled)}),
                json.dumps({"anchor_date": new_anchor.isoformat(), "scheduled_events_moved": len(scheduled)}),
            ),
        )
    return {"plan_id": plan_id, "anchor_date": new_anchor.isoformat(), "scheduled_events_moved": len(scheduled), "done_events_moved": 0}


@app.post("/api/plans/{plan_id}/suggest-cheaper")
def suggest_cheaper(plan_id: int) -> dict[str, Any]:
    plan = get_plan(plan_id)
    if plan["status"] != "draft":
        raise HTTPException(409, detail="Only draft plans can be optimized")
    with connect() as db:
        market = get_market_input(db, _plan_field(plan_id, "mu_id"), _plan_field(plan_id, "crop_id"), _plan_field(plan_id, "season_id"), _plan_field(plan_id, "product_id"))
        rows = db.execute(
            """
            SELECT a.*, l.share_pct FROM plan_line l JOIN activity_type a ON a.id = l.activity_type_id
            WHERE l.plan_id = ? ORDER BY l.share_pct DESC
            """,
            (plan_id,),
        ).fetchall()
    if len(rows) < 2:
        raise HTTPException(422, detail="At least two activity types are needed to suggest a cheaper mix")
    lines = [
        {
            "share_pct": row["share_pct"],
            "activity": {
                "activity_type_id": row["id"], "name": row["name"], "kind": row["kind"],
                "r": row["r_default"], "k": row["k_default"], "c": row["unit_cost"],
                "phase_split_pre": row["phase_split_pre"], "phase_split_on": row["phase_split_on"],
                "phase_split_post": row["phase_split_post"], "bucket": row["bucket"],
            },
        }
        for row in rows
    ]
    base = {
    **market,
    "crop_area": market["crop_area_acres"],
    "target_treated_pct": plan["target_treated_pct"],
    "lines": lines,
    "config": _config_for_market(market),
    }
    original = calculate_plan(base)
    high = max(lines, key=lambda line: line["activity"]["c"] / max(line["activity"]["r"] * line["activity"]["k"], 1e-12))
    low = min(lines, key=lambda line: line["activity"]["c"] / max(line["activity"]["r"] * line["activity"]["k"], 1e-12))
    best = original
    for _ in range(20):
        if high["share_pct"] <= 0.05:
            break
        moved = min(0.05, high["share_pct"] - 0.05)
        high["share_pct"] -= moved
        low["share_pct"] += moved
        candidate = calculate_plan(base)
        if candidate["budget_total"] < best["budget_total"] and candidate["planned_converts"] >= candidate["farmers_to_convert"]:
            best = candidate
    return {"original_budget": original["budget_total"], "suggested": best, "savings": original["budget_total"] - best["budget_total"]}


@app.post("/api/plans/{plan_id}/generate-calendar")
def generate_calendar(plan_id: int) -> dict[str, Any]:
    with connect() as db:
        plan = db.execute("SELECT * FROM campaign_plan WHERE id = ?", (plan_id,)).fetchone()
        if not plan:
            raise HTTPException(404, detail="Plan not found")
        if plan["status"] not in ("approved", "locked", "live"):
            raise HTTPException(409, detail="Approve a plan before generating its calendar")
        existing = db.execute("SELECT COUNT(*) FROM activity_event WHERE plan_id = ?", (plan_id,)).fetchone()[0]
        if existing:
            return {"plan_id": plan_id, "created": 0, "message": "Calendar already exists"}
        anchor = date.fromisoformat(plan["anchor_date"])
        config = _read_config(db)
        pre_days = int(config["pre_season_days"])
        on_days = int(config["on_season_days"])
        post_days = int(config["post_season_days"])
        skip_sundays = bool(config["skip_sundays"])
        for row in db.execute("SELECT l.*, a.phase_split_pre, a.phase_split_on, a.phase_split_post FROM plan_line l JOIN activity_type a ON a.id = l.activity_type_id WHERE l.plan_id = ?", (plan_id,)).fetchall():
            counts = _phase_counts(row["n"], [row["phase_split_pre"], row["phase_split_on"], row["phase_split_post"]])
            windows = [
                (anchor - timedelta(days=pre_days), anchor - timedelta(days=1)),
                (anchor, anchor + timedelta(days=on_days)),
                (anchor + timedelta(days=on_days + 1), anchor + timedelta(days=on_days + post_days)),
            ]
            for count, (start, end) in zip(counts, windows):
                dates = _spread_dates(start, end, count, skip_sundays)
                for scheduled in dates:
                    db.execute(
                        "INSERT INTO activity_event (plan_id, activity_type_id, scheduled_date, status) VALUES (?, ?, ?, 'scheduled')",
                        (plan_id, row["activity_type_id"], scheduled.isoformat()),
                    )
        db.execute("UPDATE campaign_plan SET status = 'live' WHERE id = ? AND status IN ('approved', 'locked')", (plan_id,))
        created = db.execute("SELECT COUNT(*) FROM activity_event WHERE plan_id = ?", (plan_id,)).fetchone()[0]
    return {"plan_id": plan_id, "created": created}


@app.post("/api/plans/{plan_id}/{action}")
def plan_action(
    plan_id: int,
    action: str,
    reason: str | None = None,
    x_user_role: str = Header(default="marketing"),
) -> dict[str, Any]:
    transitions = {
        "submit": ("draft", "submitted"),
        "approve": ("submitted", "approved"),
        "lock": ("approved", "locked"),
        "revise": ("locked", "draft"),
    }
    if action not in transitions:
        raise HTTPException(404, detail="Unknown plan action")
    allowed_from, to_status = transitions[action]
    if action == "revise" and not reason:
        raise HTTPException(422, detail="A reason is required to revise a locked plan")
    if action in ("approve", "lock") and x_user_role not in {"admin", "head_office", "zone", "region_manager"}:
        raise HTTPException(403, detail="Only a region manager or above can approve or lock a plan")
    with connect() as db:
        row = db.execute("SELECT * FROM campaign_plan WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(404, detail="Plan not found")
        if row["status"] != allowed_from:
            raise HTTPException(409, detail=f"Cannot {action} a plan in '{row['status']}' status")
        result = json.loads(row["result_json"] or "{}")
        if action == "submit" and any(check.get("status") == "red" for check in result.get("checks", [])):
            raise HTTPException(422, detail="Plan has red checks and cannot be submitted")
        if action == "revise":
            version = row["version"] + 1
            new_id = db.execute(
                """
                INSERT INTO campaign_plan
                (mu_id, crop_id, season_id, product_id, target_treated_pct, anchor_date, status, version, segment_override, override_reason, created_by, result_json)
                VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
                """,
                (
                    row["mu_id"], row["crop_id"], row["season_id"], row["product_id"], row["target_treated_pct"],
                    row["anchor_date"], version, row["segment_override"], row["override_reason"], row["created_by"], row["result_json"],
                ),
            ).lastrowid
            for line in db.execute("SELECT * FROM plan_line WHERE plan_id = ?", (plan_id,)).fetchall():
                db.execute(
                    """
                    INSERT INTO plan_line (plan_id, activity_type_id, share_pct, r, k, c, n, budget, budget_pre, budget_on, budget_post, line_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_id, line["activity_type_id"], line["share_pct"], line["r"], line["k"], line["c"],
                        line["n"], line["budget"], line["budget_pre"], line["budget_on"], line["budget_post"], line["line_json"],
                    ),
                )
            for check in db.execute("SELECT * FROM plan_check WHERE plan_id = ?", (plan_id,)).fetchall():
                db.execute(
                    "INSERT INTO plan_check (plan_id, check_name, value, limit_value, status, message) VALUES (?, ?, ?, ?, ?, ?)",
                    (new_id, check["check_name"], check["value"], check["limit_value"], check["status"], check["message"]),
                )
            db.execute(
                "INSERT INTO plan_audit (plan_id, action, user_name, reason, before_json, after_json) VALUES (?, 'revised', 'Marketing team', ?, ?, ?)",
                (plan_id, reason, json.dumps({"status": row["status"], "version": row["version"]}), json.dumps({"new_plan_id": new_id, "version": version})),
            )
            db.execute(
                "INSERT INTO plan_audit (plan_id, action, user_name, reason, after_json) VALUES (?, 'created_from_revision', 'Marketing team', ?, ?)",
                (new_id, reason, json.dumps({"source_plan_id": plan_id, "version": version})),
            )
            return {"id": new_id, "source_plan_id": plan_id, "status": "draft", "version": version}
        version = row["version"]
        db.execute("UPDATE campaign_plan SET status = ? WHERE id = ?", (to_status, plan_id))
        db.execute(
            "INSERT INTO plan_audit (plan_id, action, user_name, reason, before_json, after_json) VALUES (?, ?, 'Marketing team', ?, ?, ?)",
            (plan_id, action, reason, json.dumps({"status": row["status"], "version": version}), json.dumps({"status": to_status, "version": version})),
        )
    return {"id": plan_id, "status": to_status, "version": version}


@app.get("/api/calendar")
def calendar(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    mu_id: int | None = None,
    plan_id: int | None = None,
) -> list[dict[str, Any]]:
    from_date = from_date or date.today()
    to_date = to_date or (from_date + timedelta(days=60))
    with connect() as db:
        rows = db.execute(
            """
            SELECT e.*, a.name AS activity_name, a.kind, mu.name AS mu_name, c.name AS crop_name, p.status AS plan_status
            FROM activity_event e JOIN campaign_plan p ON p.id = e.plan_id
            JOIN activity_type a ON a.id = e.activity_type_id JOIN mu ON mu.id = p.mu_id
            JOIN crop c ON c.id = p.crop_id
            WHERE e.scheduled_date BETWEEN ? AND ? AND (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.id = ?)
            ORDER BY e.scheduled_date, a.name
            """,
            (from_date.isoformat(), to_date.isoformat(), mu_id, mu_id, plan_id, plan_id),
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/performance")
def performance(mu_id: int | None = None, crop_id: int | None = None) -> dict[str, Any]:
    with connect() as db:
        scope_sql = " AND (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.crop_id = ?)"
        events = db.execute(
            """
            SELECT e.*, a.name AS activity_name, a.unit_cost FROM activity_event e
            JOIN campaign_plan p ON p.id = e.plan_id JOIN activity_type a ON a.id = e.activity_type_id
            WHERE 1=1 """ + scope_sql,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchall()
        result_rows = db.execute(
            """
            SELECT p.result_json, p.id, p.status, s.start_date, s.end_date FROM campaign_plan p
            JOIN season s ON s.id = p.season_id
            WHERE (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.crop_id = ?)
            """,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchall()
        callback_rows = db.execute(
            """
            SELECT a.name AS activity_name, COUNT(cb.id) AS calls, SUM(CASE WHEN cb.will_buy = 1 THEN 1 ELSE 0 END) AS positives
            FROM callback cb JOIN activity_event e ON e.id = cb.activity_event_id
            JOIN activity_type a ON a.id = cb.motivating_activity_type_id
            JOIN campaign_plan p ON p.id = e.plan_id
            WHERE cb.called_at IS NOT NULL AND cb.will_buy IS NOT NULL
              AND (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.crop_id = ?)
            GROUP BY a.name
            """,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchall()
        sales_rows = db.execute(
            """
            SELECT SUM(packs_liquidated) AS liquidated, SUM(po_packs) AS po_packs
            FROM sales_import WHERE (? IS NULL OR mu_id = ?) AND (? IS NULL OR crop_id = ?)
            """,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchone()
        valid_reach = db.execute(
            """
            SELECT COUNT(DISTINCT ec.farmer_id) FROM event_contact ec
            JOIN activity_event e ON e.id = ec.activity_event_id
            JOIN campaign_plan p ON p.id = e.plan_id
            WHERE e.status = 'done'
              AND (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.crop_id = ?)
              AND NOT EXISTS (SELECT 1 FROM audit_flag f WHERE f.activity_event_id = e.id AND f.resolved = 0)
            """,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchone()[0]
        demo_rows = db.execute(
            """
            SELECT d.treated_yield, d.control_yield, d.price FROM demo_result d
            JOIN activity_event e ON e.id = d.activity_event_id JOIN campaign_plan p ON p.id = e.plan_id
            WHERE (? IS NULL OR p.mu_id = ?) AND (? IS NULL OR p.crop_id = ?)
            """,
            (mu_id, mu_id, crop_id, crop_id),
        ).fetchall()
    today = date.today()
    due_events = [event for event in events if date.fromisoformat(event["scheduled_date"]) <= today]
    done = [event for event in due_events if event["status"] == "done"]
    planned = len(due_events)
    actual_spend = sum(event["actual_cost"] or 0 for event in done)
    plan_results = [json.loads(row["result_json"] or "{}") for row in result_rows]
    approved_budget = sum(
        json.loads(row["result_json"] or "{}").get("budget_total", 0)
        for row in result_rows if row["status"] in ("approved", "locked", "live", "closed")
    )
    converted = sum(int(row["positives"] or 0) for row in callback_rows)
    liquidated = float(sales_rows["liquidated"] or 0)
    po_packs = float(sales_rows["po_packs"] or 0)
    planned_packs = sum(item.get("y_packs", 0) for item in plan_results)
    periods = {
        (row["start_date"], row["end_date"])
        for row in result_rows
    }
    season_days = max(
        ((date.fromisoformat(end) - date.fromisoformat(start)).days + 1 for start, end in periods),
        default=0,
    )
    elapsed_days = max(
        (
            max(min((today - date.fromisoformat(start)).days + 1, (date.fromisoformat(end) - date.fromisoformat(start)).days + 1), 0)
            for start, end in periods
        ),
        default=0,
    )
    projected_packs = liquidated / elapsed_days * season_days if elapsed_days > 0 else None
    report_quality = len([
        event for event in done
        if event["gps_lat"] is not None
        and event["gps_lng"] is not None
        and event["photo_hash"]
        and not _has_open_flag(event["id"])
        and _photo_is_unique(event["id"], event["photo_hash"])
    ]) / len(done) if done else 0
    demo_yield_gain = (
        sum((row["treated_yield"] - row["control_yield"]) / row["control_yield"] for row in demo_rows if row["control_yield"] > 0) / len(demo_rows)
        if demo_rows else None
    )
    demo_value_gain = (
        sum((row["treated_yield"] - row["control_yield"]) * row["price"] for row in demo_rows) / len(demo_rows)
        if demo_rows else None
    )
    progress_events = [
        event for event in events
        if date.fromisoformat(event["scheduled_date"]) <= today
    ]
    return {
        "kpis": {
            "activity_completion": len(done) / planned if planned else 0,
            "scheduled_events": planned,
            "done_events": len(done),
            "verified_unique_reach": int(valid_reach),
            "budget_utilisation": actual_spend / approved_budget if approved_budget else 0,
            "committed_budget": sum(event["unit_cost"] for event in events if event["status"] == "scheduled"),
            "actual_spend": actual_spend,
            "converted_farmers": converted,
            "cost_per_converted_farmer": actual_spend / converted if converted else None,
            "liquidation_vs_plan": liquidated / planned_packs if planned_packs else 0,
            "liquidated_packs": liquidated,
            "po_liquidation_pct": liquidated / po_packs if po_packs else 0,
            "lrr_projected_packs": projected_packs,
            "lrr_vs_goal": projected_packs / planned_packs if projected_packs is not None and planned_packs else None,
            "forecast_accuracy": None,
            "demo_yield_gain": demo_yield_gain,
            "demo_value_gain_per_acre": demo_value_gain,
            "campaign_roi_estimate": None,
            "campaign_roi_label": "Estimate · requires comparable non-campaign sales baseline",
            "report_quality": report_quality,
        },
        "progress_by_activity": _group_event_progress(progress_events),
        "conversion_by_activity": [
            {
                "activity": row["activity_name"],
                "calls": row["calls"],
                "positives": int(row["positives"] or 0),
                "conversion_rate": (row["positives"] or 0) / row["calls"] if row["calls"] else 0,
            }
            for row in callback_rows
        ],
    }


@app.get("/api/audit-queue")
def audit_queue() -> list[dict[str, Any]]:
    with connect() as db:
        return [
            dict(row)
            for row in db.execute(
                """
                SELECT f.id AS flag_id, f.flag_type, f.detail, f.resolved, e.id AS event_id, e.scheduled_date,
                       a.name AS activity_name, mu.name AS mu_name
                FROM audit_flag f JOIN activity_event e ON e.id = f.activity_event_id
                JOIN activity_type a ON a.id = e.activity_type_id
                JOIN campaign_plan p ON p.id = e.plan_id JOIN mu ON mu.id = p.mu_id
                WHERE f.resolved = 0 ORDER BY e.scheduled_date
                """
            )
        ]


@app.post("/api/events/{event_id}/report")
def report_event(event_id: int, report: EventReportRequest) -> dict[str, Any]:
    with connect() as db:
        event = db.execute(
            """
            SELECT e.*, a.r_default, a.unit_cost, p.mu_id FROM activity_event e
            JOIN activity_type a ON a.id = e.activity_type_id
            JOIN campaign_plan p ON p.id = e.plan_id WHERE e.id = ?
            """,
            (event_id,),
        ).fetchone()
        if not event:
            raise HTTPException(404, detail="Activity event not found")
        config = _read_config(db)
        db.execute(
            """
            UPDATE activity_event SET status = 'done', actual_date = ?, attendance = ?, actual_cost = ?,
              gps_lat = ?, gps_lng = ?, photo_hash = ? WHERE id = ?
            """,
            (report.actual_date.isoformat(), report.attendance, report.actual_cost, report.gps_lat, report.gps_lng, report.photo_hash, event_id),
        )
        valid_contacts = []
        if report.farmer_ids:
            placeholders = ",".join("?" for _ in report.farmer_ids)
            valid_contacts = [
                row["id"]
                for row in db.execute(
                    f"SELECT id FROM farmer WHERE mu_id = ? AND id IN ({placeholders})",
                    (event["mu_id"], *report.farmer_ids),
                )
            ]
            if len(set(valid_contacts)) != len(set(report.farmer_ids)):
                raise HTTPException(422, detail="One or more farmer contacts do not belong to this marketing unit")
            db.executemany(
                "INSERT OR IGNORE INTO event_contact (activity_event_id, farmer_id) VALUES (?, ?)",
                [(event_id, farmer_id) for farmer_id in valid_contacts],
            )
            sample_pct = float(config.get("callback_sample_pct", .10))
            sample_count = min(len(valid_contacts), math.ceil(len(valid_contacts) * sample_pct))
            activity_id = event["activity_type_id"]
            for farmer_id in random.sample(valid_contacts, sample_count):
                db.execute(
                    """
                    INSERT INTO callback (farmer_id, activity_event_id, motivating_activity_type_id)
                    SELECT ?, ?, ? WHERE NOT EXISTS (
                      SELECT 1 FROM callback WHERE farmer_id = ? AND activity_event_id = ?
                    )
                    """,
                    (farmer_id, event_id, activity_id, farmer_id, event_id),
                )
        attendance_floor = float(config["attendance_floor_pct"])
        if report.attendance < event["r_default"] * attendance_floor:
            _insert_flag(db, event_id, "low_attendance", f"Attendance {report.attendance} is below {attendance_floor:.0%} of reach {event['r_default']}")
        if report.gps_lat is None or report.gps_lng is None:
            _insert_flag(db, event_id, "missing_gps", "Field report is missing GPS coordinates")
        if report.photo_hash and db.execute("SELECT COUNT(*) FROM activity_event WHERE photo_hash = ? AND id != ?", (report.photo_hash, event_id)).fetchone()[0]:
            _insert_flag(db, event_id, "photo_reuse", "Photo hash has already been used on another event")
        cost_limit = float(config["max_cost_multiple"])
        if report.actual_cost > event["unit_cost"] * cost_limit:
            _insert_flag(db, event_id, "cost_overrun", f"Actual cost exceeds {cost_limit:.0%} of planned {format_inr(event['unit_cost'], 0)}")
        delayed = (date.today() - report.actual_date).days > int(config["late_report_days"])
        if delayed:
            _insert_flag(db, event_id, "late_report", "Report was submitted more than 3 days after the activity")
        flags = db.execute("SELECT flag_type, detail FROM audit_flag WHERE activity_event_id = ? AND resolved = 0", (event_id,)).fetchall()
    return {"event_id": event_id, "status": "done", "audit_flags": [dict(flag) for flag in flags]}


@app.get("/api/mdo/today")
def mdo_today(mu_id: int | None = None) -> list[dict[str, Any]]:
    with connect() as db:
        if mu_id is None:
            default_mu = db.execute("SELECT id FROM mu WHERE name = 'Niphad West'").fetchone()
            mu_id = default_mu["id"] if default_mu else None
        today = date.today().isoformat()
        return [
            dict(row)
            for row in db.execute(
                """
                SELECT e.id, e.scheduled_date, e.status, a.name AS activity_name, mu.name AS mu_name,
                       c.name AS crop_name
                FROM activity_event e JOIN campaign_plan p ON p.id = e.plan_id
                JOIN activity_type a ON a.id = e.activity_type_id JOIN mu ON mu.id = p.mu_id
                JOIN crop c ON c.id = p.crop_id
                WHERE p.mu_id = ? AND e.scheduled_date >= ? AND e.status = 'scheduled'
                ORDER BY e.scheduled_date LIMIT 100
                """,
                (mu_id, today),
            )
        ]


@app.patch("/api/audit-flags/{flag_id}")
def resolve_audit_flag(flag_id: int, payload: AuditFlagRequest) -> dict[str, Any]:
    with connect() as db:
        cursor = db.execute("UPDATE audit_flag SET resolved = ? WHERE id = ?", (payload.resolved, flag_id))
        if not cursor.rowcount:
            raise HTTPException(404, detail="Audit flag not found")
    return {"id": flag_id, "resolved": payload.resolved}


@app.post("/api/farmers", status_code=201)
def create_farmer(payload: FarmerRequest) -> dict[str, Any]:
    with connect() as db:
        if not db.execute("SELECT 1 FROM mu WHERE id = ?", (payload.mu_id,)).fetchone():
            raise HTTPException(404, detail="Marketing unit not found")
        if payload.consent_advice and db.execute(
            "SELECT 1 FROM consent_withdrawal WHERE phone = ? LIMIT 1", (payload.phone.strip(),)
        ).fetchone():
            raise HTTPException(409, detail="This number has withdrawn advisory consent")
        cursor = db.execute(
            """
            INSERT INTO farmer (mu_id, name, phone, farmer_type, area_acres, consent_record, consent_advice, consent_proof_url, language)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.mu_id, payload.name.strip(), payload.phone.strip(), payload.farmer_type,
                payload.area_acres, payload.consent_record, payload.consent_advice,
                payload.consent_proof_url, payload.language,
            ),
        )
    return {"id": cursor.lastrowid, **payload.model_dump()}


@app.post("/api/consent/withdraw")
def withdraw_consent(payload: ConsentWithdrawalRequest) -> dict[str, Any]:
    with connect() as db:
        db.execute(
            "UPDATE farmer SET consent_advice = 0 WHERE phone = ?",
            (payload.phone.strip(),),
        )
        db.execute(
            "INSERT INTO consent_withdrawal (phone, reason) VALUES (?, ?)",
            (payload.phone.strip(), payload.reason),
        )
        affected = db.execute("SELECT changes()").fetchone()[0]
    return {"phone": payload.phone, "consent_advice": False, "records_updated": affected}


@app.get("/api/consent/log")
def consent_log() -> StreamingResponse:
    with connect() as db:
        rows = db.execute(
            """
            SELECT f.id, f.name, f.phone, f.consent_record, f.consent_advice,
                   f.consent_proof_url, f.language, f.mu_id
            FROM farmer f ORDER BY f.id
            """
        ).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["farmer_id", "name", "phone", "consent_record", "consent_advice", "consent_proof_url", "language", "mu_id"])
    writer.writerows([tuple(row) for row in rows])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=campaigniq-consent-log.csv"})


@app.get("/api/callbacks/queue")
def callback_queue() -> list[dict[str, Any]]:
    with connect() as db:
        return [
            dict(row)
            for row in db.execute(
                """
                SELECT cb.id, f.name AS farmer_name, a.name AS activity_name, cb.called_at
                FROM callback cb JOIN farmer f ON f.id = cb.farmer_id
                JOIN activity_event e ON e.id = cb.activity_event_id JOIN activity_type a ON a.id = e.activity_type_id
                WHERE cb.called_at IS NULL ORDER BY cb.id
                """
            )
        ]


@app.post("/api/callbacks/{callback_id}")
def record_callback(callback_id: int, payload: CallbackRequest) -> dict[str, Any]:
    with connect() as db:
        cursor = db.execute(
            """
            UPDATE callback SET called_at = ?, will_buy = ?, bought = ?, motivating_activity_type_id = COALESCE(?, motivating_activity_type_id)
            WHERE id = ? AND called_at IS NULL
            """,
            (datetime.now().isoformat(timespec="seconds"), payload.will_buy, payload.bought, payload.motivating_activity_type_id, callback_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(404, detail="Uncalled callback task not found")
    return {"id": callback_id, "recorded": True}


@app.post("/api/import/sales")
async def import_sales(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(422, detail="Upload a .csv file")
    contents = await file.read()
    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
        required = {"mu_id", "crop_id", "product_id", "month", "packs_liquidated", "po_packs"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError(f"CSV must include columns: {', '.join(sorted(required))}")
        rows = [
            (
                int(row["mu_id"]), int(row["crop_id"]), int(row["product_id"]), row["month"],
                float(row["packs_liquidated"]), float(row["po_packs"]),
            )
            for row in reader
        ]
        if any(not (0 <= row[4] and 0 <= row[5]) for row in rows):
            raise ValueError("Sales and purchase-order packs must be non-negative")
    except (UnicodeDecodeError, ValueError, TypeError) as exc:
        raise HTTPException(422, detail=f"Invalid sales CSV: {exc}") from exc
    with connect() as db:
        db.executemany(
            "INSERT INTO sales_import (mu_id, crop_id, product_id, month, packs_liquidated, po_packs) VALUES (?, ?, ?, ?, ?, ?)",
            rows,
        )
    return {"imported_rows": len(rows)}


@app.post("/api/import/market")
async def import_market(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(422, detail="Upload a .csv file")
    contents = await file.read()
    required = {
        "mu_id", "crop_id", "season_id", "crop_area_acres", "amp_pct", "current_treated_pct",
        "avg_area_per_farmer", "competition_note", "source", "as_of_date",
    }
    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError(f"CSV must include columns: {', '.join(sorted(required))}")
        rows = []
        for row in reader:
            values = (
                int(row["mu_id"]),
                int(row["crop_id"]),
                int(row["season_id"]),
                float(row["crop_area_acres"]),
                float(row["amp_pct"]),
                float(row["current_treated_pct"]),
                float(row["avg_area_per_farmer"]),
                row["competition_note"].strip(),
                row.get("soil_deficiency_json") or "[]",
                float(row.get("rainfall_dev_pct") or 0),
                float(row.get("crop_price") or 0),
                int(row.get("active_dealers") or 0),
                row["source"].strip(),
                date.fromisoformat(row["as_of_date"]).isoformat(),
            )
            if values[3] < 0 or values[4] < 0 or values[4] > 1 or values[5] < 0 or values[5] > 1 or values[6] <= 0:
                raise ValueError("Area, AMP, treated share, and average farmer area are outside valid ranges")
            json.loads(values[8])
            rows.append(values)
    except (UnicodeDecodeError, ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(422, detail=f"Invalid market CSV: {exc}") from exc
    with connect() as db:
        db.executemany(
            """
            INSERT INTO market_data
            (mu_id, crop_id, season_id, crop_area_acres, amp_pct, current_treated_pct, avg_area_per_farmer,
             competition_note, soil_deficiency_json, rainfall_dev_pct, crop_price, active_dealers, source, as_of_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(mu_id, crop_id, season_id) DO UPDATE SET
              crop_area_acres = excluded.crop_area_acres, amp_pct = excluded.amp_pct,
              current_treated_pct = excluded.current_treated_pct, avg_area_per_farmer = excluded.avg_area_per_farmer,
              competition_note = excluded.competition_note, soil_deficiency_json = excluded.soil_deficiency_json,
              rainfall_dev_pct = excluded.rainfall_dev_pct, crop_price = excluded.crop_price,
              active_dealers = excluded.active_dealers, source = excluded.source, as_of_date = excluded.as_of_date
            """,
            rows,
        )
    return {"imported_rows": len(rows)}


@app.get("/api/reports/weekly")
def weekly_report(week: str | None = None, mu_id: int | None = None, crop_id: int | None = None) -> dict[str, Any]:
    return {
        "period": week or date.today().strftime("%G-W%V"),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "performance": performance(mu_id=mu_id, crop_id=crop_id),
        "risks": risks(),
        "label": "Illustrative operational review; confirm imported sales data before external circulation.",
    }


@app.get("/api/reports/monthly")
def monthly_report(month: str | None = None, mu_id: int | None = None, crop_id: int | None = None) -> dict[str, Any]:
    return {
        "period": month or date.today().strftime("%Y-%m"),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "performance": performance(mu_id=mu_id, crop_id=crop_id),
        "risks": risks(),
        "label": "Illustrative operational review; confirm imported sales data before external circulation.",
    }


def _read_config(db: sqlite3.Connection) -> dict[str, Any]:
    config = DEFAULT_CONFIG.copy()
    for row in db.execute("SELECT key, value FROM config"):
        if row["key"] not in config:
            continue
        try:
            config[row["key"]] = json.loads(row["value"])
        except json.JSONDecodeError:
            config[row["key"]] = float(row["value"])
    return config


def _learning_values(
    db: sqlite3.Connection,
    crop_id: int | None,
    segment: str | None,
    prior_strength: float = 50,
) -> dict[int, dict[str, float | int]]:
    if not crop_id or not segment:
        return {}
    rows = db.execute(
        """
        SELECT cb.motivating_activity_type_id, cb.will_buy, cb.bought, p.result_json
        FROM callback cb JOIN activity_event e ON e.id = cb.activity_event_id
        JOIN campaign_plan p ON p.id = e.plan_id
        WHERE cb.called_at IS NOT NULL AND cb.will_buy IS NOT NULL AND p.crop_id = ?
        """,
        (crop_id,),
    ).fetchall()
    totals: dict[int, list[int]] = {}
    for row in rows:
        result = json.loads(row["result_json"] or "{}")
        if result.get("segment") != segment or row["motivating_activity_type_id"] is None:
            continue
        activity_id = int(row["motivating_activity_type_id"])
        aggregate = totals.setdefault(activity_id, [0, 0])
        aggregate[0] += 1
        aggregate[1] += int(row["bought"] if row["bought"] is not None else row["will_buy"])
    defaults = {
        row["id"]: row["k_default"]
        for row in db.execute("SELECT id, k_default FROM activity_type")
    }
    return {
        activity_id: {
            "k": (defaults[activity_id] * prior_strength + positives) / (prior_strength + calls),
            "sample_size": calls,
        }
        for activity_id, (calls, positives) in totals.items()
        if calls and activity_id in defaults
    }


def _read_rules(db: sqlite3.Connection) -> list[dict[str, Any]]:
    return [
        {
            "segment": row["segment"],
            "min_pen": row["min_pen"],
            "max_pen": row["max_pen"] if row["max_pen"] is not None else float("inf"),
            "objective": row["objective"],
            "spend_cap_pct": row["spend_cap_pct"],
        }
        for row in db.execute("SELECT segment, min_pen, max_pen, objective, spend_cap_pct FROM segment_rule ORDER BY min_pen")
    ]


def _config_for_market(market: dict[str, Any]) -> dict[str, Any]:
    config = DEFAULT_CONFIG.copy()
    config["mdo_count"] = market["mdo_count"]
    config["villages_count"] = market["villages_count"]
    return config


def _persist_calculation(db: sqlite3.Connection, plan_id: int, result: dict[str, Any]) -> None:
    for line in result["lines"]:
        db.execute(
            """
            INSERT INTO plan_line
            (plan_id, activity_type_id, share_pct, r, k, c, n, budget, budget_pre, budget_on, budget_post, line_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                plan_id, line["activity_type_id"], line["share_pct"], line["r"], line["k"], line["c"],
                line["n"], line["budget"], line["budget_pre"], line["budget_on"], line["budget_post"], json.dumps(line),
            ),
        )
    for check in result["checks"]:
        db.execute(
            "INSERT INTO plan_check (plan_id, check_name, value, limit_value, status, message) VALUES (?, ?, ?, ?, ?, ?)",
            (plan_id, check["check_name"], check.get("value"), check.get("limit"), check["status"], check["message"]),
        )


def _phase_counts(total: int, shares: list[float]) -> list[int]:
    raw = [total * share for share in shares]
    counts = [math.floor(value) for value in raw]
    for index in sorted(range(3), key=lambda i: raw[i] - counts[i], reverse=True)[: total - sum(counts)]:
        counts[index] += 1
    return counts


def _spread_dates(start: date, end: date, count: int, skip_sundays: bool = True) -> list[date]:
    if count <= 0:
        return []
    window = max((end - start).days, 1)
    candidates = [
        start + timedelta(days=round(index * window / max(count - 1, 1)))
        for index in range(count)
    ]
    result = []
    for current in candidates:
        while skip_sundays and current.weekday() == 6:
            current += timedelta(days=1)
        result.append(current)
    return result


def _group_event_progress(events: list[sqlite3.Row]) -> list[dict[str, Any]]:
    groups: dict[str, dict[str, int]] = {}
    for event in events:
        group = groups.setdefault(event["activity_name"], {"planned": 0, "done": 0})
        group["planned"] += 1
        group["done"] += event["status"] == "done"
    return [{"activity": name, **values} for name, values in groups.items()]


def _contacts_for_event(event_id: int) -> list[int]:
    with connect() as db:
        return [row[0] for row in db.execute("SELECT farmer_id FROM event_contact WHERE activity_event_id = ?", (event_id,))]


def _has_open_flag(event_id: int) -> bool:
    with connect() as db:
        return db.execute("SELECT 1 FROM audit_flag WHERE activity_event_id = ? AND resolved = 0 LIMIT 1", (event_id,)).fetchone() is not None


def _photo_is_unique(event_id: int, photo_hash: str) -> bool:
    with connect() as db:
        return db.execute(
            "SELECT COUNT(*) FROM activity_event WHERE photo_hash = ? AND id != ?",
            (photo_hash, event_id),
        ).fetchone()[0] == 0


def _insert_flag(db: sqlite3.Connection, event_id: int, flag_type: str, detail: str) -> None:
    db.execute(
        "INSERT INTO audit_flag (activity_event_id, flag_type, detail) VALUES (?, ?, ?)",
        (event_id, flag_type, detail),
    )


def _plan_field(plan_id: int, field: str) -> int:
    with connect() as db:
        row = db.execute(f"SELECT {field} FROM campaign_plan WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(404, detail="Plan not found")
        return int(row[0])
