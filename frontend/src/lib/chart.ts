import { MODEL_KEYS } from "../constants/fdc";
import type { ComputeResponse, MergedCurvePoint, ModelKey } from "../types/fdc";

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
