import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import campaign_api.db as database
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
        self.assertEqual(self.market["total"], 7)
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
        self.assertEqual(result["kpis"]["converted_farmers"], 3)
        self.assertTrue(result["conversion_by_activity"])
        self.assertIsNotNone(result["kpis"]["demo_yield_gain"])


if __name__ == "__main__":
    unittest.main()
