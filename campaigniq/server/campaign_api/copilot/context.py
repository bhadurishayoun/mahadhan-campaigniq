"""Evidence/context assembly for the AI Co-pilot (retrieval-augmented generation).

The LLM only sees what this module gives it, so answers stay grounded in CampaignIQ data:

1. the user's filter scope (season, state, district, crop, product, campaign type);
2. reference masters (geography / products) for name resolution;
3. rows from uploaded datasets (see ``datasets.py``) matching the scope;
4. documents returned by :func:`retrieve_documents` - a placeholder for a future vector store
   (SOPs, agronomy-approved product guidance, campaign briefs, field reports).
"""

from __future__ import annotations

import json
from typing import Any

from .. import datasets
from ..reference import load

SCREEN_IDS = {
    "s1.1", "s1.2", "s1.3", "s1.4", "s1.5", "s2.1", "s2.2", "s2.3", "s2.4", "s2.5", "s3.1", "s3.2", "s3.3", "s3.4",
    "s4.1", "s4.2", "s4.3", "s4.4", "s4.5", "s5.1", "s5.2", "s5.3", "s5.4", "s6.1", "s6.2", "s7.1", "s7.2", "ai.1", "p.1", "p.2", "p.3", "admin.1",
}
MAX_CONTEXT_CHARS = 24_000
ROWS_PER_DATASET = 40


def retrieve_documents(question: str, scope: dict[str, str | None], limit: int = 5) -> list[dict[str, Any]]:
    """Placeholder for document retrieval.

    Return ``[{"title": ..., "source": ..., "text": ...}]`` from an approved knowledge base
    (e.g. embeddings in pgvector / Azure AI Search). Only include agronomy content that has been
    approved - the copilot must not invent doses or product claims.
    """
    return []


def _relevant_datasets(question: str, catalog: dict[str, dict[str, Any]], uploaded: list[str]) -> list[str]:
    words = {word.strip("?.,").lower() for word in question.split() if len(word) > 3}

    def score(name: str) -> int:
        entry = catalog.get(name, {})
        text = f"{name} {entry.get('title', '')} {entry.get('description', '')}".lower()
        return sum(word in text for word in words)

    return sorted(uploaded, key=score, reverse=True)


def build_context(question: str, scope: dict[str, str | None], screen: str | None = None) -> dict[str, Any]:
    catalog = datasets.load_catalog()
    uploaded = datasets.uploaded_dataset_names()
    evidence: list[dict[str, Any]] = []
    budget = MAX_CONTEXT_CHARS
    for name in _relevant_datasets(question, catalog, uploaded):
        rows = datasets.read_dataset_rows(name, scope, limit=ROWS_PER_DATASET)
        if not rows:
            continue
        item = {"dataset": name, "title": catalog.get(name, {}).get("title"), "screen": catalog.get(name, {}).get("screen"), "rows": rows}
        size = len(json.dumps(item, ensure_ascii=False, default=str))
        if size > budget:
            continue
        evidence.append(item)
        budget -= size
    products = load("products")["products"]
    return {
        "scope": {key: value for key, value in scope.items() if value},
        "current_screen": screen,
        "products": [{"id": product["id"], "name": product["name"], "crops": product.get("crops", [])} for product in products if product.get("active", True)],
        "states": [{"name": state["name"], "districts": [district["name"] for district in state["districts"]]} for state in load("geography")["states"]],
        "datasets": evidence,
        "documents": retrieve_documents(question, scope),
        "data_available": bool(evidence),
    }
