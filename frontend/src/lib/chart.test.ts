import { describe, expect, it } from "vitest";

import type { ComputeResponse, ModelMetrics } from "../types/fdc";
import { mergeModelCurves } from "./chart";

function makeModel(values: Array<[number, number]>): ModelMetrics {
  return {
    params: { a: 0, b: 0, c: 0, d: 0 },
    sse: 0,
    rmse: 0,
    slope: 0,
    fitted_at_x: values.map(([, y]) => y),
    curve: values.map(([x, y]) => ({ x, y })),
  };
}

function makeResponse(): ComputeResponse {
  return {
    x: [-1, 0, 1],
    measured: [
      { x: -1, y: 10 },
      { x: 0, y: 20 },
      { x: 1, y: 30 },
    ],
    models: {
      T1: makeModel([
        [-1, 1],
        [0, 2],
        [1, 3],
      ]),
      T2: makeModel([
        [-1, 10],
        [0, 20],
        [1, 30],
      ]),
      T3: makeModel([
        [-1, 100],
        [0, 200],
        [1, 300],
      ]),
      T4: makeModel([
        [-1, 1000],
        [0, 2000],
        [1, 3000],
      ]),
    },
    classification: { best_by_sse: "T1", best_by_rmse: "T1" },
  };
}

describe("mergeModelCurves", () => {
  it("returns an empty array for null input", () => {
    expect(mergeModelCurves(null)).toEqual([]);
  });

  it("joins the four model curves by shared x", () => {
    const merged = mergeModelCurves(makeResponse());
    expect(merged).toEqual([
      { x: -1, T1: 1, T2: 10, T3: 100, T4: 1000 },
      { x: 0, T1: 2, T2: 20, T3: 200, T4: 2000 },
      { x: 1, T1: 3, T2: 30, T3: 300, T4: 3000 },
    ]);
  });

  it("truncates to the shortest curve length", () => {
    const response = makeResponse();
    // Shrink T3's curve to two points — merged output should follow suit.
    response.models.T3 = makeModel([
      [-1, 100],
      [0, 200],
    ]);

    const merged = mergeModelCurves(response);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toEqual({ x: 0, T1: 2, T2: 20, T3: 200, T4: 2000 });
  });
});
