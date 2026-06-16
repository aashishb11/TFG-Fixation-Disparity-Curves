"""Ensure the backend package is importable when pytest is invoked from the
repository root or the backend/ directory. This mirrors how uvicorn is launched
from backend/ with ``uvicorn app.main:app``."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
