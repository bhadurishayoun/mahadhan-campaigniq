"""SQLite schema and repeatable demo seed data."""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Iterator

from .engine import SEGMENT_RULES, calculate_plan

SERVER_DIR = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.environ.get("CAMPAIGNIQ_DB", SERVER_DIR / "data" / "campaigniq-python.db"))

CROPS = [
    ("Banana", "planting"),
    ("Cotton", "sowing"),
    ("Grapes", "pruning"),
    ("Groundnut", "sowing"),
    ("Onion", "transplanting"),
    ("Pomegranate", "pruning"),
    ("Soybean", "sowing"),
    ("Sugarcane", "planting"),
    ("Tomato", "transplanting"),
]

ACTIVITIES = [
    ("Crop demo with control strip", "demo", 25, .12, 6500, 0, 1, 0, "proven"),
    ("Early field day + harvest days", "field_day", 150, .05, 20000, 1 / 3, 0, 2 / 3, "proven"),
    ("Group farmer meeting (8–10)", "group_meeting", 10, .10, 1500, .65, .35, 0, "proven"),
    ("One-to-one contact", "one_to_one", 1, .15, 100, .65, .35, 0, "proven"),
    ("Large farmer meeting (75–100)", "large_meeting", 90, .04, 12000, .75, .25, 0, "proven"),
    ("Multiplier meet", "multiplier_meet", 60, .06, 15000, 1, 0, 0, "scaling"),
    ("HVC / branded van campaign", "hvc", 300, .02, 25000, .25, .75, 0, "proven"),
    ("Tray pe Charcha (retailer counter)", "retailer", 30, .08, 3000, .3, .7, 0, "scaling"),
    ("Wall painting / hoarding", "wall_painting", 500, .005, 4000, .5, .5, 0, "proven"),
    ("Key influencer engagement", "influencer", 20, .05, 5000, .4, .4, .2, "pilot"),
]

