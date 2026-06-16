"""
FastAPI entry point for the Fixation Disparity Curve API.

Routes (as FastAPI receives them after nginx strips /api):
  GET  /health        - liveness probe, returns {"status": "ok"}
  GET  /v1/health     - same, versioned path
  POST /v1/compute    - receives 7 y-values, returns fits for all models + classification

Externally (via nginx proxy at /api):
  GET  /api/health
  POST /api/v1/compute
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.services.fdc_fit import fit_all_models

limiter = Limiter(key_func=get_remote_address)

_root_path = os.environ.get("ROOT_PATH", "")
app = FastAPI(title="TFG Fixation Disparity API", version="0.1.0", root_path=_root_path)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://fixationdisparitycurves.upc.edu",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComputeRequest(BaseModel):
    """The 7 fixation-disparity y-values measured at x = [-15, -10, -5, 0, 5, 10, 15]."""

    y: conlist(float, min_length=7, max_length=7)


@app.get("/health")
@app.get("/v1/health")
def health():
    """Simple health check."""
    return {"status": "ok"}


@app.post("/v1/compute")
@limiter.limit("30/minute")
def compute(request: Request, req: ComputeRequest):
    """
    Runs the curve fitting for all four models and returns results.

    Returns 400 if the input is invalid (e.g. non-finite values).
    Returns 429 if the caller exceeds 30 requests per minute.
    Returns 500 if GEKKO fails for some unexpected reason.
    """
    try:
        return fit_all_models(req.y)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation failed: {e}") from e
