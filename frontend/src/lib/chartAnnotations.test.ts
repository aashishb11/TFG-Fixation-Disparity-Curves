import { describe, expect, it } from "vitest";

import { getPatientLimitMarkers } from "./chartAnnotations";

describe("getPatientLimitMarkers", () => {
  it("returns an empty array when neither -15 nor -10 has y = 0", () => {
    expect(
      getPatientLimitMarkers([
        { x: -15, y: 1 },
        { x: -10, y: 2 },
        { x: 0, y: 3 },
      ]),
    ).toEqual([]);
  });

  it("returns only x = -15 when it is zero and -10 is not", () => {
    expect(
      getPatientLimitMarkers([
        { x: -15, y: 0 },
        { x: -10, y: 1 },
      ]),
    ).toEqual([-15]);
  });

  it("returns both markers when both are zero", () => {
    expect(
      getPatientLimitMarkers([
        { x: -15, y: 0 },
        { x: -10, y: 0 },
      ]),
    ).toEqual([-15, -10]);
  });

  it("ignores positive x-positions even if their y is zero", () => {
    expect(
      getPatientLimitMarkers([
        { x: 10, y: 0 },
        { x: 15, y: 0 },
      ]),
    ).toEqual([]);
  });
});
