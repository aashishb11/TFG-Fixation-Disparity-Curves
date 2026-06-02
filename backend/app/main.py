"""
FastAPI application entry point for the Fixation Disparity Curve fitting API.

Routes
------
GET  /api/v1/health   — liveness probe, returns {"status": "ok"}
POST /api/v1/compute  — accepts 7 measured y-values, returns curve fits for
                        all four polynomial models plus a best-fit classification
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

app = FastAPI(title="TFG Fixation Disparity API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://fixationdisparitycurves.upc.edu",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComputeRequest(BaseModel):
    """Exactly 7 fixation-disparity y-values measured at the fixed x positions
    [-15, -10, -5, 0, 5, 10, 15] (prism diopters -> arcmin)."""

    y: conlist(float, min_length=7, max_length=7)


@app.get("/api/v1/health")
def health():
    """Liveness probe — returns immediately with no backend computation."""
    return {"status": "ok"}


@app.post("/api/v1/compute")
@limiter.limit("30/minute")
def compute(request: Request, req: ComputeRequest):
    """
    Fit all four FDC polynomial models to the supplied measurements and return
    the fitted curves, error metrics, and best-fit classification.

    Raises HTTP 400 for invalid input (e.g. non-finite values).
    Raises HTTP 429 when the caller exceeds 30 requests per minute.
    Raises HTTP 500 for unexpected solver failures.
    """
    try:
        return fit_all_models(req.y)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation failed: {e}")
