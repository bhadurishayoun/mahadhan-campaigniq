import unittest

from campaign_api.engine import calculate_plan, format_inr


ACTIVITIES = [
    ("Crop demo with control strip", "demo", 25, .12, 6500, 0, 1, 0, .40),
    ("Early field day + harvest days", "field_day", 150, .05, 20000, 1 / 3, 0, 2 / 3, .30),
    ("Group farmer meeting (8–10)", "group_meeting", 10, .10, 1500, .65, .35, 0, .20),
    ("One-to-one contact", "one_to_one", 1, .15, 100, .65, .35, 0, .10),
]


def golden_input(**overrides):
    lines = [
        {
            "share_pct": share,
            "activity": {
                "activity_type_id": index,
                "name": name,
                "kind": kind,
                "r": reach,
                "k": conversion,
                "c": cost,
                "phase_split_pre": pre,
                "phase_split_on": on,
                "phase_split_post": post,
                "bucket": "proven",
            },
        }
        for index, (name, kind, reach, conversion, cost, pre, on, post, share) in enumerate(ACTIVITIES, 1)
    ]
    return {
        "crop_area": 3000,
        "amp_pct": .30,
        "current_treated_pct": .05,
        "target_treated_pct": .10,
        "dose_packs_per_acre": 2,
        "pack_kg": 50,
        "price_per_pack": 1800,
        "avg_area_per_farmer": 2,
        "lines": lines,
        "config": {"mdo_count": 1, "active_weeks": 16, "villages_count": 10},
        **overrides,
    }


class PlanEngineTests(unittest.TestCase):
    def test_currency_format_uses_indian_grouping(self):
        self.assertEqual(format_inr(152500), "₹1,52,500.00")
        self.assertEqual(format_inr(152500, 0), "₹1,52,500")

    def test_emerging_onion_golden_case(self):
        result = calculate_plan(golden_input())
        self.assertAlmostEqual(result["penetration"], .1666667, places=6)
        self.assertEqual(result["segment"], "Emerging")
        self.assertEqual(result["spend_cap_pct"], .30)
        self.assertEqual(result["incremental_area"], 150)
        self.assertEqual(result["y_packs"], 600)
        self.assertEqual(result["y_tons"], 30)
        self.assertEqual(result["incremental_packs"], 300)
        self.assertEqual(result["incremental_value"], 540000)
        self.assertEqual(result["farmers_to_convert"], 75)
        self.assertEqual([line["n"] for line in result["lines"]], [10, 3, 15, 50])
        self.assertEqual([line["budget"] for line in result["lines"]], [65000, 60000, 22500, 5000])
        self.assertEqual(result["total_units"], 78)
        self.assertEqual(result["budget"], 152500)
        self.assertAlmostEqual(result["budget_pre"], 37875)
        self.assertAlmostEqual(result["budget_on"], 74625)
        self.assertAlmostEqual(result["budget_post"], 40000)
        self.assertAlmostEqual(result["spend_ratio"], .2824074, places=6)
        self.assertEqual(result["cost_per_farmer"], 152500 / 75)
        self.assertEqual(result["cost_per_acre"], 152500 / 150)
        self.assertEqual(result["cost_per_pack"], 152500 / 300)
        self.assertTrue(result["can_submit"])
        self.assertEqual(next(item for item in result["checks"] if item["check_name"] == "spend_ratio")["status"], "amber")
        self.assertEqual(next(item for item in result["checks"] if item["check_name"] == "field_capacity")["value"], 4.875)

    def test_segment_boundaries_are_inclusive_at_lower_band(self):
        growing = calculate_plan(golden_input(current_treated_pct=.075))
        matured = calculate_plan(golden_input(current_treated_pct=.24))
        self.assertEqual(growing["segment"], "Growing")
        self.assertEqual(matured["segment"], "Matured")

    def test_target_above_amp_is_red_and_blocks_submission(self):
        result = calculate_plan(golden_input(target_treated_pct=.31))
        check = next(item for item in result["checks"] if item["check_name"] == "target_vs_amp")
        self.assertEqual(check["status"], "red")
        self.assertFalse(result["can_submit"])

    def test_shares_must_sum_to_one(self):
        result = calculate_plan(golden_input(lines=golden_input()["lines"][:-1] + [{
            **golden_input()["lines"][-1],
            "share_pct": .05,
        }]))
        check = next(item for item in result["checks"] if item["check_name"] == "shares")
        self.assertEqual(check["status"], "red")
        self.assertFalse(result["can_submit"])

    def test_retention_uses_total_value_as_spend_ratio_basis(self):
        result = calculate_plan(golden_input(current_treated_pct=.10, target_treated_pct=.05))
        self.assertEqual(result["mode"], "retention")
        self.assertEqual(result["spend_ratio_base"], "total_value")
        self.assertAlmostEqual(result["farmers_to_convert"], 30)


if __name__ == "__main__":
    unittest.main()
