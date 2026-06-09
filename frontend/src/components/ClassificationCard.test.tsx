import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ComputeResponse, ModelMetrics } from "../types/fdc";
import { ClassificationCard } from "./ClassificationCard";

function model(overrides: Partial<ModelMetrics> = {}): ModelMetrics {
  return {
    params: { a: 0, b: 0, c: 0, d: 0 },
    sse: 1,
    rmse: 1,
    slope: 1,
    fitted_at_x: [0, 0, 0, 0, 0, 0, 0],
    curve: [],
    ...overrides,
  };
}

function buildResult(): ComputeResponse {
  return {
    x: [-15, -10, -5, 0, 5, 10, 15],
    measured: [
      { x: -15, y: 10 },
      { x: -10, y: 5 },
      { x: -5, y: 0 },
      { x: 0, y: 2.5 },
      { x: 5, y: 0 },
      { x: 10, y: -5 },
      { x: 15, y: -10 },
    ],
    models: {
      T1: model({ slope: 0.5 }),
      T2: model({ slope: 0.6 }),
      T3: model({ slope: 0.7 }),
      T4: model({ slope: 0.8 }),
    },
    classification: { best_by_sse: "T2", best_by_rmse: "T2" },
  };
}

describe("ClassificationCard", () => {
  it("shows a placeholder until a result is available", () => {
    render(<ClassificationCard result={null} />);
    expect(
      screen.getByText(/Run analysis to populate the clinical summary/i),
    ).toBeInTheDocument();
  });

  it("shows only the best curve type (best_by_sse)", () => {
    const result = buildResult(); // best_by_sse = T2
    render(<ClassificationCard result={result} />);
    expect(screen.getByText("Type II")).toBeInTheDocument();
    expect(screen.queryByText("Type I")).not.toBeInTheDocument();
    expect(screen.queryByText("Type III")).not.toBeInTheDocument();
    expect(screen.queryByText("Type IV")).not.toBeInTheDocument();
  });

  it("shows the NRMSE for the best type", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} />);
    // rmse=1, yRange=20 → 5.0%
    expect(screen.getByText(/NRMSE 5\.0%/i)).toBeInTheDocument();
  });

  it("shows the selected-model slope from best_by_sse", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} />);
    // Slope for T2 (best_by_sse) = 0.6 at 3-decimal precision.
    expect(screen.getByText("0.600")).toBeInTheDocument();
  });

  it("shows the measured fixation disparity at x = 0", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} />);
    // FD = measured y at x = 0 = 2.5.
    expect(screen.getByText("2.500")).toBeInTheDocument();
  });

  it("shows the nearest associated phoria (smallest non-zero x with y = 0)", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} />);
    // measured has y=0 at x=-5 and x=5; the smallest |x| is 5 (−5 comes first
    // in the reducer so it wins the tie).
    expect(screen.getByText("-5.000")).toBeInTheDocument();
  });
});
