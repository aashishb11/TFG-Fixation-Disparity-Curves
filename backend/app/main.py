from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist

from app.services.fdc_fit import fit_all_models

app = FastAPI(title="TFG Fixation Disparity API", version="0.1.0")

# Vite dev server default: http://localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComputeRequest(BaseModel):
    y: conlist(float, min_length=7, max_length=7)

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

@app.post("/api/v1/compute")
def compute(req: ComputeRequest):
    try:
        return fit_all_models(req.y)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation failed: {e}")