import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import campaign_api.db as database
import campaign_api.reference as reference
from campaign_api.copilot import providers
from campaign_api.main import app

LLM_ANSWER = {
    "title": "AI Analysis: Cluster conversion",
    "summary": "Dhanora converts below the other clusters.",
    "table": {"columns": ["Cluster", "Conversion"], "rows": [["Dhanora", "40%"], ["Wadi Gaon", "68%"]], "highlight": 7},
    "chart": {"title": "Conversion", "axis": "%", "max": 100, "bars": [{"label": "Dhanora", "value": 40, "display": "40%", "low": True}]},
    "factors": ["Stock receipt delay"],
    "confidence": {"level": "Medium", "text": "Based on uploaded callbacks."},
    "sources": [{"label": "S7.1 Impact", "to": "s7.1"}, {"label": "Invented", "to": "x9.9"}],
    "actions": ["Confirm stock"],
    "primary": {"label": "Open S7.1", "to": "s7.1"},
    "secondary": {"label": "Somewhere", "to": "not-a-screen"},
}


class FakeProvider(providers.LLMProvider):
    name = "fake"
    messages: list = []

    @property
    def configured(self):
        return True

    @property
    def model(self):
        return "fake-model"

    def generate(self, messages, *, temperature=0.2, max_tokens=1500):
        FakeProvider.messages = messages
        return "```json\n" + json.dumps(LLM_ANSWER) + "\n```"


class ExtensionPointTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        root = Path(self.temporary.name)
        self.patches = [patch.object(database, "DB_PATH", root / "test.db")]
        reference_dir = root / "reference"
        reference_dir.mkdir()
        for path in reference.REFERENCE_DIR.glob("*.json"):
            (reference_dir / path.name).write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        self.patches.append(patch.object(reference, "REFERENCE_DIR", reference_dir))
        for item in self.patches:
            item.start()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        for item in self.patches:
            item.stop()
        self.temporary.cleanup()

    def test_reference_lists_states_districts_and_products(self):
        data = self.client.get("/api/reference").json()
        maharashtra = next(state for state in data["states"] if state["id"] == "maharashtra")
        self.assertIn("jalna", [district["id"] for district in maharashtra["districts"]])
        self.assertIn("croptek", [product["id"] for product in data["products"]])

    def test_reference_can_add_a_product_and_rejects_duplicates(self):
        products = self.client.get("/api/reference/products").json()
        products["products"].append({"id": "newtek", "name": "Newtek", "crops": ["onion"]})
        self.assertEqual(self.client.put("/api/reference/products", json=products).status_code, 200)
        self.assertIn("newtek", [product["id"] for product in self.client.get("/api/reference").json()["products"]])
        products["products"].append({"id": "newtek", "name": "Duplicate"})
        self.assertEqual(self.client.put("/api/reference/products", json=products).status_code, 422)

    def test_dataset_falls_back_to_demo_until_uploaded_then_filters_by_scope(self):
        name = "impact.cluster_conversion"
        self.assertEqual(self.client.get(f"/api/datasets/{name}").status_code, 404)
        template = self.client.get(f"/api/datasets/{name}/template").text
        self.assertTrue(template.startswith("cluster,trials,rate,adopters,signal,text"))
        self.assertIn("district", template)
        csv = "cluster,trials,rate,adopters,signal,text,district\nDhanora,80,40,32,risk,Late stock,Jalna\nOzar,50,60,30,ok,On track,Nashik\n"
        upload = self.client.post(f"/api/datasets/{name}", files={"file": ("clusters.csv", csv, "text/csv")})
        self.assertEqual(upload.status_code, 201)
        self.assertEqual(upload.json()["row_count"], 2)
        rows = self.client.get(f"/api/datasets/{name}", params={"district": "jalna"}).json()["rows"]
        self.assertEqual([row["cluster"] for row in rows], ["Dhanora"])
        self.assertEqual(rows[0]["trials"], 80)
        status = {item["name"]: item["status"] for item in self.client.get("/api/datasets").json()["items"]}
        self.assertEqual(status[name], "live")
        self.assertTrue(self.client.delete(f"/api/datasets/{name}").json()["deleted"])
        self.assertEqual(self.client.get(f"/api/datasets/{name}").status_code, 404)

    def test_dataset_upload_validates_columns_and_names(self):
        bad = self.client.post("/api/datasets/impact.cluster_conversion", files={"file": ("x.csv", "cluster\nDhanora\n", "text/csv")})
        self.assertEqual(bad.status_code, 422)
        self.assertIn("Missing required columns", bad.json()["detail"])
        unknown = self.client.post("/api/datasets/not.a.dataset", files={"file": ("x.csv", "a\n1\n", "text/csv")})
        self.assertEqual(unknown.status_code, 404)

    def test_copilot_demo_mode_tells_the_web_app_to_use_built_in_answers(self):
        with patch.dict(os.environ, {"COPILOT_PROVIDER": "demo"}):
            self.assertEqual(self.client.get("/api/copilot/status").json()["mode"], "demo")
            response = self.client.post("/api/copilot/ask", json={"question": "Why is adoption low in Dhanora?"}).json()
        self.assertEqual(response["mode"], "demo")
        self.assertIsNone(response["answer"])

    def test_copilot_llm_answer_is_grounded_and_sanitised(self):
        csv = "cluster,trials,rate,adopters,signal,text\nDhanora,80,40,32,risk,Late stock\n"
        self.client.post("/api/datasets/impact.cluster_conversion", files={"file": ("c.csv", csv, "text/csv")})
        with patch.dict(providers.PROVIDERS, {"fake": FakeProvider}), patch.dict(os.environ, {"COPILOT_PROVIDER": "fake"}):
            response = self.client.post("/api/copilot/ask", json={
                "question": "Why is conversion low in Dhanora?",
                "scope": {"state": "maharashtra", "district": "jalna"},
                "screen": "ai.1",
            })
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["mode"], "llm")
        self.assertEqual(body["grounded_on"], ["impact.cluster_conversion"])
        answer = body["answer"]
        self.assertEqual(answer["question"], "Why is conversion low in Dhanora?")
        self.assertEqual([source["to"] for source in answer["sources"]], ["s7.1"])
        self.assertEqual(answer["secondary"]["to"], "ai.1")
        self.assertIsNone(answer["table"]["highlight"])
        context = json.loads(FakeProvider.messages[-1]["content"])["context"]
        self.assertEqual(context["scope"], {"state": "maharashtra", "district": "jalna"})
        self.assertEqual(context["datasets"][0]["rows"][0]["cluster"], "Dhanora")

    def test_copilot_rejects_malformed_llm_output(self):
        class BrokenProvider(FakeProvider):
            def generate(self, messages, *, temperature=0.2, max_tokens=1500):
                return "not json"

        with patch.dict(providers.PROVIDERS, {"broken": BrokenProvider}), patch.dict(os.environ, {"COPILOT_PROVIDER": "broken"}):
            response = self.client.post("/api/copilot/ask", json={"question": "Anything?"})
        self.assertEqual(response.status_code, 502)


if __name__ == "__main__":
    unittest.main()
