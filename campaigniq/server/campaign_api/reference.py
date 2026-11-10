"""Reference (master) data: geography, products, crops, seasons and campaign types.

The masters live in JSON files under ``server/data/reference`` so new states, districts and
products can be added without code changes. Edit the files directly, or replace them through
``PUT /api/reference/{kind}`` (validated before it is written).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError

REFERENCE_DIR = Path(os.environ.get("CAMPAIGNIQ_REFERENCE_DIR", Path(__file__).resolve().parents[1] / "data" / "reference"))

router = APIRouter(prefix="/api/reference", tags=["reference"])


class District(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    talukas: list[str] = Field(default_factory=list)
    has_data: bool = False


class State(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    districts: list[District] = Field(default_factory=list)


class Geography(BaseModel):
    country: str = "India"
    states: list[State]


class Product(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    family: str | None = None
    pack_sizes_kg: list[float] = Field(default_factory=list)
    crops: list[str] = Field(default_factory=list)
    active: bool = True


class Products(BaseModel):
    products: list[Product]


class NamedItem(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    current: bool | None = None


class Masters(BaseModel):
    crops: list[NamedItem]
    seasons: list[NamedItem]
    campaign_types: list[NamedItem]


Kind = Literal["geography", "products", "masters"]
_MODELS: dict[str, type[BaseModel]] = {"geography": Geography, "products": Products, "masters": Masters}


def _path(kind: str) -> Path:
    return REFERENCE_DIR / f"{kind}.json"


def load(kind: str) -> dict[str, Any]:
    path = _path(kind)
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Reference file missing: {path.name}")
    data = json.loads(path.read_text(encoding="utf-8"))
    data.pop("_comment", None)
    return _MODELS[kind].model_validate(data).model_dump(exclude_none=True)


def _check_unique(kind: str, model: BaseModel) -> None:
    def dupes(values: list[str]) -> set[str]:
        return {value for value in values if values.count(value) > 1}

    problems: list[str] = []
    if isinstance(model, Geography):
        if found := dupes([state.id for state in model.states]):
            problems.append(f"duplicate state ids {sorted(found)}")
        for state in model.states:
            if found := dupes([district.id for district in state.districts]):
                problems.append(f"duplicate district ids in {state.id}: {sorted(found)}")
    elif isinstance(model, Products):
        if found := dupes([product.id for product in model.products]):
            problems.append(f"duplicate product ids {sorted(found)}")
    elif isinstance(model, Masters):
        for field in ("crops", "seasons", "campaign_types"):
            if found := dupes([item.id for item in getattr(model, field)]):
                problems.append(f"duplicate {field} ids {sorted(found)}")
    if problems:
        raise HTTPException(status_code=422, detail=f"Invalid {kind}: " + "; ".join(problems))


@router.get("")
def get_reference() -> dict[str, Any]:
    """Everything the filter bar needs in one call."""
    return {**load("geography"), **load("products"), **load("masters")}


@router.get("/{kind}")
def get_reference_kind(kind: Kind) -> dict[str, Any]:
    return load(kind)


@router.put("/{kind}")
def replace_reference(kind: Kind, payload: dict[str, Any]) -> dict[str, Any]:
    """Replace a master file. Placeholder for an admin UI / MDM sync; add authorization before production use."""
    payload.pop("_comment", None)
    try:
        model = _MODELS[kind].model_validate(payload)
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors()) from error
    _check_unique(kind, model)
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    _path(kind).write_text(json.dumps(model.model_dump(exclude_none=True), indent=2, ensure_ascii=False), encoding="utf-8")
    return load(kind)
