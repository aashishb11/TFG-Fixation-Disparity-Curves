import type { ViewingDistance } from "../types/fdc";

/**
 * Tagged-union result type used throughout the validation layer.
 * `ok: true` carries the parsed values; `ok: false` carries user-facing error
 * info so callers never need to inspect raw exceptions.
 */
type ParseYValuesResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string };

type ViewingDistanceValidationResult =
  | { ok: true }
  | {
      ok: false;
      field: "viewingDistance" | "customDistance";
      message: string;
    };

/**
 * Validates that a viewing distance has been selected and, when "other" is
 * chosen, that the custom distance field is non-empty. Returns the failing
 * field name so the UI can focus or highlight the right input.
 */
export function validateViewingDistance(
  viewingDistance: ViewingDistance | "",
  customDistance: string,
): ViewingDistanceValidationResult {
  if (!viewingDistance) {
    return {
      ok: false,
      field: "viewingDistance",
      message: "Required before running the statistical fit.",
    };
  }

  if (viewingDistance === "other" && customDistance.trim() === "") {
    return {
      ok: false,
      field: "customDistance",
      message: "Please type your preferred distance",
    };
  }

  return { ok: true };
}

/**
 * Converts the 7 string inputs to `number[]` and rejects any value that
 * isn't a finite number (empty strings, "NaN", "Infinity", etc.).
 */
export function parseYValues(yValues: string[]): ParseYValuesResult {
  const parsed = yValues.map((value) => Number(value));

  if (parsed.some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    return {
      ok: false,
      error: "Please ensure all inputs contain valid numbers.",
    };
  }

  return { ok: true, values: parsed };
}
