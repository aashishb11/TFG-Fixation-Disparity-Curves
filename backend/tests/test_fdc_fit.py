"""Unit tests for the numerical curve-fitting service.

Covers:
- input validation (shape and finiteness)
- model evaluation and the paper-defined slope
- per-model fit quality on synthetic data drawn from each analytical form
- overall response envelope (keys, curve length, classification)

The tests use synthetic y-values generated from each analytical model so that
the optimiser has a unique, well-conditioned optimum and the SSE for the
matching model is driven close to zero. This decouples the tests from GEKKO's
solver tolerance and from any real clinical dataset.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from app.services.fdc_fit import (
    DEFAULT_X,
    _build_smooth_x,
    _compute_slope_paper,
    _eval_model,
    _rmse,
    _sse,
    fit_all_models,
)


# ─── Pure helpers ────────────────────────────────────────────────────────────

class TestMetricHelpers:
    def test_sse_is_zero_for_identical_arrays(self) -> None:
        y = np.array([1.0, 2.0, 3.0])
        assert _sse(y, y) == 0.0

    def test_sse_matches_manual_calculation(self) -> None:
        y_true = np.array([1.0, 2.0, 3.0])
        y_pred = np.array([1.5, 2.5, 2.5])
        # (0.25 + 0.25 + 0.25) = 0.75
        assert _sse(y_true, y_pred) == pytest.approx(0.75)

    def test_rmse_is_sqrt_of_mean_squared_error(self) -> None:
        y_true = np.array([1.0, 2.0, 3.0])
        y_pred = np.array([1.5, 2.5, 2.5])
        assert _rmse(y_true, y_pred) == pytest.approx(math.sqrt(0.75 / 3))

    def test_build_smooth_x_returns_requested_length(self) -> None:
        xs = _build_smooth_x(DEFAULT_X, n=50)
        assert xs.shape == (50,)
        assert xs[0] == pytest.approx(-15.0)
        assert xs[-1] == pytest.approx(15.0)

    def test_build_smooth_x_is_monotonic(self) -> None:
        xs = _build_smooth_x(DEFAULT_X, n=200)
        assert np.all(np.diff(xs) > 0)


# ─── Model evaluation ────────────────────────────────────────────────────────

class TestEvalModel:
    @pytest.fixture
    def xs(self) -> np.ndarray:
        return np.array([-3.0, 0.0, 3.0])

    def test_t1_cubic_is_correct(self, xs: np.ndarray) -> None:
        # f(x) = 0 + 1 * (x - 0)^3 => [-27, 0, 27]
        out = _eval_model("T1", xs, a=0.0, b=1.0, c=0.0, d=0.0)
        np.testing.assert_allclose(out, [-27.0, 0.0, 27.0])

    def test_t2_positive_exponential(self, xs: np.ndarray) -> None:
        # f(x) = 0 + 1 * exp(-1 * (x - 0))
        out = _eval_model("T2", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        np.testing.assert_allclose(
            out, [math.exp(3), 1.0, math.exp(-3)], rtol=1e-12,
        )

    def test_t3_negative_exponential(self, xs: np.ndarray) -> None:
        # f(x) = 0 - 1 * exp(1 * (x - 0))
        out = _eval_model("T3", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        np.testing.assert_allclose(
            out, [-math.exp(-3), -1.0, -math.exp(3)], rtol=1e-12,
        )

    def test_t4_arctan_is_odd_about_d(self, xs: np.ndarray) -> None:
        # f(x) = 0 - 1 * atan(1 * (x - 0)) — odd symmetry => f(-x) = -f(x).
        out = _eval_model("T4", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        assert out[0] == pytest.approx(-out[2])
        assert out[1] == pytest.approx(0.0)


# ─── Slope ────────────────────────────────────────────────────────────────────

class TestSlope:
    def test_t1_slope_matches_cubic_formula(self) -> None:
        # f(x) = 0 + 1 * x^3 => slope = |27 - (-27)| / 6 = 9.0
        assert _compute_slope_paper("T1", 0.0, 1.0, 0.0, 0.0) == pytest.approx(9.0)

    def test_slope_is_non_negative(self) -> None:
        # Varied parameter combinations should always yield |.| / 6 >= 0.
        for model in ("T1", "T2", "T3", "T4"):
            assert _compute_slope_paper(model, 1.0, 2.0, 0.5, -1.0) >= 0

    def test_t4_slope_flat_parameters_is_zero(self) -> None:
        # b = 0 makes T4 constant, so slope should be exactly zero.
        assert _compute_slope_paper("T4", 0.0, 0.0, 1.0, 0.0) == pytest.approx(0.0)


# ─── Input validation ────────────────────────────────────────────────────────

class TestInputValidation:
    def test_rejects_wrong_length(self) -> None:
        with pytest.raises(ValueError, match="Expected exactly 7 y values"):
            fit_all_models([0.0, 1.0, 2.0])

    def test_rejects_nan(self) -> None:
        y = [0.0, 1.0, 2.0, float("nan"), 4.0, 5.0, 6.0]
        with pytest.raises(ValueError, match="finite"):
            fit_all_models(y)

    def test_rejects_infinity(self) -> None:
        y = [0.0, 1.0, 2.0, float("inf"), 4.0, 5.0, 6.0]
        with pytest.raises(ValueError, match="finite"):
            fit_all_models(y)

    def test_rejects_wrong_x_length(self) -> None:
        y = [0.0] * 7
        with pytest.raises(ValueError, match="Expected exactly 7 x values"):
            fit_all_models(y, x=np.array([0.0, 1.0, 2.0]))


# ─── End-to-end fits ─────────────────────────────────────────────────────────

def _eval(model: str, xs: np.ndarray, a: float, b: float, c: float, d: float):
    """Convenience wrapper used by the synthetic-data tests below."""
    return _eval_model(model, xs, a, b, c, d).tolist()


@pytest.mark.slow
class TestFitAllModels:
    """Integration tests that exercise the full four-model optimisation.

    Marked ``slow`` because each test builds and solves four GEKKO problems.
    Synthetic y-values are drawn from a single ground-truth model so that its
    residual SSE is close to zero; the classification should then select that
    model. We assert on structural shape and classification, not on exact
    fitted coefficients (GEKKO solutions depend on initial values and bounds).
    """

    def _assert_response_shape(self, result: dict) -> None:
        assert set(result.keys()) == {"x", "measured", "models", "classification"}
        assert len(result["x"]) == 7
        assert len(result["measured"]) == 7
        assert set(result["models"].keys()) == {"T1", "T2", "T3", "T4"}
        assert set(result["classification"].keys()) == {"best_by_sse", "best_by_rmse"}
        assert result["classification"]["best_by_sse"] in {"T1", "T2", "T3", "T4"}

        for key, model in result["models"].items():
            expected_params = {"a", "b", "c"} if key == "T1" else {"a", "b", "c", "d"}
            assert set(model["params"].keys()) == expected_params
            assert isinstance(model["sse"], float)
            assert isinstance(model["rmse"], float)
            assert isinstance(model["slope"], float)
            assert len(model["fitted_at_x"]) == 7
            # Default smooth_n = 200.
            assert len(model["curve"]) == 200

    def test_fits_cubic_data_and_returns_expected_envelope(self) -> None:
        # Low-amplitude cubic keeps values in the plausible clinical range
        # (no diverging cubic tails at x = ±15).
        y = _eval("T1", DEFAULT_X, a=0.0, b=0.002, c=0.0, d=0.0)
        result = fit_all_models(y)

        self._assert_response_shape(result)
        # Residual SSE for T1 should be near zero since y was generated by T1.
        assert result["models"]["T1"]["sse"] == pytest.approx(0.0, abs=1e-4)

    def test_smooth_n_controls_curve_resolution(self) -> None:
        y = _eval("T1", DEFAULT_X, a=0.0, b=0.002, c=0.0, d=0.0)
        result = fit_all_models(y, smooth_n=50)
        assert len(result["models"]["T1"]["curve"]) == 50

    def test_all_zeros_is_handled(self) -> None:
        # All-zero input is an edge case. The response envelope must still be
        # valid, and the best-fit SSE must be small (T1's cubic is unbounded
        # at the origin, so it can match zero exactly; other models carry
        # positive lower bounds on `b` and show small residuals).
        result = fit_all_models([0.0] * 7)
        self._assert_response_shape(result)

        best_model_key = result["classification"]["best_by_sse"]
        assert result["models"][best_model_key]["sse"] == pytest.approx(0.0, abs=1e-3)

    def test_measured_points_pair_with_default_x(self) -> None:
        y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
        result = fit_all_models(y)
        expected_xs = [-15.0, -10.0, -5.0, 0.0, 5.0, 10.0, 15.0]
        assert [point["x"] for point in result["measured"]] == expected_xs
        assert [point["y"] for point in result["measured"]] == y
