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
        # These tests exercise the upload mechanism from an empty dataset store, so use the built-in seed
        # (the default workbook seed uploads every dataset).
        self.patches = [patch.object(database, "DB_PATH", root / "test.db"), patch.dict(os.environ, {"CAMPAIGNIQ_SEED": "builtin"})]
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

    def test_copilot_defaults_to_the_free_keyless_provider(self):
        with patch.dict(os.environ, {"COPILOT_PROVIDER": ""}):
            status = self.client.get("/api/copilot/status").json()
        self.assertEqual(status["provider"], "free")
        self.assertEqual(status["mode"], "llm")

    def test_free_provider_waits_on_short_rate_limit_then_falls_back(self):
        calls = []

        def fake_call(self_, url, body):
            calls.append(url)
            if "llm7" in url:
                return 429, {"error": {"retry_after": 1}}, 1.0
            return 200, {"model": "gpt-oss-20b", "choices": [{"message": {"content": "Fallback answer"}}]}, 0.0

        provider = providers.FreeProvider()
        with patch.object(providers.FreeProvider, "_call", fake_call), patch.object(providers.time, "sleep") as sleep:
            text = provider.generate([{"role": "user", "content": "hi"}], json_mode=False)
        self.assertEqual(text, "Fallback answer")
        self.assertEqual(sum("llm7" in url for url in calls), 2)  # retried once after the 1 s wait
        sleep.assert_called_with(1.0)
        self.assertIn("Pollinations", provider.model)

    def test_free_provider_reports_when_all_endpoints_are_busy(self):
        provider = providers.FreeProvider()
        with patch.object(providers.FreeProvider, "_call", lambda self_, url, body: (402, {}, 45.0)):
            with self.assertRaises(providers.CopilotError) as caught:
                provider.generate([{"role": "user", "content": "hi"}])
        self.assertIn("HTTP 402", str(caught.exception))

    def test_copilot_chat_returns_grounded_text(self):
        class ChatProvider(FakeProvider):
            def generate(self, messages, *, temperature=0.2, max_tokens=1500, json_mode=True):
                FakeProvider.messages = messages
                return "**Dhanora** converts 38.7% vs 49.0% in Wadi Gaon.\n- Confirm demo stock."

        with patch.dict(providers.PROVIDERS, {"chatfake": ChatProvider}), patch.dict(os.environ, {"COPILOT_PROVIDER": "chatfake"}):
            response = self.client.post("/api/copilot/chat", json={
                "question": "Why is Dhanora lower?", "persona": "Territory Manager", "screen": "tm.ai1",
                "page_context": "Dhanora 62 trials, 24 adopters (38.7%)",
            })
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["mode"], "llm")
        self.assertIn("Dhanora", body["answer"])
        system = FakeProvider.messages[0]["content"]
        self.assertIn("Territory Manager", system)
        payload = json.loads(FakeProvider.messages[-1]["content"])
        self.assertEqual(payload["context"]["page"], "Dhanora 62 trials, 24 adopters (38.7%)")
        self.assertIn("backend_kpis", payload["context"])

    def test_copilot_rejects_malformed_llm_output(self):
        class BrokenProvider(FakeProvider):
            def generate(self, messages, *, temperature=0.2, max_tokens=1500):
                return "not json"

        with patch.dict(providers.PROVIDERS, {"broken": BrokenProvider}), patch.dict(os.environ, {"COPILOT_PROVIDER": "broken"}):
            response = self.client.post("/api/copilot/ask", json={"question": "Anything?"})
        self.assertEqual(response.status_code, 502)


if __name__ == "__main__":
    unittest.main()
