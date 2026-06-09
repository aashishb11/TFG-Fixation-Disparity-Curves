# Fixation Disparity Curve (FDC) Modeling — TFG

Web application for fitting and visualizing **Fixation Disparity Curves** from clinical measurements. The user enters 7 measured values and the app fits four different curve models (Type I–IV), shows the error metrics (SSE, RMSE) for each one and picks the best fitting curve type.

Reference paper (linked from `docs/`):
<https://pmc.ncbi.nlm.nih.gov/articles/PMC12682111/pdf/OPO-45-1642.pdf>

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the project](#running-the-project)
- [Scripts](#scripts)
- [API](#api)
- [Architecture](#architecture)
- [Linting, formatting, testing](#linting-formatting-testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Project status / what is not in the repo](#project-status--what-is-not-in-the-repo)

---

## Overview

The user provides 7 y-values measured at `[-15, -10, -5, 0, 5, 10, 15]` prism diopters. The backend fits four models from the reference paper:

| Model | Equation |
|-------|-----------------------------|
| T1    | `y = a + b · (x − c)^3`                    |
| T2    | `y = a + b · exp(−c · (x − d))`            |
| T3    | `y = a − b · exp(c · (x − d))`             |
| T4    | `y = a − b · arctan(c · (x − d))`          |

For each model the API returns: fitted parameters, SSE, RMSE, the slope defined as `|f(3) − f(−3)| / 6` (same as the paper), a smooth curve for plotting, and the fitted values at the 7 original x positions. The classification block says which model wins by SSE and by RMSE.

The frontend shows all four curves plus the measured points in a Recharts chart, a card with the best model summary (slope, fixation disparity at x=0, associated phoria), and lets the user export the chart as PNG or generate a PDF clinical report.

---

## Tech stack

**Backend**
- Python + [FastAPI 0.129.2](https://fastapi.tiangolo.com/)
- [Pydantic 2.12.5](https://docs.pydantic.dev/) for request validation
- [NumPy 2.4.2](https://numpy.org/)
- [GEKKO 1.3.2](https://gekko.readthedocs.io/) for constrained nonlinear fitting
- [Uvicorn 0.41.0](https://www.uvicorn.org/) as the ASGI server

**Frontend**
- [React 19.2](https://react.dev/) + [TypeScript 5.9](https://www.typescriptlang.org/)
- [Vite 7.3](https://vitejs.dev/) (dev server, bundler, proxy)
- [Recharts 3.7](https://recharts.org/) for the curve/scatter chart
- ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

---

## Features

All items below correspond to code actually present in the repo:

- **7-point input panel** with clinical presets for viewing distances **40 cm** and **25 cm**, plus a free-form **Other** option with a custom-distance field (`frontend/src/components/InputPanel.tsx`, `frontend/src/constants/fdc.ts`).
- **Nonlinear curve fitting** of four FDC models with per-model parameter constraints solved by GEKKO (`backend/app/services/fdc_fit.py`).
- **Error metrics** per model: SSE and RMSE, plus a **paper-defined slope** `|f(3) − f(−3)| / 6`.
- **Automatic classification** by both SSE and RMSE (`best_by_sse`, `best_by_rmse`).
- **Composed chart** (Recharts) with 4 colored curves, 7 scatter points, reference lines at `x=0` and `y=0`, and fixed axis domain `[-20, 20]` (`frontend/src/components/CurveChart.tsx`).
- **Classification card** surfacing best fit, slope, fixation disparity (y at x=0), and associated phoria (`frontend/src/components/ClassificationCard.tsx`, `frontend/src/lib/clinicalSummary.ts`).
- **Collapsible advanced metrics table** highlighting the best-by-SSE row (`frontend/src/components/AdvancedMetricsSection.tsx`, `MetricsTable.tsx`).
- **High-resolution PNG export** of the chart (2× scale, `#f8fbfd` background) via `frontend/src/lib/exportChart.ts`.
- **UPC branding** in the page header (`frontend/images/UPC_Logo.png`).
- **Race-safe recomputation**: a version counter in `App.tsx` discards stale responses when inputs change mid-request.

---

## Repository structure

```
TFG/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, routes
│   │   └── services/
│   │       └── fdc_fit.py           # GEKKO fitting, SSE/RMSE/slope
│   ├── tests/
│   │   ├── conftest.py              # Adds backend/ to sys.path for tests
│   │   ├── test_fdc_fit.py          # Unit + integration tests for the fitter
│   │   └── test_main.py             # HTTP tests via FastAPI TestClient
│   ├── pytest.ini                   # pytest config (testpaths, markers)
│   ├── requirements.txt             # Pinned runtime Python deps
│   └── requirements-dev.txt         # Test-time deps (pytest, httpx)
├── frontend/
│   ├── images/UPC_Logo.png          # Header logo
│   ├── public/vite.svg
│   ├── src/
│   │   ├── api/fdc.ts               # computeFits() — POST /api/v1/compute
│   │   ├── components/
│   │   │   ├── AdvancedMetricsSection.tsx
│   │   │   ├── ClassificationCard.tsx
│   │   │   ├── CurveChart.tsx
│   │   │   ├── InputPanel.tsx
│   │   │   ├── MetricsTable.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── constants/fdc.ts         # Fixed x, presets, colors, labels
│   │   ├── lib/
│   │   │   ├── chart.ts             # mergeModelCurves()
│   │   │   ├── clinicalSummary.ts   # FD at x=0, associated phoria
│   │   │   ├── exportChart.ts       # SVG → PNG export
│   │   │   └── input.ts             # Validation helpers
│   │   ├── types/fdc.ts             # Shared TS types
│   │   ├── test/setup.ts            # Vitest setup (jest-dom, cleanup)
│   │   ├── **/*.test.ts{,x}         # Co-located Vitest tests
│   │   ├── App.tsx                  # Root component, orchestration
│   │   └── main.tsx                 # ReactDOM entry
│   ├── index.html
│   ├── package.json
│   ├── tsconfig*.json
│   ├── vite.config.ts               # /api → http://localhost:8000
│   ├── vitest.config.ts             # jsdom env, coverage, setup file
│   └── eslint.config.js
└── docs/
    ├── README.md                    # Phase 1 requirements
    ├── Requirements.pdf
    ├── model-and-errors.md          # (empty)
    └── references/                  # Reference paper
```

---

## Prerequisites

- **Python 3.11+** recommended. The pinned dependencies like `numpy==2.4.2` and `pydantic==2.12.5` require a recent version.
- **Node.js 20.19+ or 22.12+** — Vite 7 needs it. Use npm (no pnpm or yarn).
- **GEKKO** installs a platform-specific solver binary via pip. On most platforms it works fine but if it fails check the GEKKO docs.
- No database, no external services — the app is completely stateless.

---

## Installation

Clone the repository and install the two sides independently.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Frontend

```bash
cd frontend
npm install
```

### Environment variables

| Variable | Side | Default | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGINS` | backend | `http://localhost:5173,https://fixationdisparitycurves.upc.edu` | Comma-separated list of origins allowed by the CORS middleware. Set in the hosting platform (e.g. Render env vars). |
| `VITE_API_BASE_URL` | frontend (build-time) | `""` (relative) | Absolute URL of the backend service. Must be set before running `npm run build` for production. Example: `https://your-backend.onrender.com`. Leave empty for local dev (the Vite proxy handles `/api` → `localhost:8000`). |

---

## Running the project

The app is designed for local development. There is **no production deployment configuration** in the repository (no Dockerfile, no compose file, no CI). Run the two processes in separate terminals.

### Backend (dev)

From the `backend/` directory, with the virtualenv activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The API becomes available at `http://localhost:8000`. Interactive docs are served by FastAPI at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc:      <http://localhost:8000/redoc>

### Frontend (dev)

From the `frontend/` directory:

```bash
npm run dev
```

The Vite dev server starts (default `http://localhost:5173`). Requests to `/api/*` are proxied to `http://localhost:8000` per `vite.config.ts`, so the backend must also be running.

### Frontend (production build / preview)

```bash
npm run build      # type-check with tsc -b, then vite build into frontend/dist
npm run preview    # preview the built output locally
```

> Note: the preview server does **not** proxy `/api` — in a real deployment you must host the built SPA behind a web server/reverse proxy that forwards `/api/*` to the FastAPI backend. *Not included in this repository.*

---

## Scripts

All scripts declared in `frontend/package.json`:

| Script          | Command            | Purpose                                              |
|-----------------|--------------------|------------------------------------------------------|
| `npm run dev`   | `vite`             | Start the Vite dev server with HMR on port 5173.     |
| `npm run build` | `tsc -b && vite build` | Project-reference type-check then production build. |
| `npm run lint`  | `eslint .`         | Lint the frontend sources.                           |
| `npm run preview` | `vite preview`   | Serve the production build locally.                  |
| `npm test`      | `vitest run`       | Run the Vitest unit-test suite once and exit.         |
| `npm run test:watch` | `vitest`      | Run Vitest in watch mode during development.          |
| `npm run test:coverage` | `vitest run --coverage` | Run Vitest and emit an lcov / html coverage report under `coverage/`. |

The backend has **no script manifest** (no Makefile, no `pyproject.toml` scripts). Use `uvicorn` or `pytest` directly:

```bash
cd backend
# one-off or CI install of test dependencies (only needed once):
pip install -r requirements-dev.txt
# run the whole Python test suite:
pytest
```

---

## API

Base URL: `http://localhost:8000` (direct) or `/api/...` via the Vite proxy.

### `GET /api/v1/health`

Health probe.

```json
200 OK
{ "status": "ok" }
```

### `POST /api/v1/compute`

Fit the four FDC models to 7 measured y-values at the fixed x positions `[-15, -10, -5, 0, 5, 10, 15]`.

**Request body** (`application/json`):

```json
{ "y": [y1, y2, y3, y4, y5, y6, y7] }
```

- `y` must contain **exactly 7** finite floats (validated by Pydantic `conlist(float, min_length=7, max_length=7)` and the fitter). Anything else returns `400`.

**Response 200** (shape — see `backend/app/services/fdc_fit.py` and `frontend/src/types/fdc.ts`):

```json
{
  "x": [-15, -10, -5, 0, 5, 10, 15],
  "measured": [{ "x": -15, "y": ... }, ...],
  "models": {
    "T1": {
      "params": { "a": 0.0, "b": 0.0, "c": 0.0 },
      "sse": 0.0,
      "rmse": 0.0,
      "slope": 0.0,
      "fitted_at_x": [ ... 7 floats ... ],
      "curve": [ { "x": ..., "y": ... }, ... ]
    },
    "T2": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 }, ... },
    "T3": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 }, ... },
    "T4": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 }, ... }
  },
  "classification": {
    "best_by_sse":  "T1|T2|T3|T4",
    "best_by_rmse": "T1|T2|T3|T4"
  }
}
```

**Errors**
- `400 Bad Request` — raised for validation failures from `fit_all_models` (wrong number of values, non-finite values). The body is `{ "detail": "..." }`.
- `429 Too Many Requests` — rate limit exceeded. The endpoint is capped at **30 requests per minute per IP**. This is enough for any real clinical session and blocks scripted abuse. Implemented via `slowapi` (in-memory, no external store required).
- `500 Internal Server Error` — any other exception bubbled up from GEKKO/NumPy is wrapped as `{ "detail": "Computation failed: ..." }`.

> **Execution model:** every call triggers **immediate synchronous computation** — numpy/gekko runs inline in the HTTP request. There is no queue, no background task, no cron scheduler. Each request is independent and stateless.

---

## Architecture

```
┌────────────────────┐        POST /api/v1/compute         ┌──────────────────────┐
│  React SPA (Vite)  │  ─────────────────────────────────► │  FastAPI (uvicorn)   │
│  localhost:5173    │   proxy /api → localhost:8000       │  localhost:8000      │
│                    │ ◄────────────────────────────────── │                      │
└─────────┬──────────┘        JSON { models, ... }         └──────────┬───────────┘
          │                                                           │
          │ Recharts                                                  │ GEKKO solves
          ▼                                                           ▼
   Composed chart + metrics table + classification          Four constrained NLP
   + PNG/PDF export                                         fits → SSE/RMSE/slope
```

- The frontend is a single-page app, state is managed locally with `useState`, `useMemo` and `useRef`. No Redux or Context.
- The backend has no database, no authentication and no sessions. Each request runs the four GEKKO models independently and returns the result.
- Allowed origins are controlled via the `ALLOWED_ORIGINS` environment variable (see env vars section). The default includes localhost for development and the production cPanel URL.

---

## Linting, formatting, testing

- **Frontend lint**: `npm run lint` (ESLint flat config in `frontend/eslint.config.js` extending `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended-latest, `eslint-plugin-react-refresh/vite`; ignores `dist`).
- **Frontend type-check**: executed as part of `npm run build` (`tsc -b` against the project-reference setup in `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`, both with `strict: true`, `noUnusedLocals`, `noUnusedParameters`).
- **Formatter**: no Prettier configuration found in the repo.

### Tests

The repository now ships a full automated test suite on both sides.

**Backend — pytest (`backend/tests/`)**

Test dependencies are declared separately in `backend/requirements-dev.txt` so the production install of `requirements.txt` stays lean. The pytest configuration lives in `backend/pytest.ini` and registers a `slow` marker for the GEKKO-backed integration fits.

```bash
cd backend
source .venv/bin/activate      # on Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest                          # run all tests
pytest -m "not slow"            # skip the GEKKO integration fits
```

What is covered:

- `tests/test_fdc_fit.py` — pure helpers (`_sse`, `_rmse`, `_build_smooth_x`), per-model evaluation (`_eval_model`), the paper-defined slope (`_compute_slope_paper`), input validation (wrong length, NaN, Infinity, bad x-shape) and end-to-end `fit_all_models` calls against synthetic y-data drawn from each analytical model (asserts envelope shape, classification well-formedness, residual SSE).
- `tests/test_main.py` — FastAPI `GET /api/v1/health`, Pydantic validation on `POST /api/v1/compute` (missing body, wrong length, non-numeric values, non-finite values), and a full success path asserting the complete JSON envelope.

**Frontend — Vitest (`frontend/src/**/*.test.ts{,x}`)**

Configured in `frontend/vitest.config.ts` with the `jsdom` environment, `@testing-library/jest-dom` matchers, and a shared setup file at `src/test/setup.ts` that runs React `cleanup()` between tests.

```bash
cd frontend
npm test                 # run all tests once
npm run test:watch       # watch mode for development
npm run test:coverage    # write lcov + html coverage under coverage/
```

What is covered:

- `src/lib/input.test.ts` — `validateViewingDistance` (all preset and custom-distance branches) and `parseYValues` (numeric, alphabetic, NaN, Infinity inputs).
- `src/lib/chart.test.ts` — `mergeModelCurves` for null responses, full-length curves, and unequal curve lengths (safety truncation).
- `src/lib/clinicalSummary.test.ts` — `deriveClinicalMeasurements` for empty input, fixation disparity at `x = 0`, nearest associated phoria, and -0 normalisation.
- `src/lib/chartAnnotations.test.ts` — `getPatientLimitMarkers` across the four zero-pattern cases at `x ∈ {-15, -10}`.
- `src/lib/chartHover.test.ts` — snap / interpolation / domain-bound logic plus hover-snapshot equality used by `CurveChart`.
- `src/constants/fdc.test.ts` — axis domain constant, fixed x positions, model keys, and the 40 cm / 25 cm preset lookup via `getPresetValuesForFixedX`.
- `src/api/fdc.test.ts` — `computeFits` request shape, JSON `detail` surfacing, raw-text fallback, and the empty-body HTTP status fallback, all exercised against a mocked `fetch`.
- `src/components/MetricsTable.test.tsx` — empty placeholder, per-model rows with 3-decimal metric formatting, and the `metric-table__row--active` highlight for the best-by-SSE row.
- `src/components/ClassificationCard.test.tsx` — placeholder state, selected-model label + slope, fixation disparity at `x = 0`, and the smallest-non-zero associated phoria readout.

Totals at the time of writing: **26 backend tests** (pytest) and **56 frontend tests** (Vitest).

---

## Deployment

### Current setup

| Side | Host | URL |
|---|---|---|
| Frontend | cPanel (UPC) | <https://fixationdisparitycurves.upc.edu/> |
| Backend | Render (free tier) | `https://tfg-fixation-disparity-curves-uee8.onrender.com` |

The repository includes a `render.yaml` at the root that configures the Render web service automatically:
- **Root directory**: `backend/`
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

> **Free tier limitation:** Render's free plan spins down services after 15 minutes of inactivity. The first request after a cold start can take ~30 seconds. Upgrading to the Starter plan ($7/month) eliminates this.

### Deploying the frontend

```bash
# 1. Set the backend URL (no trailing slash, no spaces)
echo "VITE_API_BASE_URL=https://your-backend.onrender.com" > frontend/.env.production

# 2. Build
cd frontend && npm run build

# 3. Upload frontend/dist/ contents to cPanel public_html (replacing existing files)
```

### Self-hosted alternative (e.g. UPC server)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Set ALLOWED_ORIGINS to your frontend domain
export ALLOWED_ORIGINS=https://fixationdisparitycurves.upc.edu
```

---

## Troubleshooting

- **404 on `/api/v1/compute` or frontend can't reach the API.** Check the backend is running on port 8000. The Vite proxy in `vite.config.ts` is hardcoded to that URL so if you change the port you need to update it there too.
- **CORS error in browser.** The backend reads the allowed origins from `ALLOWED_ORIGINS` env var. In development it defaults to `http://localhost:5173`, if you run on a different port you need to update that.
- **GEKKO install or solver errors.** GEKKO downloads a solver binary that depends on the platform. If `pip install gekko` fails or the solver crashes check your Python version and architecture.
- **400 "Expected exactly 7 y values" or "All y values must be finite".** The backend validates both length and the values themselves, make sure all 7 fields are filled with valid numbers.
- **Old result shown after changing inputs.** The app uses a version counter to drop stale responses, if you still see it just rerun the fit. Changing viewing distance also clears the current result.
- **Port already in use.** Kill the other process or change the port with `--port` flag and update the proxy/CORS accordingly.

---

## Project status / what is not in the repo

The repository is focused on Phase 1 (see `docs/README.md`). The following are **not** present and are noted here so they are not assumed:

- No CI workflow. Tests run locally via `pytest` (backend) and `vitest run` (frontend); no `.github/workflows/` is present.
- No Docker/container configuration (a `render.yaml` for Render is present).
- No authentication, authorization, persistence, or per-patient storage — every request is stateless.
- No explicit Python version pin in `backend/requirements.txt`.
- `docs/model-and-errors.md` is currently empty.

Contributions and clarifications on the above are welcome — when in doubt, prefer editing the existing files over introducing new tooling, and keep the hardcoded dev ports (`5173`, `8000`) consistent across both sides.
