"""Tests for the curve fitting service.

Covers input validation, model evaluation, the slope calculation and
end-to-end fits using synthetic data generated from each model type.

Using synthetic data means we know the expected result and can check
that the SSE is close to zero for the matching model, without needing
real clinical measurements.
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


# --- Helper functions ---

class TestMetricHelpers:
    def test_sse_is_zero_for_identical_arrays(self) -> None:
        y = np.array([1.0, 2.0, 3.0])
        assert _sse(y, y) == 0.0

    def test_sse_matches_manual_calculation(self) -> None:
        y_true = np.array([1.0, 2.0, 3.0])
        y_pred = np.array([1.5, 2.5, 2.5])
        # 0.25 + 0.25 + 0.25 = 0.75
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


# --- Model evaluation ---

class TestEvalModel:
    @pytest.fixture
    def xs(self) -> np.ndarray:
        return np.array([-3.0, 0.0, 3.0])

    def test_t1_cubic_is_correct(self, xs: np.ndarray) -> None:
        # f(x) = 0 + 1*(x-0)^3, so at x=-3,0,3 we get [-27, 0, 27]
        out = _eval_model("T1", xs, a=0.0, b=1.0, c=0.0, d=0.0)
        np.testing.assert_allclose(out, [-27.0, 0.0, 27.0])

    def test_t2_positive_exponential(self, xs: np.ndarray) -> None:
        # f(x) = 0 + 1*exp(-1*(x-0))
        out = _eval_model("T2", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        np.testing.assert_allclose(
            out, [math.exp(3), 1.0, math.exp(-3)], rtol=1e-12,
        )

    def test_t3_negative_exponential(self, xs: np.ndarray) -> None:
        # f(x) = 0 - 1*exp(1*(x-0))
        out = _eval_model("T3", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        np.testing.assert_allclose(
            out, [-math.exp(-3), -1.0, -math.exp(3)], rtol=1e-12,
        )

    def test_t4_arctan_is_odd_about_d(self, xs: np.ndarray) -> None:
        # arctan is odd so f(-x) = -f(x) when a=0 and d=0
        out = _eval_model("T4", xs, a=0.0, b=1.0, c=1.0, d=0.0)
        assert out[0] == pytest.approx(-out[2])
        assert out[1] == pytest.approx(0.0)


# --- Slope ---

class TestSlope:
    def test_t1_slope_matches_cubic_formula(self) -> None:
        # f(x) = 1*x^3, slope = |27-(-27)| / 6 = 9.0
        assert _compute_slope_paper("T1", 0.0, 1.0, 0.0, 0.0) == pytest.approx(9.0)

    def test_slope_is_non_negative(self) -> None:
        # slope uses absolute value so it should always be >= 0
        for model in ("T1", "T2", "T3", "T4"):
            assert _compute_slope_paper(model, 1.0, 2.0, 0.5, -1.0) >= 0

    def test_t4_slope_flat_parameters_is_zero(self) -> None:
        # with b=0 T4 is a constant function so the slope is zero
        assert _compute_slope_paper("T4", 0.0, 0.0, 1.0, 0.0) == pytest.approx(0.0)


# --- Input validation ---

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


# --- End-to-end fits ---

def _eval(model: str, xs: np.ndarray, a: float, b: float, c: float, d: float):
    """Small wrapper to generate synthetic y-values for the tests below."""
    return _eval_model(model, xs, a, b, c, d).tolist()


@pytest.mark.slow
class TestFitAllModels:
    """Full integration tests - runs GEKKO for all 4 models so they take a bit longer.

    Synthetic y-values are generated from a known model so we can verify
    the SSE is close to zero for the matching model. We only check the
    structure and classification, not exact parameter values since those
    depends on solver tolerances and initial conditions.
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
            # smooth_n defaults to 200
            assert len(model["curve"]) == 200

    def test_fits_cubic_data_and_returns_expected_envelope(self) -> None:
        # low amplitude so the cubic doesn't blow up at the ends (x = +/-15)
        y = _eval("T1", DEFAULT_X, a=0.0, b=0.002, c=0.0, d=0.0)
        result = fit_all_models(y)

        self._assert_response_shape(result)
        # SSE for T1 should be basically zero since the data came from T1
        assert result["models"]["T1"]["sse"] == pytest.approx(0.0, abs=1e-4)

    def test_smooth_n_controls_curve_resolution(self) -> None:
        y = _eval("T1", DEFAULT_X, a=0.0, b=0.002, c=0.0, d=0.0)
        result = fit_all_models(y, smooth_n=50)
        assert len(result["models"]["T1"]["curve"]) == 50

    def test_all_zeros_is_handled(self) -> None:
        # all zeros is an edge case but the result should still be valid
        # T1 can match it exactly since there's no lower bound on b for cubic
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
