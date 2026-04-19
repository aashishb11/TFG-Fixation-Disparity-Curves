import { describe, expect, it } from "vitest";

import { deriveClinicalMeasurements } from "./clinicalSummary";

describe("deriveClinicalMeasurements", () => {
  it("returns nulls when no measured points are supplied", () => {
    expect(deriveClinicalMeasurements([])).toEqual({
      fixationDisparity: null,
      associatedPhoria: null,
    });
  });

  it("reads fixation disparity as the y-value at x = 0", () => {
    const result = deriveClinicalMeasurements([
      { x: -5, y: 10 },
      { x: 0, y: 4.2 },
      { x: 5, y: -1 },
    ]);
    expect(result.fixationDisparity).toBe(4.2);
  });

  it("returns null fixation disparity when no point sits at x = 0", () => {
    const result = deriveClinicalMeasurements([
      { x: -5, y: 10 },
      { x: 5, y: -1 },
    ]);
    expect(result.fixationDisparity).toBeNull();
  });

  it("picks the non-zero x with the smallest absolute value as associated phoria", () => {
    const result = deriveClinicalMeasurements([
      { x: -10, y: 0 },
      { x: -5, y: 0 },
      { x: 0, y: 4 },
      { x: 15, y: 0 },
    ]);
    expect(result.associatedPhoria).toBe(-5);
  });

  it("ignores x = 0 when looking for associated phoria", () => {
    const result = deriveClinicalMeasurements([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ]);
    expect(result.associatedPhoria).toBe(5);
  });

  it("normalises -0 to +0 in both outputs", () => {
    const result = deriveClinicalMeasurements([
      { x: -5, y: 0 },
      { x: 0, y: -0 },
    ]);
    expect(Object.is(result.fixationDisparity, -0)).toBe(false);
    expect(result.fixationDisparity).toBe(0);
    expect(result.associatedPhoria).toBe(-5);
  });
});
