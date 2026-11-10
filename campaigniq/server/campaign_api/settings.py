"""Loads ``server/.env`` (KEY=VALUE lines) into the environment without extra dependencies.

Real environment variables win over the file, so production can inject secrets directly.
"""

from __future__ import annotations

import os
from pathlib import Path

ENV_PATH = Path(os.environ.get("CAMPAIGNIQ_ENV_FILE", Path(__file__).resolve().parents[1] / ".env"))


def load_env_file(path: Path = ENV_PATH) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.split(" #", 1)[0].strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)
