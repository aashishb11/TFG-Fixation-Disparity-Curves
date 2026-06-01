import { describe, expect, it } from "vitest";
import { computeErrorPct, getCompatibleClassifications } from "./classification";
import type { ComputeResponse, ModelMetrics, Point } from "../types/fdc";

function makeModel(rmse: number): ModelMetrics {
  return { params: {}, sse: rmse * rmse, rmse, slope: 0, fitted_at_x: [], curve: [] };
}

function makeResponse(
  rmses: [number, number, number, number],
  measured: Point[] = [
    { x: -3, y: -10 },
    { x: 0, y: 0 },
    { x: 3, y: 10 },
  ],
  bestKey: "T1" | "T2" | "T3" | "T4" = "T1",
): ComputeResponse {
  const [r1, r2, r3, r4] = rmses;
  return {
    x: [-3, 0, 3],
    measured,
    models: { T1: makeModel(r1), T2: makeModel(r2), T3: makeModel(r3), T4: makeModel(r4) },
    classification: { best_by_sse: bestKey, best_by_rmse: bestKey },
  };
}

describe("computeErrorPct", () => {
  it("returns NRMSE percentage for normal data", () => {
    // yRange = 20, rmse = 1.0 → 5%
    const measured: Point[] = [{ x: -3, y: -10 }, { x: 0, y: 0 }, { x: 3, y: 10 }];
    expect(computeErrorPct(1.0, measured)).toBeCloseTo(5);
  });

  it("returns 100 when yRange is effectively zero (degenerate flat data)", () => {
    const measured: Point[] = [{ x: -1, y: 3 }, { x: 0, y: 3 }, { x: 1, y: 3 }];
    expect(computeErrorPct(0.1, measured)).toBe(100);
  });

  it("returns 100 when measured array is empty", () => {
    expect(computeErrorPct(0.5, [])).toBe(100);
  });

  it("scales linearly with rmse", () => {
    const measured: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 10 }];
    expect(computeErrorPct(2, measured)).toBeCloseTo(20);
    expect(computeErrorPct(0.5, measured)).toBeCloseTo(5);
  });
});

describe("getCompatibleClassifications", () => {
  // measured yRange = 20 → 10% threshold means rmse < 2.0

  it("returns all models under the threshold, sorted ascending by errorPct", () => {
    // T1: 5%, T2: 7.5%, T3: 2.5% — T4: 15% excluded
    const result = getCompatibleClassifications(makeResponse([1.0, 1.5, 0.5, 3.0]));
    expect(result).toHaveLength(3);
    expect(result[0].modelKey).toBe("T3"); // 2.5%
    expect(result[1].modelKey).toBe("T1"); // 5%
    expect(result[2].modelKey).toBe("T2"); // 7.5%
  });

  it("includes correct errorPct values", () => {
    const result = getCompatibleClassifications(makeResponse([1.0, 1.5, 0.5, 3.0]));
    expect(result.find((r) => r.modelKey === "T1")?.errorPct).toBeCloseTo(5);
    expect(result.find((r) => r.modelKey === "T3")?.errorPct).toBeCloseTo(2.5);
  });

  it("marks the best_by_sse model as isBest=true", () => {
    const result = getCompatibleClassifications(makeResponse([1.0, 1.5, 0.5, 3.0]));
    expect(result.find((r) => r.modelKey === "T1")?.isBest).toBe(true);
    expect(result.find((r) => r.modelKey === "T3")?.isBest).toBe(false);
  });

  it("returns empty array when no model qualifies", () => {
    // All rmses / 20 > 10%
    const result = getCompatibleClassifications(makeResponse([5.0, 6.0, 7.0, 8.0]));
    expect(result).toHaveLength(0);
  });

  it("returns only one model when exactly one qualifies", () => {
    const result = getCompatibleClassifications(makeResponse([0.5, 5.0, 6.0, 7.0]));
    expect(result).toHaveLength(1);
    expect(result[0].modelKey).toBe("T1");
    expect(result[0].isBest).toBe(true);
  });

  it("accepts a custom threshold", () => {
    // threshold=15% → rmse < 3.0 → T1(5%), T2(12.5%) qualify; T3(30%), T4(35%) excluded
    const result = getCompatibleClassifications(makeResponse([1.0, 2.5, 6.0, 7.0]), 15);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.modelKey)).toContain("T1");
    expect(result.map((r) => r.modelKey)).toContain("T2");
  });

  it("marks isBest=false when best model is not in the compatible list", () => {
    // best is T1 but T1 has rmse=5 (25%) → not compatible; only T2 qualifies
    const result = getCompatibleClassifications(makeResponse([5.0, 1.0, 5.0, 5.0], undefined, "T1"));
    expect(result).toHaveLength(1);
    expect(result[0].modelKey).toBe("T2");
    expect(result[0].isBest).toBe(false);
  });
});
