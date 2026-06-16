# Fixation Disparity Curve (FDC) Modeling — Frontend

This is the frontend of the web application I built for my Final Degree Project
(TFG). It is a **React 19 + TypeScript + Vite** single-page app that lets a user
enter 7 fixation-disparity measurements, sends them to my Python backend for
fitting, and visualizes the four fitted curves (Type I–IV) together with the
measured points, the error metrics (SSE, RMSE), and the best-fit classification.

I keep this README short on purpose. The full project documentation — backend,
API, mathematics, deployment, and testing — lives in the `docs/` folder:

- **Project README:** [`../docs/README.md`](../docs/README.md)
- **Technical documentation (thesis-oriented):** [`../docs/fdc-technical-documentation.md`](../docs/fdc-technical-documentation.md)

---

## Quick start

```bash
# install dependencies
npm install

# start the dev server (default http://localhost:5173)
npm run dev
```

The dev server proxies `/api` to `http://localhost:8000` (see `vite.config.ts`), so
I also run the backend (`uvicorn app.main:app --reload --port 8000` from
`../backend`). The API base URL comes from `VITE_API_URL`
(`.env.development` → `http://127.0.0.1:8000`, `.env.production` → `/api`).

## Scripts

| Script                  | Command                 | Purpose                             |
| ----------------------- | ----------------------- | ----------------------------------- |
| `npm run dev`           | `vite`                  | Dev server with HMR.                |
| `npm run build`         | `tsc -b && vite build`  | Type-check then build into `dist/`. |
| `npm run preview`       | `vite preview`          | Serve the production build locally. |
| `npm run lint`          | `eslint .`              | Lint the sources.                   |
| `npm run format`        | `prettier --write .`    | Format the sources with Prettier.   |
| `npm run format:check`  | `prettier --check .`    | Verify formatting without writing.  |
| `npm test`              | `vitest run`            | Run the test suite once.            |
| `npm run test:watch`    | `vitest`                | Tests in watch mode.                |
| `npm run test:coverage` | `vitest run --coverage` | Tests with coverage.                |

## How the frontend is organised

- `src/api/fdc.ts` — my API client; `POST {VITE_API_URL}/v1/compute`.
- `src/components/` — UI: `InputPanel`, `CurveChart`, `ClassificationCard`,
  `AdvancedMetricsSection`, `MetricsTable`, export dialogs, header/footer.
- `src/lib/` — pure logic (no React): `chart`, `classification`, `clinicalSummary`,
  `input`, `chartHover`, `chartAnnotations`, `exportChart`, `pdfReport`.
- `src/constants/fdc.ts` — fixed x positions, axis domain, model labels/colors.
- `src/types/fdc.ts` — shared TypeScript types mirroring the API response.

I deliberately keep all model fitting on the backend; the frontend only sends
inputs, receives results, and derives presentation-level values. See the technical
documentation linked above for the full design rationale.
