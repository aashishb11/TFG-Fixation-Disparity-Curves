"""
FastAPI application entry point for the Fixation Disparity Curve fitting API.

Routes
------
GET  /api/v1/health   — liveness probe, returns {"status": "ok"}
POST /api/v1/compute  — accepts 7 measured y-values, returns curve fits for
                        all four polynomial models plus a best-fit classification
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist

from app.services.fdc_fit import fit_all_models

app = FastAPI(title="TFG Fixation Disparity API", version="0.1.0")

# Allow requests from the Vite dev server (http://localhost:5173).
# In production this list should be replaced with the real origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComputeRequest(BaseModel):
    """Exactly 7 fixation-disparity y-values measured at the fixed x positions
    [-15, -10, -5, 0, 5, 10, 15] (prism diopters → arcmin)."""

    y: conlist(float, min_length=7, max_length=7)


@app.get("/api/v1/health")
def health():
    """Liveness probe — returns immediately with no backend computation."""
    return {"status": "ok"}


@app.post("/api/v1/compute")
def compute(req: ComputeRequest):
    """
    Fit all four FDC polynomial models to the supplied measurements and return
    the fitted curves, error metrics, and best-fit classification.

    Raises HTTP 400 for invalid input (e.g. non-finite values).
    Raises HTTP 500 for unexpected solver failures.
    """
    try:
        return fit_all_models(req.y)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation failed: {e}")
