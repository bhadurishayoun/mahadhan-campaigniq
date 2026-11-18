"""LLM provider adapters for the AI Co-pilot.

Select a provider with the ``COPILOT_PROVIDER`` environment variable:

* ``free`` (default) - keyless, free OpenAI-compatible endpoints (LLM7, then Pollinations; both serve the
  open-weight ``gpt-oss-20b``). No API key or account is needed; they are rate-limited and best-effort, and
  questions plus the (illustrative) grounding context are sent to those third-party services.
  ``COPILOT_FREE_URL`` / ``COPILOT_FREE_MODEL`` pin a single endpoint and model instead.
* ``demo`` - no LLM; the web app shows its built-in illustrative answers.
* ``openai`` - OpenAI or any OpenAI-compatible Chat Completions server (vLLM, Ollama, LM Studio,
  a corporate gateway, ...). Uses ``COPILOT_BASE_URL``, ``COPILOT_API_KEY``, ``COPILOT_MODEL``.
* ``azure_openai`` - Azure OpenAI. Uses ``COPILOT_AZURE_ENDPOINT``, ``COPILOT_AZURE_DEPLOYMENT``,
  ``COPILOT_AZURE_API_VERSION`` and ``COPILOT_API_KEY``.

To add another vendor, subclass :class:`LLMProvider`, implement ``generate`` and register it in
``PROVIDERS``.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Any


class CopilotError(RuntimeError):
    """Raised when the configured LLM provider fails."""


class LLMProvider(ABC):
    name = "base"

    @property
    @abstractmethod
    def configured(self) -> bool: ...

    @property
    def model(self) -> str | None:
        return None

    @abstractmethod
    def generate(self, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 1500, json_mode: bool = True) -> str:
        """Return the assistant message text (a JSON object when ``json_mode``, otherwise free text)."""


class DemoProvider(LLMProvider):
    """No LLM configured: the frontend falls back to its illustrative canned answers."""

    name = "demo"

    @property
    def configured(self) -> bool:
        return False

    def generate(self, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 1500, json_mode: bool = True) -> str:
        raise CopilotError("No LLM provider configured (COPILOT_PROVIDER=demo)")


def _post_json(url: str, headers: dict[str, str], body: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 - URL comes from operator configuration
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise CopilotError(f"LLM provider returned HTTP {error.code}: {detail}") from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise CopilotError(f"LLM provider unreachable: {error}") from error


def _message_text(payload: dict[str, Any]) -> str:
    try:
        return payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise CopilotError("Unexpected LLM response shape") from error


class OpenAICompatibleProvider(LLMProvider):
    name = "openai"

    def __init__(self) -> None:
        self.base_url = os.environ.get("COPILOT_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.api_key = os.environ.get("COPILOT_API_KEY", "")
        self._model = os.environ.get("COPILOT_MODEL", "")
        self.timeout = float(os.environ.get("COPILOT_TIMEOUT_SECONDS", "60"))

    @property
    def configured(self) -> bool:
        return bool(self._model and (self.api_key or not self.base_url.startswith("https://api.openai.com")))

    @property
    def model(self) -> str | None:
        return self._model or None

    def generate(self, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 1500, json_mode: bool = True) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        body: dict[str, Any] = {"model": self._model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        return _message_text(_post_json(f"{self.base_url}/chat/completions", headers, body, self.timeout))


# Keyless OpenAI-compatible endpoints, tried in order. Both serve the open-weight gpt-oss-20b model anonymously.
FREE_ENDPOINTS = [
    ("LLM7", "https://api.llm7.io/v1/chat/completions", "default"),
    ("Pollinations", "https://text.pollinations.ai/openai", "openai"),
]
MAX_RETRY_WAIT_SECONDS = 12


class FreeProvider(LLMProvider):
    """Keyless free endpoints (default provider). Honours short rate-limit waits, then falls back to the next endpoint."""

    name = "free"

    def __init__(self) -> None:
        url = os.environ.get("COPILOT_FREE_URL")
        self.endpoints = [("custom", url, os.environ.get("COPILOT_FREE_MODEL", "default"))] if url else FREE_ENDPOINTS
        self.timeout = float(os.environ.get("COPILOT_TIMEOUT_SECONDS", "60"))
        self.last_model: str | None = None

    @property
    def configured(self) -> bool:
        return True

    @property
    def model(self) -> str | None:
        return self.last_model or "gpt-oss-20b (free endpoint)"

    def _call(self, url: str, body: dict[str, Any]) -> tuple[int, dict[str, Any], float]:
        request = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:  # noqa: S310 - fixed public endpoints
                return response.status, json.loads(response.read().decode("utf-8")), 0.0
        except urllib.error.HTTPError as error:
            payload: dict[str, Any] = {}
            try:
                payload = json.loads(error.read().decode("utf-8", errors="replace"))
            except json.JSONDecodeError:
                pass
            retry = error.headers.get("Retry-After") or (payload.get("error") or {}).get("retry_after") or 0
            try:
                wait = float(retry)
            except (TypeError, ValueError):
                wait = 0.0
            return error.code, payload, wait
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            raise CopilotError(f"Free LLM endpoint unreachable: {error}") from error

    def generate(self, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 1500, json_mode: bool = True) -> str:
        errors: list[str] = []
        for label, url, model in self.endpoints:
            body: dict[str, Any] = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
            if label == "Pollinations":
                body["referrer"] = "mahadhan-campaigniq"
            if json_mode:
                body["response_format"] = {"type": "json_object"}
            for _attempt in range(2):
                try:
                    status, payload, wait = self._call(url, body)
                except CopilotError as error:
                    errors.append(f"{label}: {error}")
                    break
                if status == 200:
                    try:
                        text = _message_text(payload)
                    except CopilotError as error:
                        errors.append(f"{label}: {error}")
                        break
                    if text and text.strip():
                        self.last_model = f"{payload.get('model') or 'gpt-oss-20b'} via {label} (free)"
                        return text
                    errors.append(f"{label}: empty answer")
                    break
                if status in (402, 429) and 0 < wait <= MAX_RETRY_WAIT_SECONDS:
                    time.sleep(wait)
                    continue
                errors.append(f"{label}: HTTP {status}")
                break
        raise CopilotError("Free LLM endpoints unavailable (" + "; ".join(errors) + ")")


class AzureOpenAIProvider(LLMProvider):
    name = "azure_openai"

    def __init__(self) -> None:
        self.endpoint = os.environ.get("COPILOT_AZURE_ENDPOINT", "").rstrip("/")
        self.deployment = os.environ.get("COPILOT_AZURE_DEPLOYMENT", "")
        self.api_version = os.environ.get("COPILOT_AZURE_API_VERSION", "2024-06-01")
        self.api_key = os.environ.get("COPILOT_API_KEY", "")
        self.timeout = float(os.environ.get("COPILOT_TIMEOUT_SECONDS", "60"))

    @property
    def configured(self) -> bool:
        return bool(self.endpoint and self.deployment and self.api_key)

    @property
    def model(self) -> str | None:
        return self.deployment or None

    def generate(self, messages: list[dict[str, str]], *, temperature: float = 0.2, max_tokens: int = 1500, json_mode: bool = True) -> str:
        url = f"{self.endpoint}/openai/deployments/{self.deployment}/chat/completions?api-version={self.api_version}"
        body: dict[str, Any] = {"messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        return _message_text(_post_json(url, {"api-key": self.api_key}, body, self.timeout))


PROVIDERS: dict[str, type[LLMProvider]] = {
    "free": FreeProvider,
    "demo": DemoProvider,
    "openai": OpenAICompatibleProvider,
    "azure_openai": AzureOpenAIProvider,
}


def get_provider() -> LLMProvider:
    key = (os.environ.get("COPILOT_PROVIDER") or "free").strip().lower()
    provider_class = PROVIDERS.get(key)
    if provider_class is None:
        raise CopilotError(f"Unknown COPILOT_PROVIDER '{key}'. Options: {', '.join(PROVIDERS)}")
    return provider_class()
