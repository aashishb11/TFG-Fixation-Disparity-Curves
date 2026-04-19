"""HTTP-level tests for the FastAPI entry point.

Uses the Starlette TestClient so no live uvicorn process is needed.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


class TestHealthEndpoint:
    def test_returns_ok(self, client: TestClient) -> None:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestComputeEndpointValidation:
    """Validation behaviour that does not need the GEKKO solver."""

    def test_rejects_missing_body(self, client: TestClient) -> None:
        response = client.post("/api/v1/compute")
        assert response.status_code == 422

    def test_rejects_wrong_length(self, client: TestClient) -> None:
        # Pydantic conlist enforces the min/max length constraint => 422.
        response = client.post("/api/v1/compute", json={"y": [1.0, 2.0]})
        assert response.status_code == 422

    def test_rejects_non_numeric_value(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/compute",
            json={"y": [0.0, 0.0, 0.0, "not-a-number", 0.0, 0.0, 0.0]},
        )
        assert response.status_code == 422

    def test_returns_400_for_non_finite_values(self, client: TestClient) -> None:
        # JSON has no direct Infinity literal, so the request body is crafted
        # so Pydantic accepts it as float but the fitter rejects finite check.
        # FastAPI + pydantic v2 parses "inf" as float, which our fitter catches.
        response = client.post(
            "/api/v1/compute",
            data='{"y": [0.0, 0.0, 0.0, Infinity, 0.0, 0.0, 0.0]}',
            headers={"Content-Type": "application/json"},
        )
        # Some parsers reject the literal Infinity up-front (422). If accepted,
        # our fitter converts it into a 400 "All y values must be finite".
        assert response.status_code in (400, 422)


@pytest.mark.slow
class TestComputeEndpointSuccess:
    """Full end-to-end call that runs the GEKKO solver for all four models."""

    def test_returns_full_envelope_for_valid_input(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/compute",
            json={"y": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]},
        )
        assert response.status_code == 200
        body = response.json()

        assert set(body.keys()) == {"x", "measured", "models", "classification"}
        assert set(body["models"].keys()) == {"T1", "T2", "T3", "T4"}
        assert body["classification"]["best_by_sse"] in {"T1", "T2", "T3", "T4"}
        assert body["classification"]["best_by_rmse"] in {"T1", "T2", "T3", "T4"}
        assert len(body["x"]) == 7
        assert len(body["measured"]) == 7
