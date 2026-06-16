import { describe, expect, it } from "vitest";

import {
  AXIS_DOMAIN,
  DEFAULT_MEASURED_Y_VALUES,
  FIXED_X_VALUES,
  MODEL_KEYS,
  VIEWING_DISTANCE_OPTIONS,
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

  it("exposes only the two supported viewing-distance options", () => {
    expect(VIEWING_DISTANCE_OPTIONS).toEqual([
      { value: "40cm", label: "40 cm" },
      { value: "25cm", label: "25 cm" },
    ]);
  });

  it("initializes the measured inputs with seven empty values", () => {
    expect(DEFAULT_MEASURED_Y_VALUES).toEqual(["", "", "", "", "", "", ""]);
    expect(DEFAULT_MEASURED_Y_VALUES).toHaveLength(FIXED_X_VALUES.length);
  });
});
