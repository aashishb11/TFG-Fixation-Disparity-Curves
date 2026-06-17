# Fixation Disparity Curve (FDC) Modeling

This is the web application I built as the software part of my Final Degree
Project (TFG). It fits and visualizes **Fixation Disparity Curves** from clinical
measurements: the user enters 7 measured values, my backend fits four candidate
curve models (Type I–IV), and the app reports the error metrics (SSE, RMSE) for
each one and picks the best-fitting curve type.

I based the methodology on the paper by Argilés M, Molinero X. *Mathematical
models to describe fixation disparity curves.* Ophthalmic Physiol Opt.
2025;45:1642–1652. DOI: <https://doi.org/10.1111/opo.70025>

My goal was to take a process that used to be done by hand on paper cards and
spreadsheets — and was therefore subjective and hard to reproduce — and turn it
into something objective, transparent, and repeatable in the browser.

> **More documentation.** This is the short overview. For the full project
> documentation I wrote, see [`docs/README.md`](docs/README.md), and for the
> thesis-oriented technical write-up see
> [`docs/fdc-technical-documentation.md`](docs/fdc-technical-documentation.md).

---

## What it does

The user provides 7 y-values measured at `[-15, -10, -5, 0, 5, 10, 15]` prism
diopters. On the backend I fit four models from the reference paper:

| Model | Equation |
|-------|-----------------------------------|
| T1 (Type I)   | `y = a + b · (x − c)^3`            |
| T2 (Type II)  | `y = a + b · exp(−c · (x − d))`    |
| T3 (Type III) | `y = a − b · exp(c · (x − d))`     |
| T4 (Type IV)  | `y = a − b · arctan(c · (x − d))`  |

For each model I return the fitted parameters, SSE, RMSE, the slope I defined as
`|f(3) − f(−3)| / 6` (the paper's definition), a smooth curve for plotting, and
the fitted values at the 7 original positions. The classification block reports
which model wins by SSE and by RMSE.

On the frontend I draw all four curves plus the measured points in a single
Recharts chart, show a card with the best-model summary (slope, fixation
disparity at x = 0, associated phoria), and let the user export the chart as PNG
or a PDF clinical report.

---

## Tech stack

I only used technologies actually present in the repository.

**Backend** — Python, [FastAPI](https://fastapi.tiangolo.com/),
[Pydantic](https://docs.pydantic.dev/) (validation), [NumPy](https://numpy.org/),
[GEKKO](https://gekko.readthedocs.io/) (constrained nonlinear fitting),
[slowapi](https://pypi.org/project/slowapi/) (rate limiting),
[Uvicorn](https://www.uvicorn.org/) (ASGI server), and
[Ruff](https://docs.astral.sh/ruff/) for linting/formatting.

**Frontend** — [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/),
[Vite](https://vitejs.dev/), [Recharts](https://recharts.org/),
[jsPDF](https://github.com/parallax/jsPDF), with ESLint and
[Prettier](https://prettier.io/) for quality.

I deliberately keep all model fitting on the Python backend and use the frontend
only for input, visualization, and export.

---

## Running the application

I run the two sides as separate processes.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is then at `http://localhost:8000` (Swagger UI at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api` to
`http://localhost:8000`, so the backend has to be running too. The API base URL
comes from `VITE_API_URL` (`.env.development` → `http://127.0.0.1:8000`,
`.env.production` → `/api`).

---

## Testing and quality

```bash
# backend
cd backend && pip install -r requirements-dev.txt
pytest                 # tests
ruff check .           # lint
ruff format --check .  # formatting

# frontend
cd frontend
npm test               # tests
npm run lint           # lint
npm run format:check   # formatting
```

---

## Repository layout

```
TFG-Fixation-Disparity-Curves/
├── backend/    # FastAPI app + GEKKO fitting service + pytest tests
├── frontend/   # React + TypeScript single-page app (Vite)
└── docs/       # Project documentation, technical write-up, reference paper
```

---

## Notes

- The backend is completely stateless: no database, no accounts, and no patient
  data is stored. Each request is an independent numerical computation.
- This is a decision-support tool. It performs mathematical modelling and
  classification; it does not replace clinical interpretation.

Developed by Aashish Bhusal, based on the work of Marc Argilés & Xavier Molinero
(UPC).
