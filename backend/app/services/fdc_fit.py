from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Literal
import numpy as np
from gekko import GEKKO

ModelType = Literal["T1", "T2", "T3", "T4"]

DEFAULT_X = np.array([-15, -10, -5, 0, 5, 10, 15], dtype=float)

@dataclass
class FitResult:
    model: ModelType
    params: Dict[str, float]
    sse: float
    rmse: float
    slope: float
    curve_points: List[Dict[str, float]]
    fitted_at_x: List[float]


def _sse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sum((y_true - y_pred) ** 2))


def _rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(_sse(y_true, y_pred) / len(y_true)))


def _fit_error(m: GEKKO, y_pred: List[Any], y_true: np.ndarray):
    # SSE objective (monotonic with RMSE, but we also return RMSE for display)
    return m.Intermediate(sum((y_pred[i] - float(y_true[i])) ** 2 for i in range(len(y_true))))


def _build_smooth_x(x: np.ndarray, n: int = 200) -> np.ndarray:
    return np.linspace(float(np.min(x)), float(np.max(x)), n)


def fit_all_models(
    y: List[float],
    x: np.ndarray = DEFAULT_X,
    smooth_n: int = 200,
) -> Dict[str, Any]:
    y_np = np.array(y, dtype=float)
    if y_np.shape != (7,):
        raise ValueError("Expected exactly 7 y values.")
    if np.any(~np.isfinite(y_np)):
        raise ValueError("All y values must be finite numbers.")

    x_np = np.array(x, dtype=float)
    if x_np.shape != (7,):
        raise ValueError("Expected exactly 7 x values.")

    results: List[FitResult] = []
    for t in ["T1", "T2", "T3", "T4"]:
        results.append(_fit_single_model(t, x_np, y_np, smooth_n))

    best_by_sse = min(results, key=lambda r: r.sse).model
    best_by_rmse = min(results, key=lambda r: r.rmse).model

    return {
        "x": [float(v) for v in x_np.tolist()],
        "measured": [{"x": float(xx), "y": float(yy)} for xx, yy in zip(x_np, y_np)],
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
            "best_by_sse": best_by_sse,
            "best_by_rmse": best_by_rmse,
        },
    }


def _eval_model(model: ModelType, x: np.ndarray, a: float, b: float, c: float, d: float) -> np.ndarray:
    if model == "T1":
        # a + b*(x - c)^3
        return a + b * (x - c) ** 3
    if model == "T2":
        # a + b*exp(-c*(x - d))
        return a + b * np.exp(-c * (x - d))
    if model == "T3":
        # a - b*exp(c*(x - d))
        return a - b * np.exp(c * (x - d))
    # T4: a - b*atan(c*(x - d))
    return a - b * np.arctan(c * (x - d))


def _compute_slope_paper(model: ModelType, a: float, b: float, c: float, d: float) -> float:
    # Paper definition: |f(3) - f(-3)| / 6
    xL, xR = -3.0, 3.0
    fL = float(_eval_model(model, np.array([xL]), a, b, c, d)[0])
    fR = float(_eval_model(model, np.array([xR]), a, b, c, d)[0])
    return abs(fR - fL) / 6.0


def _fit_single_model(model: ModelType, X: np.ndarray, Y: np.ndarray, smooth_n: int) -> FitResult:
    m = GEKKO(remote=False)

    a = m.Var(0)
    b = m.Var(0.1)
    c = m.Var(0.1)
    d = m.Var(0)

    if model == "T1":
        # constraints for center of symmetry: -10 <= a <= 10 and -10 <= c <= 10
        a.lower, a.upper = -10, 10
        c.lower, c.upper = -10, 10
        y_pred = [a + b * (X[i] - c) ** 3 for i in range(len(X))]

    elif model == "T2":
        b.lower = 0.1
        c.lower = 0.1
        y_pred = [a + b * m.exp(-c * (X[i] - d)) for i in range(len(X))]
        # f2(x_max) >= -10
        m.Equation(a + b * m.exp(-c * (X[-1] - d)) >= -10)

    elif model == "T3":
        b.lower = 0.1
        c.lower = 0.1
        y_pred = [a - b * m.exp(c * (X[i] - d)) for i in range(len(X))]
        # f3(x_min) <= 10
        m.Equation(a - b * m.exp(c * (X[0] - d)) <= 10)

    elif model == "T4":
        # -10 <= a <= 10 and -10 <= d <= 10
        a.lower, a.upper = -10, 10
        d.lower, d.upper = -10, 10
        b.lower = 0.1
        c.lower = 0.1
        c.upper = 10
        y_pred = [a - b * m.atan(c * (X[i] - d)) for i in range(len(X))]
        # -10 <= f4(x) <= 10 (enforced at ends)
        m.Equation(a - b * m.atan(c * (X[0] - d)) <= 10)
        m.Equation(a - b * m.atan(c * (X[-1] - d)) >= -10)

    else:
        raise ValueError("Unknown model type")

    f = _fit_error(m, y_pred, Y)
    m.Obj(f)
    m.options.IMODE = 3
    m.solve(disp=False)

    a_v = float(a.value[0])
    b_v = float(b.value[0])
    c_v = float(c.value[0])
    d_v = float(d.value[0])

    # Evaluate fit at the 7 X points
    y_fit = _eval_model(model, X, a_v, b_v, c_v, d_v)
    sse_val = _sse(Y, y_fit)
    rmse_val = _rmse(Y, y_fit)

    # Paper slope
    slope_val = _compute_slope_paper(model, a_v, b_v, c_v, d_v)

    # Smooth curve for plotting
    Xs = _build_smooth_x(X, smooth_n)
    Ys = _eval_model(model, Xs, a_v, b_v, c_v, d_v)
    curve_points = [{"x": float(xx), "y": float(yy)} for xx, yy in zip(Xs, Ys)]

    # Params output: match tutor naming (T1 uses a,b,c; others a,b,c,d)
    if model == "T1":
        params = {"a": a_v, "b": b_v, "c": c_v}
    else:
        params = {"a": a_v, "b": b_v, "c": c_v, "d": d_v}

    return FitResult(
        model=model,
        params=params,
        sse=float(sse_val),
        rmse=float(rmse_val),
        slope=float(slope_val),
        curve_points=curve_points,
        fitted_at_x=[float(v) for v in y_fit.tolist()],
    )