"""HTTP endpoints for the AI Co-pilot.

* ``GET  /api/copilot/status`` - which provider is active (the web app shows "Demo answers" or "LLM").
* ``POST /api/copilot/ask``    - grounded question answering. In demo mode it returns ``mode="demo"``
  with no answer and the web app shows its built-in illustrative answer instead.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from .context import SCREEN_IDS, build_context
from .providers import CopilotError, get_provider
from .schema import AskRequest, AskResponse, CopilotAnswer

PROMPT_PATH = Path(os.environ.get("COPILOT_SYSTEM_PROMPT", Path(__file__).resolve().parents[2] / "data" / "prompts" / "copilot_system.md"))
DEFAULT_SCREEN = "ai.1"

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


def _system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _provider():
    try:
        return get_provider()
    except CopilotError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


def _parse_answer(text: str, question: str) -> CopilotAnswer:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()
    try:
        payload: dict[str, Any] = json.loads(cleaned)
        payload["question"] = question
        answer = CopilotAnswer.model_validate(payload)
    except (json.JSONDecodeError, ValidationError, TypeError) as error:
        raise HTTPException(status_code=502, detail=f"LLM returned an answer that does not match the expected schema: {error}") from error
    # Only allow navigation to screens that exist in the app.
    answer.sources = [source for source in answer.sources if source.to in SCREEN_IDS]
    for link in (answer.primary, answer.secondary):
        if link.to not in SCREEN_IDS:
            link.to = DEFAULT_SCREEN
    if answer.table.highlight is not None and not 0 <= answer.table.highlight < len(answer.table.rows):
        answer.table.highlight = None
    return answer


@router.get("/status")
def copilot_status() -> dict[str, Any]:
    provider = _provider()
    return {"provider": provider.name, "model": provider.model, "configured": provider.configured,
            "mode": "llm" if provider.configured else "demo"}


@router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    provider = _provider()
    if not provider.configured:
        return AskResponse(mode="demo", provider=provider.name, message="No LLM configured; showing illustrative answers.")
    context = build_context(request.question, request.scope.model_dump(), request.screen)
    messages = [
        {"role": "system", "content": _system_prompt()},
        *[{"role": item["role"], "content": item["content"]} for item in request.history
          if item.get("role") in ("user", "assistant") and isinstance(item.get("content"), str)],
        {"role": "user", "content": json.dumps({"question": request.question, "context": context}, ensure_ascii=False, default=str)},
    ]
    try:
        text = provider.generate(messages)
    except CopilotError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return AskResponse(mode="llm", provider=provider.name, model=provider.model, answer=_parse_answer(text, request.question),
                       grounded_on=[item["dataset"] for item in context["datasets"]])
