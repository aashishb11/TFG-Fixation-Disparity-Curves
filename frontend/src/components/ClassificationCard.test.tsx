import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCompatibleClassifications } from "../lib/classification";
import type { CompatibleClassification, ComputeResponse, ModelMetrics } from "../types/fdc";
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

// All four models have rmse=1, yRange=20 → errorPct=5% (all under 10%)
function buildCompatibleModels(result: ComputeResponse): CompatibleClassification[] {
  return getCompatibleClassifications(result);
}

describe("ClassificationCard", () => {
  it("shows a placeholder until a result is available", () => {
    render(<ClassificationCard result={null} compatibleModels={[]} />);
    expect(
      screen.getByText(/Run analysis to populate the clinical summary/i),
    ).toBeInTheDocument();
  });

  it("lists all compatible types when multiple are under 10%", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    // All 4 models qualify (5% each)
    expect(screen.getByText("Type I")).toBeInTheDocument();
    expect(screen.getByText("Type II")).toBeInTheDocument();
    expect(screen.getByText("Type III")).toBeInTheDocument();
    expect(screen.getByText("Type IV")).toBeInTheDocument();
  });

  it("shows a 'best' badge on the primary classification (best_by_sse)", () => {
    const result = buildResult(); // best_by_sse = T2
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    expect(screen.getByText("best")).toBeInTheDocument();
  });

  it("shows error percentages for each compatible type", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    // rmse=1, yRange=20 → 5.0%
    const errorLabels = screen.getAllByText("5.0%");
    expect(errorLabels.length).toBe(4);
  });

  it("shows 'no compatible type' message when the list is empty", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={[]} />);
    expect(
      screen.getByText(/No curve type has fitting error below 10%/i),
    ).toBeInTheDocument();
  });

  it("shows the selected-model slope from best_by_sse", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    // Slope for T2 (best_by_sse) = 0.6 at 3-decimal precision.
    expect(screen.getByText("0.600")).toBeInTheDocument();
  });

  it("shows the measured fixation disparity at x = 0", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    // FD = measured y at x = 0 = 2.5.
    expect(screen.getByText("2.500")).toBeInTheDocument();
  });

  it("shows the nearest associated phoria (smallest non-zero x with y = 0)", () => {
    const result = buildResult();
    render(<ClassificationCard result={result} compatibleModels={buildCompatibleModels(result)} />);
    // measured has y=0 at x=-5 and x=5; the smallest |x| is 5 (−5 comes first
    // in the reducer so it wins the tie).
    expect(screen.getByText("-5.000")).toBeInTheDocument();
  });
});
