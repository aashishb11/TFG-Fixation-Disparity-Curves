# Fixation Disparity Curve (FDC) Modeling — TFG

This is the web application I built as the software part of my Final Degree
Project (TFG). It fits and visualizes **Fixation Disparity Curves** from clinical
measurements: I let the user enter 7 measured values, my backend fits four
different curve models (Type I–IV), and the app shows the error metrics (SSE,
RMSE) for each one and picks the best-fitting curve type.

I based the methodology on the reference paper (linked from `docs/references/`):
Argilés et al. (2025), *Mathematical models to describe fixation disparity curves*
— <https://pmc.ncbi.nlm.nih.gov/articles/PMC12682111/pdf/OPO-45-1642.pdf>

> For a full thesis-oriented write-up of the design and the mathematics, see
> [`docs/fdc-technical-documentation.md`](fdc-technical-documentation.md).

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

The user provides 7 y-values measured at `[-15, -10, -5, 0, 5, 10, 15]` prism
diopters. I fit four models from the reference paper on the backend:

| Model | Equation |
|-------|-----------------------------|
| T1    | `y = a + b · (x − c)^3`                    |
| T2    | `y = a + b · exp(−c · (x − d))`            |
| T3    | `y = a − b · exp(c · (x − d))`             |
| T4    | `y = a − b · arctan(c · (x − d))`          |

