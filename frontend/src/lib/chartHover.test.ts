import { describe, expect, it } from "vitest";

import type { HoverSnapshot, MergedCurvePoint, Point } from "../types/fdc";
import {
  areHoverSnapshotsEqual,
  getHoverSnapshotFromX,
  getMeasuredValueAtX,
  getNearestMeasuredPoint,
  pixelRatioToAxisX,
} from "./chartHover";

const measured: Point[] = [
  { x: -15, y: 10 },
  { x: -10, y: 8 },
  { x: 0, y: 0 },
  { x: 10, y: -5 },
];

const data: MergedCurvePoint[] = [
  { x: -10, T1: 1, T2: 2, T3: 3, T4: 4 },
  { x: 0, T1: 5, T2: 6, T3: 7, T4: 8 },
  { x: 10, T1: 9, T2: 10, T3: 11, T4: 12 },
];

describe("pixelRatioToAxisX", () => {
  it("maps ratio 0 to the left edge of the domain", () => {
    expect(pixelRatioToAxisX(0)).toBe(-20);
  });

  it("maps ratio 1 to the right edge of the domain", () => {
    expect(pixelRatioToAxisX(1)).toBe(20);
  });

  it("maps ratio 0.5 to the centre", () => {
    expect(pixelRatioToAxisX(0.5)).toBe(0);
  });
});

describe("getMeasuredValueAtX", () => {
  it("returns the y-value for an exact measured x", () => {
    expect(getMeasuredValueAtX(measured, 0)).toBe(0);
  });

  it("returns the y-value when within the hover threshold", () => {
    expect(getMeasuredValueAtX(measured, -15.4)).toBe(10);
  });

  it("returns null when the x is outside the hover threshold", () => {
    expect(getMeasuredValueAtX(measured, -13)).toBeNull();
  });
});

describe("getNearestMeasuredPoint", () => {
  it("snaps to the closest measured point within the snap threshold", () => {
    expect(getNearestMeasuredPoint(measured, 0.3)).toEqual({ x: 0, y: 0 });
  });

  it("returns null when no measured point is close enough", () => {
    expect(getNearestMeasuredPoint(measured, 5)).toBeNull();
  });
});

describe("getHoverSnapshotFromX", () => {
  it("returns null for x outside the curve domain", () => {
    expect(getHoverSnapshotFromX(-50, data, measured)).toBeNull();
    expect(getHoverSnapshotFromX(50, data, measured)).toBeNull();
  });

  it("returns null when the data array is empty", () => {
    expect(getHoverSnapshotFromX(0, [], measured)).toBeNull();
  });

  it("returns an exact-match snapshot for curve x-values", () => {
    const snapshot = getHoverSnapshotFromX(0, data, measured);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.x).toBe(0);
    expect(snapshot?.measuredValue).toBe(0);
    expect(snapshot?.modelValues).toEqual({ T1: 5, T2: 6, T3: 7, T4: 8 });
  });

  it("linearly interpolates between bracketing curve points", () => {
    const snapshot = getHoverSnapshotFromX(5, data, measured);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.x).toBe(5);
    expect(snapshot?.modelValues.T1).toBeCloseTo(7, 10);
    expect(snapshot?.modelValues.T2).toBeCloseTo(8, 10);
  });

  it("snaps to the measured x when within the snap threshold", () => {
    const snapshot = getHoverSnapshotFromX(0.3, data, measured);
    expect(snapshot?.x).toBe(0);
    expect(snapshot?.measuredValue).toBe(0);
  });
});

describe("areHoverSnapshotsEqual", () => {
  const base: HoverSnapshot = {
    x: 0,
    measuredValue: 1,
    modelValues: { T1: 1, T2: 2, T3: 3, T4: 4 },
  };

  it("is true for two nulls", () => {
    expect(areHoverSnapshotsEqual(null, null)).toBe(true);
  });

  it("is false when one side is null", () => {
    expect(areHoverSnapshotsEqual(base, null)).toBe(false);
    expect(areHoverSnapshotsEqual(null, base)).toBe(false);
  });

  it("is true for snapshots with matching content", () => {
    expect(
      areHoverSnapshotsEqual(base, {
        x: 0,
        measuredValue: 1,
        modelValues: { T1: 1, T2: 2, T3: 3, T4: 4 },
      }),
    ).toBe(true);
  });

  it("is false when a model value differs", () => {
    expect(
      areHoverSnapshotsEqual(base, {
        x: 0,
        measuredValue: 1,
        modelValues: { T1: 1, T2: 2, T3: 3, T4: 42 },
      }),
    ).toBe(false);
  });

  it("is false when the measured value differs", () => {
    expect(
      areHoverSnapshotsEqual(base, {
        ...base,
        measuredValue: null,
      }),
    ).toBe(false);
  });
});
