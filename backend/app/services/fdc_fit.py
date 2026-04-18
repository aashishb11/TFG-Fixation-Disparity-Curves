"""
Fixation Disparity Curve fitting service.

Fits the four polynomial models described in the reference paper to a set of
seven measured fixation-disparity (y) values at the fixed vergence-demand (x)
positions [-15, -10, -5, 0, 5, 10, 15] prism diopters.

Model formulae
--------------
T1  f(x) = a + b·(x − c)³                        (cubic / sigmoidal)
T2  f(x) = a + b·exp(−c·(x − d))                 (positive exponential)
T3  f(x) = a − b·exp( c·(x − d))                 (negative exponential)
T4  f(x) = a − b·arctan(c·(x − d))               (arctangent / sigmoid)

Optimisation is performed via GEKKO (nonlinear programming, IMODE=3 steady-state
least-squares). The best model is chosen by minimum SSE; RMSE is reported
alongside for interpretability.

NOTE: DEFAULT_X must match FIXED_X_VALUES in frontend/src/constants/fdc.ts.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Literal

import numpy as np
from gekko import GEKKO

ModelType = Literal["T1", "T2", "T3", "T4"]

# Fixed vergence-demand positions shared with the frontend constant FIXED_X_VALUES.
DEFAULT_X = np.array([-15, -10, -5, 0, 5, 10, 15], dtype=float)


@dataclass
class FitResult:
    """Holds the optimised parameters and derived metrics for a single model."""

    model: ModelType
    params: Dict[str, float]
    sse: float
    rmse: float
    slope: float
    curve_points: List[Dict[str, float]]  # 200-point smooth curve for plotting
    fitted_at_x: List[float]             # model values at the 7 input x positions


# ─── Error metrics ────────────────────────────────────────────────────────────

def _sse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Sum of Squared Errors between measured and predicted values."""
    return float(np.sum((y_true - y_pred) ** 2))