For each model I return the fitted parameters, SSE, RMSE, the slope I defined as
`|f(3) − f(−3)| / 6` (the paper's definition), a smooth curve for plotting, and
the fitted values at the 7 original x positions. The classification block reports
which model wins by SSE and by RMSE.

On the frontend I draw all four curves plus the measured points in a Recharts
chart, a card with the best-model summary (slope, fixation disparity at x = 0,
associated phoria), and I let the user export the chart as PNG or generate a PDF
clinical report. I chose this layout so that the visual fit and the numbers agree
on screen, which is what makes the classification explainable.

---

## Tech stack

I only used the technologies actually present in the repository.

**Backend**
- Python + [FastAPI 0.129.2](https://fastapi.tiangolo.com/)
- [Pydantic 2.12.5](https://docs.pydantic.dev/) for request validation
- [NumPy 2.4.2](https://numpy.org/)
- [GEKKO 1.3.2](https://gekko.readthedocs.io/) for constrained nonlinear fitting
- [slowapi 0.1.9](https://pypi.org/project/slowapi/) for per-IP rate limiting
- [Uvicorn 0.41.0](https://www.uvicorn.org/) as the ASGI server
- [Ruff 0.14.0](https://docs.astral.sh/ruff/) (dev) for linting and formatting

**Frontend**
- [React 19.2](https://react.dev/) + [TypeScript 5.9](https://www.typescriptlang.org/)
- [Vite 7.3](https://vitejs.dev/) (dev server, bundler, proxy)
- [Prettier 3.8](https://prettier.io/) (dev) for code formatting
- [Recharts 3.7](https://recharts.org/) for the curve/scatter chart
- [jsPDF 4.2](https://github.com/parallax/jsPDF) for the PDF clinical report
- ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

> I did **not** use SciPy — the fitting is done with GEKKO, not `scipy.optimize`.
> For code quality I configured **Ruff** (lint + format) on the backend via
> `backend/pyproject.toml` and **Prettier** on the frontend via `.prettierrc.json`.

---

## Features

Every item below corresponds to code I actually wrote and that lives in the repo:

- **7-point input panel** with a viewing-distance selector for **40 cm** and
  **25 cm** (`frontend/src/components/InputPanel.tsx`, `frontend/src/constants/fdc.ts`).
  The viewing distance is a required UI selection but is not currently sent to the
  backend.
- **Nonlinear curve fitting** of four FDC models with per-model parameter
  constraints, solved by GEKKO (`backend/app/services/fdc_fit.py`).
- **Error metrics** per model: SSE and RMSE, plus the **paper-defined slope**
  `|f(3) − f(−3)| / 6`.
- **Automatic classification** by both SSE and RMSE (`best_by_sse`, `best_by_rmse`).
- **Composed chart** (Recharts) with 4 colored curves, 7 scatter points, reference
  lines, and a fixed axis domain `[-20, 20]` (`frontend/src/components/CurveChart.tsx`).
- **Classification card** surfacing best fit, slope, fixation disparity (y at
  x = 0), and associated phoria (`frontend/src/components/ClassificationCard.tsx`,
  `frontend/src/lib/clinicalSummary.ts`).
- **Collapsible advanced metrics table** highlighting the best-by-SSE row
  (`frontend/src/components/AdvancedMetricsSection.tsx`, `MetricsTable.tsx`).
- **High-resolution PNG export** of the chart (`frontend/src/lib/exportChart.ts`).
- **PDF clinical report** with optional subject details (`frontend/src/lib/pdfReport.ts`).
- **Per-IP rate limiting**: 30 requests/minute on the compute endpoint
  (`backend/app/main.py`, slowapi).
- **Race-safe recomputation**: a version counter in `App.tsx` discards stale
  responses when inputs change mid-request.

---

## Repository structure

```
TFG-Fixation-Disparity-Curves/
├── render.yaml                       # Render deployment blueprint (backend)
├── PRODUCT.md                        # Product brief / design principles
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app, CORS, rate limiting, routes
│   │   └── services/
│   │       └── fdc_fit.py            # GEKKO fitting, SSE/RMSE/slope, classification
│   ├── tests/
│   │   ├── conftest.py               # Adds backend/ to sys.path for tests
│   │   ├── test_fdc_fit.py           # Unit + integration tests for the fitter
│   │   └── test_main.py              # HTTP tests via FastAPI TestClient
│   ├── pyproject.toml                # Project metadata + Ruff lint/format config
│   ├── pytest.ini                    # pytest config (testpaths, markers)
│   ├── requirements.txt              # Pinned runtime Python deps
│   └── requirements-dev.txt          # Test/lint-time deps (pytest, httpx, ruff)
├── frontend/
│   ├── images/UPC_Logo.png           # Header logo
│   ├── .prettierrc.json              # Prettier formatting config
│   ├── src/
│   │   ├── api/fdc.ts                # computeFits() — POST /v1/compute
│   │   ├── components/               # InputPanel, CurveChart, ClassificationCard, …
│   │   ├── constants/fdc.ts          # Fixed x, presets, colors, labels
│   │   ├── lib/                      # chart, classification, clinicalSummary, input, export
│   │   ├── types/fdc.ts              # Shared TS types
│   │   ├── App.tsx                   # Root component, orchestration
│   │   └── main.tsx                  # ReactDOM entry
│   ├── index.html
│   ├── package.json
│   ├── tsconfig*.json
│   ├── vite.config.ts                # /api → http://localhost:8000
│   ├── vitest.config.ts              # jsdom env, coverage, setup file
│   ├── eslint.config.js
│   └── .env.development / .env.production  # VITE_API_URL per environment
└── docs/
    ├── README.md                     # This file
    ├── fdc-technical-documentation.md# Full thesis-oriented technical doc
    ├── model-and-errors.md           # Model/metrics notes
    ├── presentationPreparationFDC.md # Background + presentation notes
    └── references/                   # Reference paper
```

---

## Prerequisites

- **Python 3.11+** recommended. I pinned dependencies like `numpy==2.4.2` and
  `pydantic==2.12.5` that require a recent version. (The exact Python version is
  not pinned in the repo.)
- **Node.js 20.19+ or 22.12+** — Vite 7 needs it. I use npm (no pnpm or yarn).
- **GEKKO** installs a platform-specific solver binary via pip. On most platforms
  it works fine; if it fails, check the GEKKO docs.
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
| `VITE_API_URL` | frontend (build/dev) | dev: `http://127.0.0.1:8000`, prod: `/api` | Base URL my API client uses. Set in `frontend/.env.development` / `frontend/.env.production`. |
| `ALLOWED_ORIGINS` | backend | `http://localhost:5173,https://fixationdisparitycurves.upc.edu` | Read into a list in `main.py`. **Note:** in the current code the CORS middleware uses `allow_origins=["*"]`, so this list is not yet applied — see the technical doc. |
| `ROOT_PATH` | backend | `""` | Path prefix so Swagger/OpenAPI work behind a reverse proxy. |

---

## Running the project

I designed the app to run as two processes in separate terminals.

### Backend (dev)

From the `backend/` directory, with the virtualenv activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The API becomes available at `http://localhost:8000`. FastAPI serves interactive
docs at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc:      <http://localhost:8000/redoc>

### Frontend (dev)

From the `frontend/` directory:

```bash
npm run dev
```

The Vite dev server starts (default `http://localhost:5173`). Requests to `/api/*`
are proxied to `http://localhost:8000` per `vite.config.ts`, so the backend must
also be running.

### Frontend (production build / preview)

```bash
npm run build      # type-check with tsc -b, then vite build into frontend/dist
npm run preview    # preview the built output locally
```

> The preview server does **not** proxy `/api` — in a real deployment the built
> SPA (which uses `VITE_API_URL=/api`) must sit behind a web server / reverse proxy
> that forwards `/api/*` to the FastAPI backend.

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
| `npm run test:coverage` | `vitest run --coverage` | Run Vitest and emit coverage under `coverage/`. |
| `npm run format` | `prettier --write .` | Format the frontend sources with Prettier.        |
| `npm run format:check` | `prettier --check .` | Verify formatting without writing.               |

The backend has no npm-style script manifest; `backend/pyproject.toml` holds
project metadata and the Ruff configuration (the pytest config stays in
`pytest.ini`). I run the tools directly:

```bash
cd backend
pip install -r requirements-dev.txt   # test + lint deps (once)
pytest                                 # run the Python test suite
ruff check .                           # lint
ruff format .                          # format (use --check to verify only)
```

---

## API

Base URL: `http://localhost:8000` (direct) or `/api/...` via the proxy.

### `GET /v1/health` (and `GET /health`)

Health probe.

```json
200 OK
{ "status": "ok" }
```

### `POST /v1/compute`

Fit the four FDC models to 7 measured y-values at the fixed x positions
`[-15, -10, -5, 0, 5, 10, 15]`.

**Request body** (`application/json`):

```json
{ "y": [y1, y2, y3, y4, y5, y6, y7] }
```

- `y` must contain **exactly 7** finite floats (validated by Pydantic
  `conlist(float, min_length=7, max_length=7)` and again inside the fitter).

**Response 200** (shape — see `backend/app/services/fdc_fit.py` and
`frontend/src/types/fdc.ts`):

```json
{
  "x": [-15, -10, -5, 0, 5, 10, 15],
  "measured": [{ "x": -15, "y": 0.0 }],
  "models": {
    "T1": {
      "params": { "a": 0.0, "b": 0.0, "c": 0.0 },
      "sse": 0.0,
      "rmse": 0.0,
      "slope": 0.0,
      "fitted_at_x": [0.0],
      "curve": [{ "x": -15.0, "y": 0.0 }]
    },
    "T2": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 } },
    "T3": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 } },
    "T4": { "params": { "a": 0, "b": 0, "c": 0, "d": 0 } }
  },
  "classification": {
    "best_by_sse":  "T1",
    "best_by_rmse": "T1"
  }
}
```

**Errors**
- `422` — Pydantic schema violation (wrong type/length).
- `400` — validation failure inside `fit_all_models` (wrong number of values,
  non-finite values). Body: `{ "detail": "..." }`.
- `429` — rate limit exceeded (30 requests/minute per IP via slowapi).
- `500` — any other exception from GEKKO/NumPy, wrapped as
  `{ "detail": "Computation failed: ..." }`.

> **Execution model:** every call triggers immediate synchronous computation —
> NumPy/GEKKO run inline in the HTTP request. There is no queue and no background
> task; each request is independent and stateless.

---

## Architecture

```
┌────────────────────┐        POST /v1/compute             ┌──────────────────────┐
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

- I keep the frontend as a single-page app with local React state (`useState`,
  `useMemo`, `useRef`) — no Redux or Context.
- The backend has no database, no auth and no sessions. Each request runs the four
  GEKKO models independently and returns the result.
- CORS is currently permissive (`allow_origins=["*"]`); see the technical doc for
  the `ALLOWED_ORIGINS` note.

---

## Linting, formatting, testing

- **Frontend lint**: `npm run lint` (ESLint flat config in
  `frontend/eslint.config.js`, with `eslint-config-prettier` to avoid clashes).
- **Frontend format**: `npm run format` / `npm run format:check` (Prettier,
  `frontend/.prettierrc.json`).
- **Frontend type-check**: part of `npm run build` (`tsc -b`, strict mode).
- **Backend lint + format**: `ruff check .` and `ruff format .` (Ruff, configured
  in `backend/pyproject.toml`).

### Tests

I ship an automated test suite on both sides.

**Backend — pytest (`backend/tests/`)**

```bash
cd backend
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest                          # run all tests
pytest -m "not slow"            # skip the GEKKO integration fits
```

- `tests/test_fdc_fit.py` — helpers (`_sse`, `_rmse`, `_build_smooth_x`), per-model
  evaluation (`_eval_model`), the slope (`_compute_slope_paper`), input validation,
  and end-to-end `fit_all_models` against synthetic data.
- `tests/test_main.py` — health endpoint, Pydantic validation on `/v1/compute`, and
  a full success path asserting the JSON envelope.

**Frontend — Vitest (`frontend/src/**/*.test.ts{,x}`)**

```bash
cd frontend
npm test                 # run all tests once
npm run test:watch       # watch mode
npm run test:coverage    # coverage under coverage/
```

The frontend tests cover the pure logic modules (`input`, `chart`, `classification`,
`clinicalSummary`, `chartHover`, `chartAnnotations`, `constants`), the API client
(`api/fdc.test.ts`), and components (`MetricsTable`, `ClassificationCard`,
`PageHeader`, `PageFooter`, `App`).

---

## Deployment

I deploy the backend with the [render.yaml](../render.yaml) blueprint:
- **Root directory**: `backend/`
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env var**: `ALLOWED_ORIGINS`

> On Render's free plan the service spins down after inactivity, so the first
> request after a cold start can take ~30 seconds.

### Deploying the frontend

```bash
# 1. The production build uses VITE_API_URL=/api (frontend/.env.production)
cd frontend && npm run build
# 2. Serve frontend/dist/ behind a proxy that forwards /api/* to the backend
```

`TODO: verify` the exact production hosting details for the thesis (frontend host
and backend URL).

---

## Troubleshooting

- **Frontend can't reach the API / 404 on `/v1/compute`.** Make sure the backend is
  running on port 8000. The Vite proxy in `vite.config.ts` is hardcoded to that
  URL, so if you change the port you must update it there too.
- **CORS error in the browser.** The backend currently allows all origins; if you
  later restrict origins via `ALLOWED_ORIGINS`, make sure your frontend origin is
  included (and wired into the middleware — see the technical doc).
- **GEKKO install or solver errors.** GEKKO downloads a platform-specific solver
  binary. If `pip install gekko` fails or the solver crashes, check your Python
  version and architecture.
- **400 "Expected exactly 7 y values" or "All y values must be finite".** Fill all
  7 fields with valid finite numbers.
- **Old result shown after changing inputs.** I use a version counter to drop stale
  responses; if you still see one, rerun the fit. Changing viewing distance also
  clears the current result.
- **Port already in use.** Stop the conflicting process or change the port with
  `--port` and update the proxy/origins accordingly.

---

## Project status / what is not in the repo

I note the following so they are not assumed:

- No CI workflow. Tests run locally via `pytest` (backend) and `vitest run`
  (frontend); there is no `.github/workflows/`.
- No Docker/container configuration (there is a `render.yaml` for Render).
- No authentication, authorization, persistence, or per-patient storage — every
  request is stateless.
- No explicit Python version pin in `backend/requirements.txt`.
- No CI enforcement of the checks — Ruff (backend) and ESLint/Prettier (frontend)
  are configured but run locally, not in a pipeline.
