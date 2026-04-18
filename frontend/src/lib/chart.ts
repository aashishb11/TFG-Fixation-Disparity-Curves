import { MODEL_KEYS } from "../constants/fdc";
import type { ComputeResponse, MergedCurvePoint, ModelKey } from "../types/fdc";

/**
 * Merges the four per-model smooth curves into a single array that Recharts
 * can consume as a single `data` prop.
 *
 * Each element looks like `{ x: number, T1: number, T2: number, T3: number, T4: number }`.
 * Recharts maps each `dataKey` name to the corresponding Line series, so a
 * merged structure is more efficient than four separate data arrays.
 *
 * We take `Math.min` of the curve lengths as a safety net in case the backend
 * ever returns unequal-length arrays, but in practice all models use the same
 * smooth-x grid so the lengths are always identical.
 *
 * The x coordinate is taken from T1's curve — all models share the same
 * smooth-x grid (computed from `_build_smooth_x` in fdc_fit.py), so any
 * model's x array would give the same result.
 */
export function mergeModelCurves(
  response: ComputeResponse | null,
): MergedCurvePoint[] {
  if (!response) {
    return [];
  }

  const pointCount = Math.min(
    ...MODEL_KEYS.map((modelKey) => response.models[modelKey].curve.length),
  );

  return Array.from({ length: pointCount }, (_, index) => {
    const modelValues = Object.fromEntries(
      MODEL_KEYS.map((modelKey) => [
        modelKey,
        response.models[modelKey].curve[index].y,
      ]),
    ) as Record<ModelKey, number>;

    return {
      x: response.models.T1.curve[index].x,
      ...modelValues,
    };
  });
}