def _rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Square Error — SSE normalised to the scale of the data."""
    return float(np.sqrt(_sse(y_true, y_pred) / len(y_true)))


def _fit_error(m: GEKKO, y_pred: List[Any], y_true: np.ndarray):
    """
    Builds the GEKKO SSE intermediate variable used as the objective.
    SSE is monotonic with RMSE for a fixed dataset length, so minimising
    either yields the same optimal parameters.
    """
    return m.Intermediate(
        sum((y_pred[i] - float(y_true[i])) ** 2 for i in range(len(y_true)))
    )


# ─── Curve evaluation ────────────────────────────────────────────────────────

def _build_smooth_x(x: np.ndarray, n: int = 200) -> np.ndarray:
    """Returns `n` evenly-spaced x values spanning the input domain."""
    return np.linspace(float(np.min(x)), float(np.max(x)), n)


def _eval_model(
    model: ModelType,
    x: np.ndarray,
    a: float,
    b: float,
    c: float,
    d: float,
) -> np.ndarray:
    """Evaluate a fitted model at the given x positions using numpy ufuncs."""
    if model == "T1":
        return a + b * (x - c) ** 3
    if model == "T2":
        return a + b * np.exp(-c * (x - d))
    if model == "T3":
        return a - b * np.exp(c * (x - d))
    # T4
    return a - b * np.arctan(c * (x - d))


def _compute_slope_paper(
    model: ModelType, a: float, b: float, c: float, d: float
) -> float:
    """
    Paper-defined slope descriptor: |f(3) − f(−3)| / 6.

    Evaluating at ±3 prism diopters (symmetric about zero) and dividing by
    the interval width gives a robust estimate of the curve's central slope
    that is consistent across all four model shapes.
    """
    fL = float(_eval_model(model, np.array([-3.0]), a, b, c, d)[0])
    fR = float(_eval_model(model, np.array([ 3.0]), a, b, c, d)[0])
    return abs(fR - fL) / 6.0


# ─── Single-model optimisation ────────────────────────────────────────────────

def _fit_single_model(
    model: ModelType, X: np.ndarray, Y: np.ndarray, smooth_n: int
) -> FitResult:
    """
    Optimise one FDC model to the supplied (X, Y) data via GEKKO.

    Each model has domain-specific constraints (see inline comments) derived
    from the reference paper to keep the fitted curve clinically plausible and
    the optimisation well-conditioned.
    """
    m = GEKKO(remote=False)

    a = m.Var(0)
    b = m.Var(0.1)
    c = m.Var(0.1)
    d = m.Var(0)

    if model == "T1":
        # Bound the centre of symmetry (a) and shift (c) to the plausible
        # clinical range so the cubic doesn't diverge at the measurement ends.
        a.lower, a.upper = -10, 10
        c.lower, c.upper = -10, 10
        y_pred = [a + b * (X[i] - c) ** 3 for i in range(len(X))]

    elif model == "T2":
        b.lower = 0.1   # amplitude must be positive
        c.lower = 0.1   # decay rate must be positive
        y_pred = [a + b * m.exp(-c * (X[i] - d)) for i in range(len(X))]
        # Prevent the curve from dropping below -10 arcmin at the highest demand.
        m.Equation(a + b * m.exp(-c * (X[-1] - d)) >= -10)

    elif model == "T3":
        b.lower = 0.1
        c.lower = 0.1
        y_pred = [a - b * m.exp(c * (X[i] - d)) for i in range(len(X))]
        # Prevent the curve from exceeding 10 arcmin at the lowest demand.
        m.Equation(a - b * m.exp(c * (X[0] - d)) <= 10)

    elif model == "T4":
        a.lower, a.upper = -10, 10
        d.lower, d.upper = -10, 10
        b.lower = 0.1
        c.lower = 0.1
        c.upper = 10    # prevent near-vertical arctan (effectively a step function)
        y_pred = [a - b * m.atan(c * (X[i] - d)) for i in range(len(X))]
        # Bound the curve at both ends of the measurement range.
        m.Equation(a - b * m.atan(c * (X[0]  - d)) <= 10)
        m.Equation(a - b * m.atan(c * (X[-1] - d)) >= -10)

    else:
        raise ValueError(f"Unknown model type: {model!r}")

    f = _fit_error(m, y_pred, Y)
    m.Obj(f)
    m.options.IMODE = 3   # steady-state optimisation mode
    m.solve(disp=False)

    a_v, b_v, c_v, d_v = (
        float(a.value[0]),
        float(b.value[0]),
        float(c.value[0]),
        float(d.value[0]),
    )

    y_fit = _eval_model(model, X, a_v, b_v, c_v, d_v)
    sse_val = _sse(Y, y_fit)
    rmse_val = _rmse(Y, y_fit)
    slope_val = _compute_slope_paper(model, a_v, b_v, c_v, d_v)

    Xs = _build_smooth_x(X, smooth_n)
    Ys = _eval_model(model, Xs, a_v, b_v, c_v, d_v)
    curve_points = [{"x": float(xx), "y": float(yy)} for xx, yy in zip(Xs, Ys)]

    # T1 uses three parameters (no d); all others use four.
    params = (
        {"a": a_v, "b": b_v, "c": c_v}
        if model == "T1"
        else {"a": a_v, "b": b_v, "c": c_v, "d": d_v}
    )

    return FitResult(
        model=model,
        params=params,
        sse=float(sse_val),
        rmse=float(rmse_val),
        slope=float(slope_val),
        curve_points=curve_points,
        fitted_at_x=[float(v) for v in y_fit.tolist()],
    )


# ─── Public entry point ───────────────────────────────────────────────────────

def fit_all_models(
    y: List[float],
    x: np.ndarray = DEFAULT_X,
    smooth_n: int = 200,
) -> Dict[str, Any]:
    """
    Fit all four FDC models to the provided measurements and return a
    JSON-serialisable result dict consumed by the frontend.

    Parameters
    ----------
    y       : seven measured fixation-disparity values (arcmin)
    x       : corresponding vergence-demand positions (prism diopters);
              defaults to DEFAULT_X = [-15, -10, -5, 0, 5, 10, 15]
    smooth_n: number of points in the smooth plotting curve (default 200)

    Returns
    -------
    A dict matching the ComputeResponse TypeScript type in the frontend:
    { x, measured, models: {T1, T2, T3, T4}, classification }
    """
    y_np = np.array(y, dtype=float)
    if y_np.shape != (7,):
        raise ValueError("Expected exactly 7 y values.")
    if np.any(~np.isfinite(y_np)):
        raise ValueError("All y values must be finite numbers.")

    x_np = np.array(x, dtype=float)
    if x_np.shape != (7,):
        raise ValueError("Expected exactly 7 x values.")

    results: List[FitResult] = [
        _fit_single_model(t, x_np, y_np, smooth_n)
        for t in ("T1", "T2", "T3", "T4")
    ]

    best_by_sse  = min(results, key=lambda r: r.sse).model
    best_by_rmse = min(results, key=lambda r: r.rmse).model

    return {
        "x": [float(v) for v in x_np.tolist()],
        "measured": [
            {"x": float(xx), "y": float(yy)} for xx, yy in zip(x_np, y_np)
        ],
        "models": {
            r.model: {
                "params": r.params,
                "sse": r.sse,
                "rmse": r.rmse,
                "slope": r.slope,
                "fitted_at_x": r.fitted_at_x,
                "curve": r.curve_points,
            }
            for r in results
        },
        "classification": {
            "best_by_sse":  best_by_sse,
            "best_by_rmse": best_by_rmse,
        },
    }
