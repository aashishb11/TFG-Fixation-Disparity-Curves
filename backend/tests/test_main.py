"""HTTP tests for the FastAPI routes.

Uses TestClient so we don't need to start a real uvicorn server.
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
        response = client.get("/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestComputeEndpointValidation:
    """Input validation tests, these don't need the GEKKO solver to run."""

    def test_rejects_missing_body(self, client: TestClient) -> None:
        response = client.post("/v1/compute")
        assert response.status_code == 422

    def test_rejects_wrong_length(self, client: TestClient) -> None:
        # pydantic conlist rejects arrays with wrong length with 422
        response = client.post("/v1/compute", json={"y": [1.0, 2.0]})
        assert response.status_code == 422

    def test_rejects_non_numeric_value(self, client: TestClient) -> None:
        response = client.post(
            "/v1/compute",
            json={"y": [0.0, 0.0, 0.0, "not-a-number", 0.0, 0.0, 0.0]},
        )
        assert response.status_code == 422

    def test_returns_400_for_non_finite_values(self, client: TestClient) -> None:
        # JSON doesn't have a real Infinity literal, so we send the raw string
        # pydantic v2 may accept or reject it - either way we expect 400 or 422
        response = client.post(
            "/v1/compute",
            data='{"y": [0.0, 0.0, 0.0, Infinity, 0.0, 0.0, 0.0]}',
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code in (400, 422)


@pytest.mark.slow
class TestComputeEndpointSuccess:
    """Full integration test that actually runs the GEKKO solver."""

    def test_returns_full_envelope_for_valid_input(self, client: TestClient) -> None:
        response = client.post(
            "/v1/compute",
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
