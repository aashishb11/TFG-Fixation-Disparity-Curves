# Fixation Disparity Curve (FDC) Modeling — TFG

An interactive web application for fitting, visualizing and classifying **Fixation Disparity Curves** from clinical measurements. Given 7 patient responses at fixed stimulus positions, the app fits four curve models (Type I–IV), reports per-model error metrics (SSE, RMSE) and a paper-defined slope, and selects the best-fitting curve type.

Reference paper (linked from `docs/`):
<https://pmc.ncbi.nlm.nih.gov/articles/PMC12682111/pdf/OPO-45-1642.pdf>

> This is **Phase 1** of the TFG (see [`docs/README.md`](docs/README.md)): an end-to-end web app that visualizes FDCs and classifies them into types T1–T4 via polynomial/nonlinear approximation and error comparison.

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

Given 7 measured y-values at the fixed x positions `[-15, -10, -5, 0, 5, 10, 15]`, the backend fits four candidate models:

| Model | Equation (fitted by GEKKO) |
|-------|-----------------------------|
| T1    | `y = a + b · (x − c)^3`                    |
| T2    | `y = a + b · exp(−c · (x − d))`            |
| T3    | `y = a − b · exp(c · (x − d))`             |
| T4    | `y = a − b · arctan(c · (x − d))`          |

For every model it returns: fitted parameters, SSE, RMSE, slope defined as `|f(3) − f(−3)| / 6` (the paper's definition), a dense curve for plotting, and the values of the fit evaluated at the original x positions. A classification block reports `best_by_sse` and `best_by_rmse`.

The frontend renders the four fitted curves + the 7 measured points on a single chart (Recharts), shows a classification card (best fit, slope, fixation disparity at x=0, and the associated phoria — the smallest non-zero x where the best curve crosses y=0), and offers a high-resolution PNG export.

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

- **Python**: not explicitly pinned in the repo (no `pyproject.toml` / runtime constraint in `requirements.txt`). The pinned dependency versions (e.g. `numpy==2.4.2`, `pydantic==2.12.5`) require a recent Python — **Python 3.11+** is recommended; *needs manual confirmation*.
- **Node.js**: no explicit engines field in `frontend/package.json`. `@types/node ^24.x` and `vite ^7.3.1` imply **Node.js 20.19+ or 22.12+** (Vite 7's documented requirement); *needs manual confirmation for the exact minor version*.
- **npm**: ships with Node. No lock file other than `package-lock.json` is present (no pnpm/yarn lock), so **npm** is the expected package manager.
- **OS-level build tooling for GEKKO** may be required on some platforms. If `pip install gekko` fails, consult the GEKKO documentation; *not documented in this repository*.
- **Database**: none. The app is stateless.
- **External services**: none.

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

**No environment variables are defined or consumed in the repository.** The backend origin is hardcoded to `http://localhost:5173` (CORS) in `backend/app/main.py`, and the frontend dev proxy is hardcoded to `http://localhost:8000` in `frontend/vite.config.ts`. There is no `.env.example` to copy.

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
- `500 Internal Server Error` — any other exception bubbled up from GEKKO/NumPy is wrapped as `{ "detail": "Computation failed: ..." }`.

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
   + PNG export                                             fits → SSE/RMSE/slope
```

- The frontend is a **single-page app** with component-local React state (`useState`, `useMemo`, `useRef`). There is no global store (no Redux, no Context).
- The backend is a **pure function wrapped in HTTP** — no database, no auth, no sessions. Each request rebuilds four independent GEKKO models and solves them.
- CORS is configured in `backend/app/main.py` to accept **only** `http://localhost:5173`. For any other origin, adjust `allow_origins` accordingly.

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

- No `Dockerfile`, no `docker-compose*.yml`, no Kubernetes manifests, no `.github/workflows/`, no `.gitlab-ci.yml`. Deployment tooling is **not included in this repository** — *needs manual confirmation* with the project maintainer.
- For a minimal self-hosted deployment you would typically:
  1. Build the SPA: `npm run build` (output in `frontend/dist/`).
  2. Serve `frontend/dist/` from any static host / reverse proxy.
  3. Run `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind the same reverse proxy, forwarding `/api/*` to it.
  4. Update `allow_origins` in `backend/app/main.py` to include the real frontend origin.

  The steps above are not codified anywhere in the repo.

---

## Troubleshooting

- **Frontend cannot reach the API / 404 on `/api/v1/compute`.** Make sure the backend is running on `http://localhost:8000`. The Vite proxy is hardcoded to that URL in `frontend/vite.config.ts`; if you change the backend port you must update the proxy.
- **CORS error in the browser.** The backend only allows `http://localhost:5173`. If you run the frontend on a different port (e.g. `vite --port 5174`), edit the `allow_origins` list in `backend/app/main.py`.
- **`GEKKO` install/solve errors.** GEKKO ships a platform-specific solver binary; pip installs that are incompatible with your OS/arch will fail at install or first call. Confirm your Python version and architecture match a published wheel.
- **`400 Expected exactly 7 y values` / `All y values must be finite numbers`.** The backend validates both the length and finiteness of the `y` array. Fill all 7 fields and avoid empty/NaN/Infinity values.
- **Stale computation shown after changing inputs.** The SPA uses a version counter to discard stale responses; if you still see one, rerun the fit. Changing the viewing distance resets the computed results by design.
- **Port 8000 or 5173 already in use.** Stop the conflicting process or pass `--port` to `uvicorn` / `vite` (then update the matching hardcoded origin / proxy).

---

## Project status / what is not in the repo

The repository is focused on Phase 1 (see `docs/README.md`). The following are **not** present and are noted here so they are not assumed:

- No `.env` / `.env.example` / any runtime configuration via environment variables.
- No CI workflow. Tests run locally via `pytest` (backend) and `vitest run` (frontend); no `.github/workflows/` is present.
- No Docker/container configuration.
- No authentication, authorization, persistence, or per-patient storage — every request is stateless.
- No explicit Python version pin in `backend/requirements.txt`.
- `docs/model-and-errors.md` is currently empty.

Contributions and clarifications on the above are welcome — when in doubt, prefer editing the existing files over introducing new tooling, and keep the hardcoded dev ports (`5173`, `8000`) consistent across both sides.
