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
      field: "viewingDistance";
      message: string;
    };

export function validateViewingDistance(
  viewingDistance: ViewingDistance | "",
): ViewingDistanceValidationResult {
  if (!viewingDistance) {
    return {
      ok: false,
      field: "viewingDistance",
      message: "Required before running the statistical fit.",
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