MUS = [
    ("Niphad West", "Nashik", 3000, .30, .05, "Low", 10),
    ("Yeola North", "Nashik", 3833, .30, .072, "Low", 12),
    ("Niphad East", "Nashik", 4400, .30, .132, "Medium", 12),
    ("Sinnar East", "Nashik", 2600, .30, .114, "Medium", 10),
    ("Chandwad", "Nashik", 3400, .30, .174, "Medium", 11),
    ("Malegaon", "Nashik", 2333, .30, .189, "High", 10),
    ("Baglan", "Nashik", 2867, .30, .234, "High", 10),
    ("Dhule Central", "Dhule", 3100, .30, .075, "Low", 12),
    ("Jalgaon East", "Jalgaon", 3250, .30, .15, "Medium", 11),
]


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database() -> None:
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS geo_unit (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                level TEXT NOT NULL,
                parent_id INTEGER REFERENCES geo_unit(id)
            );
            CREATE TABLE IF NOT EXISTS mu (
                id INTEGER PRIMARY KEY,
                geo_unit_id INTEGER NOT NULL REFERENCES geo_unit(id),
                name TEXT NOT NULL,
                villages_count INTEGER NOT NULL DEFAULT 10,
                mdo_count INTEGER NOT NULL DEFAULT 1,
                mdo_user_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS crop (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                stage_anchor TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS crop_stage (
                id INTEGER PRIMARY KEY,
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                stage_name TEXT NOT NULL,
                start_day INTEGER NOT NULL,
                end_day INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS season (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                budget_lock_date TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS product (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                pack_kg REAL NOT NULL,
                price_per_pack REAL NOT NULL,
                placeholder INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS crop_product_dose (
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                product_id INTEGER NOT NULL REFERENCES product(id),
                stage_id INTEGER REFERENCES crop_stage(id),
                dose_packs_per_acre REAL NOT NULL,
                PRIMARY KEY (crop_id, product_id)
            );
            CREATE TABLE IF NOT EXISTS market_data (
                mu_id INTEGER NOT NULL REFERENCES mu(id),
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                season_id INTEGER NOT NULL REFERENCES season(id),
                crop_area_acres REAL NOT NULL,
                amp_pct REAL NOT NULL,
                current_treated_pct REAL NOT NULL,
                avg_area_per_farmer REAL NOT NULL,
                competition_note TEXT NOT NULL,
                soil_deficiency_json TEXT NOT NULL DEFAULT '[]',
                rainfall_dev_pct REAL NOT NULL DEFAULT 0,
                crop_price REAL NOT NULL DEFAULT 0,
                active_dealers INTEGER NOT NULL DEFAULT 0,
                source TEXT NOT NULL,
                as_of_date TEXT NOT NULL,
                PRIMARY KEY (mu_id, crop_id, season_id)
            );
            CREATE TABLE IF NOT EXISTS segment_rule (
                segment TEXT PRIMARY KEY,
                min_pen REAL NOT NULL,
                max_pen REAL,
                objective TEXT NOT NULL,
                spend_cap_pct REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS activity_type (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                kind TEXT NOT NULL,
                r_default REAL NOT NULL,
                k_default REAL NOT NULL,
                unit_cost REAL NOT NULL,
                phase_split_pre REAL NOT NULL,
                phase_split_on REAL NOT NULL,
                phase_split_post REAL NOT NULL,
                evidence_required INTEGER NOT NULL DEFAULT 0,
                bucket TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS playbook (
                segment TEXT NOT NULL,
                activity_type_id INTEGER NOT NULL REFERENCES activity_type(id),
                share_pct REAL NOT NULL,
                PRIMARY KEY (segment, activity_type_id)
            );
            CREATE TABLE IF NOT EXISTS mu_segment_override (
                mu_id INTEGER NOT NULL REFERENCES mu(id),
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                season_id INTEGER NOT NULL REFERENCES season(id),
                segment TEXT NOT NULL,
                reason TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (mu_id, crop_id, season_id)
            );
            CREATE TABLE IF NOT EXISTS campaign_plan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mu_id INTEGER NOT NULL REFERENCES mu(id),
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                season_id INTEGER NOT NULL REFERENCES season(id),
                product_id INTEGER NOT NULL REFERENCES product(id),
                target_treated_pct REAL NOT NULL,
                anchor_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                version INTEGER NOT NULL DEFAULT 1,
                segment_override TEXT,
                override_reason TEXT,
                created_by TEXT NOT NULL DEFAULT 'Marketing team',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                result_json TEXT NOT NULL DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS plan_line (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL REFERENCES campaign_plan(id) ON DELETE CASCADE,
                activity_type_id INTEGER NOT NULL REFERENCES activity_type(id),
                share_pct REAL NOT NULL,
                r REAL NOT NULL,
                k REAL NOT NULL,
                c REAL NOT NULL,
                n INTEGER NOT NULL,
                budget REAL NOT NULL,
                budget_pre REAL NOT NULL,
                budget_on REAL NOT NULL,
                budget_post REAL NOT NULL,
                line_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS plan_check (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL REFERENCES campaign_plan(id) ON DELETE CASCADE,
                check_name TEXT NOT NULL,
                value REAL,
                limit_value REAL,
                status TEXT NOT NULL,
                message TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS plan_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL REFERENCES campaign_plan(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                user_name TEXT NOT NULL,
                reason TEXT,
                before_json TEXT,
                after_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS activity_event (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL REFERENCES campaign_plan(id) ON DELETE CASCADE,
                activity_type_id INTEGER NOT NULL REFERENCES activity_type(id),
                scheduled_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'scheduled',
                actual_date TEXT,
                attendance INTEGER,
                actual_cost REAL,
                gps_lat REAL,
                gps_lng REAL,
                photo_hash TEXT
            );
            CREATE TABLE IF NOT EXISTS farmer (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mu_id INTEGER NOT NULL REFERENCES mu(id),
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                farmer_type TEXT NOT NULL,
                area_acres REAL NOT NULL DEFAULT 0,
                consent_advice INTEGER NOT NULL DEFAULT 0,
                consent_record INTEGER NOT NULL DEFAULT 0,
                consent_proof_url TEXT,
                language TEXT NOT NULL DEFAULT 'en'
            );
            CREATE TABLE IF NOT EXISTS consent_withdrawal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                withdrawn_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                reason TEXT
            );
            CREATE TABLE IF NOT EXISTS event_contact (
                activity_event_id INTEGER NOT NULL REFERENCES activity_event(id) ON DELETE CASCADE,
                farmer_id INTEGER NOT NULL REFERENCES farmer(id),
                PRIMARY KEY (activity_event_id, farmer_id)
            );
            CREATE TABLE IF NOT EXISTS callback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_id INTEGER NOT NULL REFERENCES farmer(id),
                activity_event_id INTEGER NOT NULL REFERENCES activity_event(id),
                called_at TEXT,
                will_buy INTEGER,
                bought INTEGER,
                motivating_activity_type_id INTEGER REFERENCES activity_type(id)
            );
            CREATE TABLE IF NOT EXISTS audit_flag (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_event_id INTEGER NOT NULL REFERENCES activity_event(id),
                flag_type TEXT NOT NULL,
                detail TEXT NOT NULL,
                resolved INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS sales_import (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mu_id INTEGER NOT NULL REFERENCES mu(id),
                crop_id INTEGER NOT NULL REFERENCES crop(id),
                product_id INTEGER NOT NULL REFERENCES product(id),
                month TEXT NOT NULL,
                packs_liquidated REAL NOT NULL,
                po_packs REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS demo_result (
                activity_event_id INTEGER PRIMARY KEY REFERENCES activity_event(id) ON DELETE CASCADE,
                treated_yield REAL NOT NULL,
                control_yield REAL NOT NULL,
                unit TEXT NOT NULL,
                price REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )
        _ensure_column(db, "farmer", "consent_record", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(db, "farmer", "consent_proof_url", "TEXT")
        _ensure_column(db, "farmer", "language", "TEXT NOT NULL DEFAULT 'en'")
        _ensure_column(db, "farmer", "area_acres", "REAL NOT NULL DEFAULT 0")
        _ensure_column(db, "crop_product_dose", "stage_id", "INTEGER REFERENCES crop_stage(id)")
        if db.execute("SELECT COUNT(*) FROM crop").fetchone()[0] == 0:
            _seed_reference(db)
            _seed_market(db)
            _seed_campaign(db)
        if db.execute("SELECT COUNT(*) FROM crop_stage").fetchone()[0] == 0:
            _seed_crop_stages(db)
        db.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('callback_sample_pct', '0.1')")
        db.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('prior_strength', '50')")
        db.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('dealer_lead_time_days', '15')")
        db.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('rainfall_risk_threshold_pct', '-30')")
        defaults = {
            "rainfall_risk_window_days": "15",
            "pre_season_days": "120",
            "on_season_days": "90",
            "post_season_days": "60",
            "skip_sundays": "true",
            "envelope_tolerance_pct": "0.05",
            "attendance_floor_pct": "0.5",
            "max_cost_multiple": "1.2",
            "late_report_days": "3",
            "market_stale_days": "90",
        }
        db.executemany("INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)", defaults.items())
        if db.execute("SELECT COUNT(*) FROM demo_result").fetchone()[0] == 0:
            demo_event = db.execute(
                "SELECT e.id FROM activity_event e JOIN activity_type a ON a.id = e.activity_type_id WHERE a.kind = 'demo' AND e.status = 'done' ORDER BY e.id LIMIT 1"
            ).fetchone()
            if demo_event:
                db.execute(
                    "INSERT INTO demo_result (activity_event_id, treated_yield, control_yield, unit, price) VALUES (?, 28, 24, 'q/acre', 2400)",
                    (demo_event["id"],),
                )


def _seed_reference(db: sqlite3.Connection) -> None:
    state_id = _insert_geo(db, "Maharashtra", "state")
    district_ids: dict[str, int] = {}
    for district in ("Nashik", "Dhule", "Jalgaon"):
        district_ids[district] = _insert_geo(db, district, "district", state_id)

    for name, district, *_ in MUS:
        geo_id = _insert_geo(db, name, "mu", district_ids[district])
        db.execute(
            "INSERT INTO mu (geo_unit_id, name, villages_count, mdo_count) VALUES (?, ?, ?, 1)",
            (geo_id, name, MUS[[row[0] for row in MUS].index(name)][6]),
        )

    for name, anchor in CROPS:
        crop_id = db.execute("INSERT INTO crop (name, stage_anchor) VALUES (?, ?)", (name, anchor)).lastrowid
        _seed_crop_stages(db, crop_id)
    db.execute(
        "INSERT INTO season (name, start_date, end_date, budget_lock_date) VALUES (?, ?, ?, ?)",
        ("Rabi 2026–27", "2026-10-01", "2027-03-31", "2026-11-30"),
    )
    for name, _ in CROPS:
        crop_id = db.execute("SELECT id FROM crop WHERE name = ?", (name,)).fetchone()[0]
        product_id = db.execute(
            "INSERT INTO product (name, category, pack_kg, price_per_pack, placeholder) VALUES (?, ?, ?, ?, 1)",
            (f"Croptek {name}", "Croptek", 50, 1800),
        ).lastrowid
        dose = 2 if name == "Onion" else 1.5
        db.execute(
            "INSERT INTO crop_product_dose (crop_id, product_id, stage_id, dose_packs_per_acre) VALUES (?, ?, ?, ?)",
            (crop_id, product_id, db.execute("SELECT id FROM crop_stage WHERE crop_id = ? ORDER BY start_day LIMIT 1", (crop_id,)).fetchone()[0], dose),
        )

    for rule in SEGMENT_RULES:
        max_pen = rule["max_pen"]
        db.execute(
            "INSERT INTO segment_rule (segment, min_pen, max_pen, objective, spend_cap_pct) VALUES (?, ?, ?, ?, ?)",
            (rule["segment"], rule["min_pen"], None if max_pen == float("inf") else max_pen, rule["objective"], rule["spend_cap_pct"]),
        )
    for activity in ACTIVITIES:
        db.execute(
            """
            INSERT INTO activity_type
            (name, kind, r_default, k_default, unit_cost, phase_split_pre, phase_split_on, phase_split_post, evidence_required, bucket)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (*activity[:8], 1 if activity[1] == "demo" else 0, activity[8]),
        )
    playbooks = {
        "Emerging": {"Crop demo with control strip": .40, "Early field day + harvest days": .30, "Group farmer meeting (8–10)": .20, "One-to-one contact": .10},
        "Growing": {"Group farmer meeting (8–10)": .25, "Large farmer meeting (75–100)": .20, "Key influencer engagement": .15, "Crop demo with control strip": .20, "Tray pe Charcha (retailer counter)": .20},
        "Maturing": {"HVC / branded van campaign": .35, "Tray pe Charcha (retailer counter)": .30, "Large farmer meeting (75–100)": .20, "Wall painting / hoarding": .15},
        "Matured": {"Wall painting / hoarding": .40, "Tray pe Charcha (retailer counter)": .35, "HVC / branded van campaign": .25},
    }
    for segment, mix in playbooks.items():
        for activity_name, share in mix.items():
            activity_id = db.execute("SELECT id FROM activity_type WHERE name = ?", (activity_name,)).fetchone()[0]
            db.execute(
                "INSERT INTO playbook (segment, activity_type_id, share_pct) VALUES (?, ?, ?)",
                (segment, activity_id, share),
            )
    configs = {
        "max_activities_per_mdo_week": "6",
        "active_weeks": "16",
        "retention_focus": "0.2",
        "amber_factor": "0.9",
        "contingency_pct": "0",
        "innovative_farmers_mapped": "null",
        "demo_farmers_per_village": "3",
        "callback_sample_pct": "0.1",
        "prior_strength": "50",
        "dealer_lead_time_days": "15",
        "rainfall_risk_threshold_pct": "-30",
        "rainfall_risk_window_days": "15",
        "pre_season_days": "120",
        "on_season_days": "90",
        "post_season_days": "60",
        "skip_sundays": "true",
        "envelope_tolerance_pct": "0.05",
        "attendance_floor_pct": "0.5",
        "max_cost_multiple": "1.2",
        "late_report_days": "3",
        "market_stale_days": "90",
        "envelope_split": json.dumps({"proven": .70, "scaling": .20, "pilot": .10}),
    }
    db.executemany("INSERT INTO config (key, value) VALUES (?, ?)", configs.items())


def _seed_market(db: sqlite3.Connection) -> None:
    season_id = db.execute("SELECT id FROM season LIMIT 1").fetchone()[0]
    crop_rows = db.execute("SELECT id, name FROM crop").fetchall()
    mu_rows = db.execute("SELECT id, name FROM mu ORDER BY id").fetchall()
    for crop in crop_rows:
        product_id = db.execute("SELECT product_id FROM crop_product_dose WHERE crop_id = ?", (crop["id"],)).fetchone()[0]
        for index, mu in enumerate(mu_rows):
            source_row = next(row for row in MUS if row[0] == mu["name"])
            name, _district, base_area, amp, treated, competition, villages = source_row
            if crop["name"] != "Onion":
                amp = max(.22, min(.42, amp + ((crop["id"] % 3) - 1) * .04))
                penetration_band = [0.17, .35, .63, .42, .69, .86, .88, .22, .58][index]
                treated = amp * penetration_band
                base_area = round(base_area * (0.8 + (crop["id"] % 5) * .08))
            db.execute(
                """
                INSERT INTO market_data
                (mu_id, crop_id, season_id, crop_area_acres, amp_pct, current_treated_pct, avg_area_per_farmer,
                 competition_note, soil_deficiency_json, rainfall_dev_pct, crop_price, active_dealers, source, as_of_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mu["id"],
                    crop["id"],
                    season_id,
                    base_area,
                    amp,
                    treated,
                    2.0 if crop["name"] == "Onion" else 1.8,
                    competition,
                    json.dumps(["Sulphur", "Zinc"] if crop["name"] in ("Onion", "Cotton") else ["Zinc"]),
                    -12 if index == 0 else -5 + index,
                    2400,
                    6 + index % 5,
                    "Illustrative market data",
                    "2026-10-01",
                ),
            )


def _seed_campaign(db: sqlite3.Connection) -> None:
    mu = db.execute("SELECT id FROM mu WHERE name = 'Niphad West'").fetchone()[0]
    crop = db.execute("SELECT id FROM crop WHERE name = 'Onion'").fetchone()[0]
    season = db.execute("SELECT id FROM season LIMIT 1").fetchone()[0]
    product = db.execute("SELECT product_id FROM crop_product_dose WHERE crop_id = ?", (crop,)).fetchone()[0]
    market = db.execute(
        "SELECT * FROM market_data WHERE mu_id = ? AND crop_id = ? AND season_id = ?",
        (mu, crop, season),
    ).fetchone()
    lines = _playbook_lines(db, "Emerging")
    data = {
        "crop_area": market["crop_area_acres"],
        "amp_pct": market["amp_pct"],
        "current_treated_pct": market["current_treated_pct"],
        "target_treated_pct": .10,
        "dose_packs_per_acre": 2,
        "pack_kg": 50,
        "price_per_pack": 1800,
        "avg_area_per_farmer": 2,
        "lines": lines,
        "config": {"villages_count": 10},
    }
    result = calculate_plan(data)
    plan_id = db.execute(
        """
        INSERT INTO campaign_plan
        (mu_id, crop_id, season_id, product_id, target_treated_pct, anchor_date, status, result_json)
        VALUES (?, ?, ?, ?, ?, ?, 'live', ?)
        """,
        (mu, crop, season, product, .10, "2026-12-15", json.dumps(result)),
    ).lastrowid
    _store_plan_result(db, plan_id, result)

    today = date(2026, 11, 6)
    event_ids: list[int] = []
    for line in result["lines"]:
        for i in range(line["n"]):
            done = len(event_ids) < 46
            scheduled = today - timedelta(days=2 * (46 - len(event_ids))) if done else today + timedelta(days=(len(event_ids) % 35) + 1)
            event_id = db.execute(
                """
                INSERT INTO activity_event
                (plan_id, activity_type_id, scheduled_date, status, actual_date, attendance, actual_cost, gps_lat, gps_lng, photo_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    plan_id,
                    line["activity_type_id"],
                    scheduled.isoformat(),
                    "done" if done else "scheduled",
                    scheduled.isoformat() if done else None,
                    min(line["r"], max(1, round(line["r"] * .65))) if done else None,
                    line["c"] if done else None,
                    19.9975 if done else None,
                    73.7898 if done else None,
                    f"seed-photo-{len(event_ids)}" if done else None,
                ),
            ).lastrowid
            event_ids.append(event_id)
    farmer_ids = []
    for i in range(120):
        farmer_ids.append(
            db.execute(
                "INSERT INTO farmer (mu_id, name, phone, farmer_type, consent_advice) VALUES (?, ?, ?, ?, 1)",
                (mu, f"Sample farmer {i + 1}", f"+91000000{i:05d}", "innovative" if i < 30 else "potential"),
            ).lastrowid
        )
    for event_id in event_ids[:46]:
        for farmer_id in farmer_ids[: min(12, len(farmer_ids))]:
            db.execute("INSERT OR IGNORE INTO event_contact (activity_event_id, farmer_id) VALUES (?, ?)", (event_id, farmer_id))
    demo_activity_id = db.execute("SELECT id FROM activity_type WHERE kind = 'demo'").fetchone()[0]
    for i, farmer_id in enumerate(farmer_ids[:12]):
        db.execute(
            """
            INSERT INTO callback (farmer_id, activity_event_id, called_at, will_buy, bought, motivating_activity_type_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                farmer_id,
                event_ids[i],
                "2026-11-05T10:00:00" if i < 6 else None,
                1 if i < 3 else 0 if i < 6 else None,
                1 if i < 2 else 0 if i < 6 else None,
                demo_activity_id,
            ),
        )
    db.execute(
        "INSERT INTO audit_flag (activity_event_id, flag_type, detail) VALUES (?, 'photo_reuse', 'Sample field report requires a unique photo check')",
        (event_ids[0],),
    )
    for month, liquidated, po in [
        ("2026-10", 84, 125),
        ("2026-11", 52, 100),
        ("2026-12", 0, 75),
    ]:
        db.execute(
            "INSERT INTO sales_import (mu_id, crop_id, product_id, month, packs_liquidated, po_packs) VALUES (?, ?, ?, ?, ?, ?)",
            (mu, crop, product, month, liquidated, po),
        )


def _playbook_lines(db: sqlite3.Connection, segment: str) -> list[dict[str, Any]]:
    rows = db.execute(
        """
        SELECT a.*, p.share_pct FROM playbook p
        JOIN activity_type a ON a.id = p.activity_type_id
        WHERE p.segment = ? ORDER BY a.id
        """,
        (segment,),
    ).fetchall()
    return [
        {
            "share_pct": row["share_pct"],
            "activity": {
                "activity_type_id": row["id"],
                "name": row["name"],
                "kind": row["kind"],
                "r": row["r_default"],
                "k": row["k_default"],
                "c": row["unit_cost"],
                "phase_split_pre": row["phase_split_pre"],
                "phase_split_on": row["phase_split_on"],
                "phase_split_post": row["phase_split_post"],
                "bucket": row["bucket"],
            },
        }
        for row in rows
    ]


def _store_plan_result(db: sqlite3.Connection, plan_id: int, result: dict[str, Any]) -> None:
    for line in result["lines"]:
        db.execute(
            """
            INSERT INTO plan_line
            (plan_id, activity_type_id, share_pct, r, k, c, n, budget, budget_pre, budget_on, budget_post, line_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                plan_id,
                line["activity_type_id"],
                line["share_pct"],
                line["r"],
                line["k"],
                line["c"],
                line["n"],
                line["budget"],
                line["budget_pre"],
                line["budget_on"],
                line["budget_post"],
                json.dumps(line),
            ),
        )
    for check in result["checks"]:
        db.execute(
            "INSERT INTO plan_check (plan_id, check_name, value, limit_value, status, message) VALUES (?, ?, ?, ?, ?, ?)",
            (plan_id, check["check_name"], check.get("value"), check.get("limit"), check["status"], check["message"]),
        )


def _insert_geo(db: sqlite3.Connection, name: str, level: str, parent_id: int | None = None) -> int:
    return db.execute(
        "INSERT INTO geo_unit (name, level, parent_id) VALUES (?, ?, ?)",
        (name, level, parent_id),
    ).lastrowid


def _ensure_column(db: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def _seed_crop_stages(db: sqlite3.Connection, crop_id: int | None = None) -> None:
    crop_rows = (
        db.execute("SELECT id FROM crop WHERE id = ?", (crop_id,)).fetchall()
        if crop_id is not None
        else db.execute("SELECT id FROM crop").fetchall()
    )
    stage_names = ("Establishment", "Vegetative growth", "Flowering", "Harvest")
    for crop in crop_rows:
        exists = db.execute("SELECT 1 FROM crop_stage WHERE crop_id = ? LIMIT 1", (crop["id"],)).fetchone()
        if exists:
            continue
        for index, stage_name in enumerate(stage_names):
            db.execute(
                "INSERT INTO crop_stage (crop_id, stage_name, start_day, end_day) VALUES (?, ?, ?, ?)",
                (crop["id"], stage_name, index * 30, (index + 1) * 30 - 1),
            )


def get_market_input(db: sqlite3.Connection, mu_id: int, crop_id: int, season_id: int, product_id: int) -> dict[str, Any]:
    row = db.execute(
        """
        SELECT m.*, mu.villages_count, mu.mdo_count, c.name AS crop_name, c.stage_anchor,
               p.pack_kg, p.price_per_pack, d.dose_packs_per_acre,
               mu.name AS mu_name, s.name AS season_name
        FROM market_data m
        JOIN mu ON mu.id = m.mu_id
        JOIN crop c ON c.id = m.crop_id
        JOIN season s ON s.id = m.season_id
        JOIN product p ON p.id = ?
        JOIN crop_product_dose d ON d.crop_id = m.crop_id AND d.product_id = p.id
        WHERE m.mu_id = ? AND m.crop_id = ? AND m.season_id = ?
        """,
        (product_id, mu_id, crop_id, season_id),
    ).fetchone()
    if not row:
        raise LookupError("No market or product-dose data exists for this selection")
    return dict(row)


def get_playbook_lines(db: sqlite3.Connection, segment: str, shares: dict[int, float] | None = None) -> list[dict[str, Any]]:
    base = _playbook_lines(db, segment)
    if shares is None:
        return base
    activities = {line["activity"]["activity_type_id"]: line for line in base}
    selected = []
    for activity_id, share in shares.items():
        if activity_id not in activities:
            raise LookupError(f"Activity {activity_id} is not in the {segment} playbook")
        selected.append({**activities[activity_id], "share_pct": float(share)})
    if not selected:
        raise ValueError("At least one activity share is required")
    return selected
