# Models and error metrics

This is a short, first-person note on the mathematics I implemented. For the full
thesis-oriented treatment (constraints, optimisation method, code references, and
verification checklist) see
[`fdc-technical-documentation.md`](fdc-technical-documentation.md), Sections 7–8.

## The four models

I fit four type-specific models to the 7 measured fixation-disparity values, one
per classical FDC curve type. The equations below are exactly the ones I evaluate
in [`../backend/app/services/fdc_fit.py`](../backend/app/services/fdc_fit.py)
(`_eval_model`):

| Model | UI label | Equation | Parameters |
|-------|----------|----------|------------|
| T1 | Type I | `y = a + b·(x − c)³` | a, b, c |
| T2 | Type II | `y = a + b·exp(−c·(x − d))` | a, b, c, d |
| T3 | Type III | `y = a − b·exp(c·(x − d))` | a, b, c, d |
| T4 | Type IV | `y = a − b·arctan(c·(x − d))` | a, b, c, d |

I chose these forms because each one matches the shape of a specific curve type
from the reference paper: the cubic for the symmetric Type I, the two exponentials
for the asymmetric Types II and III, and the arctangent for the flat, saturating
Type IV. I solve each fit with GEKKO under per-model parameter bounds and
inequality constraints that keep the fitted curve in a physiologically plausible
range (roughly ±10 arcmin at the extremes of the measurement window).

> `TODO: verify` that the exact constraint values I used match the
> clinically-derived constraints in Argilés et al. (2025) before citing them as
> the paper's.

## Error metrics

For every model I compute, against the 7 measured points:

- **SSE** — sum of squared residuals, `Σ (yᵢ − ŷᵢ)²`.
- **RMSE** — `sqrt(SSE / n)` with `n = 7`.

I also report a **slope descriptor** defined as `|f(3) − f(−3)| / 6` — the absolute
change in the fitted curve over the central ±3 prism-diopter interval, divided by
its width. Evaluating every model the same way makes the slope comparable across
curve types.

## How I pick the best model

I select the winner by **minimum error**, independently for SSE and RMSE
(`best_by_sse` and `best_by_rmse`). The frontend treats `best_by_sse` as the
primary classification. On the frontend I additionally compute a normalised error
(NRMSE = `rmse / yRange × 100`) and flag every model below a 10 % threshold as
"compatible", so the UI can show when more than one model plausibly explains the
data.

The selection is therefore objective and reproducible: it is driven by the numbers,
not by a visual judgement of the curve shape.
