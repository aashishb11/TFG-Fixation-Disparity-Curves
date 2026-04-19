import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ComputeResponse, ModelMetrics } from "../types/fdc";
import { MetricsTable } from "./MetricsTable";

function model(sse: number, rmse: number, slope: number): ModelMetrics {
  return {
    params: { a: 0, b: 0, c: 0, d: 0 },
    sse,
    rmse,
    slope,
    fitted_at_x: [0, 0, 0, 0, 0, 0, 0],
    curve: [],
  };
}

function buildResult(): ComputeResponse {
  return {
    x: [-15, -10, -5, 0, 5, 10, 15],
    measured: [],
    models: {
      T1: model(0.123, 0.111, 0.5),
      T2: model(0.999, 0.333, 0.6),
      T3: model(1.0, 0.44, 0.7),
      T4: model(2.0, 0.55, 0.8),
    },
    classification: { best_by_sse: "T1", best_by_rmse: "T1" },
  };
}

describe("MetricsTable", () => {
  it("shows a placeholder when no result is available", () => {
    render(<MetricsTable result={null} />);
    expect(screen.getByText(/Awaiting computation/i)).toBeInTheDocument();
  });

  it("renders one row per model with fixed-precision metrics", () => {
    render(<MetricsTable result={buildResult()} />);
    expect(screen.getByText("Type I")).toBeInTheDocument();
    expect(screen.getByText("Type II")).toBeInTheDocument();
    expect(screen.getByText("Type III")).toBeInTheDocument();
    expect(screen.getByText("Type IV")).toBeInTheDocument();

    // SSE for T1 at 3-decimal precision.
    expect(screen.getByText("0.123")).toBeInTheDocument();
    // RMSE for T1 at 3-decimal precision.
    expect(screen.getByText("0.111")).toBeInTheDocument();
  });

  it("marks the best-by-SSE row with the active modifier class", () => {
    const { container } = render(<MetricsTable result={buildResult()} />);
    const activeRows = container.querySelectorAll(
      ".metric-table__row--active",
    );
    expect(activeRows).toHaveLength(1);
    expect(activeRows[0]?.textContent).toContain("Type I");
  });
});
