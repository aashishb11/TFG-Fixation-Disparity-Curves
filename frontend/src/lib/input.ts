import type { ViewingDistance } from "../types/fdc";

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
