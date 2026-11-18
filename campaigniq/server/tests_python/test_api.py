import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import campaign_api.db as database
from campaign_api import workbook
from campaign_api.main import app


class CampaignApiTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temporary.name) / "campaigniq-test.db"
        self.db_path_patch = patch.object(database, "DB_PATH", self.database_path)
        self.db_path_patch.start()
        self.client = TestClient(app)
        self.client.__enter__()
        self.filters = self.client.get("/api/meta/filters").json()
        self.crop = next(row for row in self.filters["crops"] if row["name"] == "Onion")
        self.product = next(row for row in self.filters["products"] if row["crop_id"] == self.crop["id"])
        self.market = self.client.get("/api/market/mus?district=Nashik").json()
        self.mu = next(row for row in self.market["items"] if row["mu_name"] == "Niphad West")

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.db_path_patch.stop()
        self.temporary.cleanup()

    def plan_payload(self):
        return {
            "mu_id": self.mu["mu_id"],
            "crop_id": self.crop["id"],
            "season_id": self.filters["seasons"][0]["id"],
            "product_id": self.product["id"],
            "target_treated_pct": .10,
        }

    def test_seeded_market_and_calculator_golden_case(self):
        self.assertEqual(self.market["total"], 9)  # Nashik MUs in the synthetic seed workbook
        response = self.client.post("/api/plans/calculate", json=self.plan_payload())
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["segment"], "Emerging")
        self.assertAlmostEqual(result["incremental_area"], 150)
        self.assertGreaterEqual(result["total_units"], 75)
        self.assertGreater(result["budget"], 0)
        self.assertTrue(any(line["k_source"] == "learned" for line in result["lines"]))
        self.assertTrue(result["can_submit"])

    def test_plan_lifecycle_and_role_guard(self):
        plan = self.client.post("/api/plans", json=self.plan_payload()).json()
        plan_id = plan["id"]
        self.assertEqual(self.client.post(f"/api/plans/{plan_id}/submit").status_code, 200)
        self.assertEqual(self.client.post(f"/api/plans/{plan_id}/approve").status_code, 403)
        approved = self.client.post(
            f"/api/plans/{plan_id}/approve",
            headers={"X-User-Role": "region_manager"},
        )
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(
            self.client.post(f"/api/plans/{plan_id}/lock", headers={"X-User-Role": "region_manager"}).status_code,
            200,
        )
        revised = self.client.post(
            f"/api/plans/{plan_id}/revise",
            params={"reason": "Update target assumptions"},
        ).json()
        self.assertNotEqual(revised["id"], plan_id)
        self.assertEqual(revised["version"], 2)
        self.assertEqual(self.client.get(f"/api/plans/{plan_id}").json()["status"], "locked")
        self.assertEqual(self.client.post(f"/api/plans/{revised['id']}/submit").status_code, 200)
        self.assertEqual(
            self.client.post(
                f"/api/plans/{revised['id']}/approve",
                headers={"X-User-Role": "region_manager"},
            ).status_code,
            200,
        )
        self.assertEqual(self.client.post(f"/api/plans/{revised['id']}/generate-calendar").status_code, 200)
        self.assertEqual(self.client.get(f"/api/plans/{revised['id']}/stock-needs").status_code, 200)

    def test_cheaper_suggestion_has_a_dedicated_route(self):
        plan = self.client.post("/api/plans", json=self.plan_payload()).json()
        response = self.client.post(f"/api/plans/{plan['id']}/suggest-cheaper")
        self.assertEqual(response.status_code, 200)
        self.assertIn("suggested", response.json())

    def test_seeded_callback_and_performance_data(self):
        response = self.client.get("/api/performance")
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertGreater(result["kpis"]["converted_farmers"], 0)
        self.assertTrue(result["conversion_by_activity"])
        self.assertIsNotNone(result["kpis"]["demo_yield_gain"])
        self.assertGreater(result["kpis"]["report_quality"], 0.5)
        self.assertLess(result["kpis"]["liquidation_vs_plan"], 1.5)

    def test_workbook_seed_fills_every_screen_dataset(self):
        items = self.client.get("/api/datasets").json()["items"]
        self.assertTrue(items)
        self.assertEqual({item["status"] for item in items}, {"live"})
        scope = {"season": "late-rabi-2026-27", "state": "maharashtra", "district": "jalna", "crop": "onion"}
        villages = self.client.get("/api/datasets/readiness.village_demand", params=scope).json()["rows"]
        self.assertEqual([row["village"] for row in villages][:2], ["Wadi Gaon", "Dhanora"])  # storyline anchors
        nashik = self.client.get("/api/datasets/readiness.village_demand", params={**scope, "district": "nashik"}).json()["rows"]
        self.assertTrue(nashik)
        self.assertNotIn("Wadi Gaon", [row["village"] for row in nashik])
        self.assertTrue(self.client.get("/api/risks").json())
        self.assertTrue(self.client.get("/api/callbacks/queue").json())
        self.assertTrue(self.client.get("/api/audit-queue").json())

    def test_workbook_import_is_guarded_and_validated(self):
        files = {"file": ("data.xlsx", b"not a workbook", "application/octet-stream")}
        self.assertEqual(self.client.post("/api/import/workbook", files=files).status_code, 403)
        with patch.dict(os.environ, {"CAMPAIGNIQ_ADMIN_TOKEN": "secret"}):
            self.assertEqual(self.client.post("/api/import/workbook", files=files, headers={"X-Admin-Token": "wrong"}).status_code, 403)
            rejected = self.client.post("/api/import/workbook", files=files, headers={"X-Admin-Token": "secret"})
            self.assertEqual(rejected.status_code, 422)
        self.assertEqual(self.client.get("/api/market/mus?district=Nashik").json()["total"], 9)  # nothing was changed
        download = self.client.get("/api/import/workbook")
        self.assertEqual(download.status_code, 200)
        self.assertTrue(download.content.startswith(b"PK"))

    def test_workbook_reload_round_trip(self):
        with patch.dict(os.environ, {"CAMPAIGNIQ_ADMIN_TOKEN": "secret"}):
            response = self.client.post(
                "/api/import/workbook",
                files={"file": ("seed.xlsx", workbook.SEED_WORKBOOK.read_bytes(), "application/octet-stream")},
                headers={"X-Admin-Token": "secret"},
            )
        self.assertEqual(response.status_code, 200)
        summary = response.json()
        self.assertEqual(summary["rows"]["datasets"], 12)
        self.assertGreater(summary["rows"]["campaign_plan_recomputed"], 100)
        self.assertEqual(self.client.get("/api/market/mus?district=Nashik").json()["total"], 9)


class BuiltinSeedTests(unittest.TestCase):
    """The small hand-written seed remains available as a fallback (CAMPAIGNIQ_SEED=builtin)."""

    def test_builtin_seed_still_works(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(database, "DB_PATH", Path(folder) / "builtin.db"), \
                patch.dict(os.environ, {"CAMPAIGNIQ_SEED": "builtin"}):
            with TestClient(app) as client:
                self.assertEqual(client.get("/api/market/mus?district=Nashik").json()["total"], 7)
                self.assertEqual(client.get("/api/performance").json()["kpis"]["converted_farmers"], 3)


if __name__ == "__main__":
    unittest.main()
