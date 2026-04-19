import { describe, expect, it } from "vitest";

import {
  AXIS_DOMAIN,
  FIXED_X_VALUES,
  MODEL_KEYS,
  getPresetValuesForFixedX,
} from "./fdc";

describe("static chart constants", () => {
  it("spans the expected visible chart domain", () => {
    expect(AXIS_DOMAIN).toEqual([-20, 20]);
  });

  it("exposes seven fixed vergence-demand positions", () => {
    expect(FIXED_X_VALUES).toEqual([-15, -10, -5, 0, 5, 10, 15]);
  });

  it("declares the four supported model types", () => {
    expect(MODEL_KEYS).toEqual(["T1", "T2", "T3", "T4"]);
  });
});

describe("getPresetValuesForFixedX", () => {
  it("returns the 40 cm preset values at the seven fixed x positions", () => {
    // Preset indices = FIXED_X / 5 + 6 over the 13-entry preset table.
    expect(getPresetValuesForFixedX("40cm")).toEqual([
      "12.9", "8.6", "4.3", "0", "-4.3", "-8.6", "-12.9",
    ]);
  });

  it("returns the 25 cm preset values at the seven fixed x positions", () => {
    expect(getPresetValuesForFixedX("25cm")).toEqual([
      "20.6", "13.7", "6.9", "0", "-6.9", "-13.7", "-20.6",
    ]);
  });

  it("returns a result of the same length as FIXED_X_VALUES", () => {
    expect(getPresetValuesForFixedX("40cm")).toHaveLength(FIXED_X_VALUES.length);
    expect(getPresetValuesForFixedX("25cm")).toHaveLength(FIXED_X_VALUES.length);
  });
});
