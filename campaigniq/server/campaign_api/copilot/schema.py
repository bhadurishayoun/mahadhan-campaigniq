"""Request/response contract for the AI Co-pilot.

``CopilotAnswer`` mirrors the ``Answer`` type in ``web/src/screens/ai.tsx`` so an LLM answer renders
in exactly the same layout as the built-in illustrative answers.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Scope(BaseModel):
    season: str | None = None
    state: str | None = None
    district: str | None = None
    taluka: str | None = None
    crop: str | None = None
    product: str | None = None
    campaign_type: str | None = None


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    scope: Scope = Field(default_factory=Scope)
    screen: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list, max_length=10)


class Link(BaseModel):
    label: str
    to: str


class Table(BaseModel):
    columns: list[str]
    rows: list[list[str | int | float | None]]
    highlight: int | None = None


class Bar(BaseModel):
    label: str
    value: float
    display: str
    low: bool = False


class Chart(BaseModel):
    title: str
    axis: str
    max: float = Field(gt=0)
    bars: list[Bar]


class Confidence(BaseModel):
    level: Literal["High", "Medium", "Low"]
    text: str


class CopilotAnswer(BaseModel):
    question: str
    title: str
    summary: str
    table: Table
    chart: Chart
    factors: list[str] = Field(default_factory=list)
    confidence: Confidence
    sources: list[Link] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    primary: Link
    secondary: Link


class AskResponse(BaseModel):
    mode: Literal["llm", "demo"]
    provider: str
    model: str | None = None
    answer: CopilotAnswer | None = None
    grounded_on: list[str] = Field(default_factory=list)
    message: str | None = None
