import { describe, expect, it } from "vitest";

import { parseYValues, validateViewingDistance } from "./input";

describe("validateViewingDistance", () => {
  it("requires a viewing distance to be selected", () => {
    const result = validateViewingDistance("");
    expect(result).toEqual({
      ok: false,
      field: "viewingDistance",
      message: "Required before running the statistical fit.",
    });
  });

  it("passes for each supported distance option", () => {
    expect(validateViewingDistance("40cm")).toEqual({ ok: true });
    expect(validateViewingDistance("25cm")).toEqual({ ok: true });
  });
});

describe("parseYValues", () => {
  it("parses seven numeric strings into numbers", () => {
    const result = parseYValues(["1", "2.5", "-3", "0", "1e2", "-0.1", "4"]);
    expect(result).toEqual({
      ok: true,
      values: [1, 2.5, -3, 0, 100, -0.1, 4],
    });
  });

  it("rejects alphabetic input", () => {
    const result = parseYValues(["1", "foo", "3", "4", "5", "6", "7"]);
    expect(result).toEqual({
      ok: false,
      error: "Please ensure all inputs contain valid numbers.",
    });
  });

  it("rejects Infinity", () => {
    const result = parseYValues(["Infinity", "2", "3", "4", "5", "6", "7"]);
    expect(result.ok).toBe(false);
  });

  it("rejects NaN literal", () => {
    const result = parseYValues(["NaN", "2", "3", "4", "5", "6", "7"]);
    expect(result.ok).toBe(false);
  });
});
