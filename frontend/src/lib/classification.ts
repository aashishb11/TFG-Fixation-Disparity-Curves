import { MODEL_KEYS } from "../constants/fdc";
import type {
  CompatibleClassification,
  ComputeResponse,
  Point,
} from "../types/fdc";

// NRMSE: normalize RMSE by the y-value range of the measured data.
// errorPct = (rmse / yRange) × 100, where yRange = max(y) − min(y).
// Returns 100 when yRange < 1e-10 (degenerate flat data — no meaningful normalization).
export function computeErrorPct(rmse: number, measured: Point[]): number {
  if (measured.length === 0) return 100;
  const ys = measured.map((p) => p.y);
  const yRange = Math.max(...ys) - Math.min(...ys);
  if (yRange < 1e-10) return 100;
  return (rmse / yRange) * 100;
}

export function getCompatibleClassifications(
  response: ComputeResponse,
  threshold = 10,
): CompatibleClassification[] {
  const { measured, models, classification } = response;
  return MODEL_KEYS.filter(
    (key) => computeErrorPct(models[key].rmse, measured) < threshold,
  )
    .map((key) => ({
      modelKey: key,
      errorPct: computeErrorPct(models[key].rmse, measured),
      isBest: key === classification.best_by_sse,
    }))
    .sort((a, b) => a.errorPct - b.errorPct);
}

export function getAllClassifications(
  response: ComputeResponse,
): CompatibleClassification[] {
  const { measured, models, classification } = response;
  return MODEL_KEYS.map((key) => ({
    modelKey: key,
    errorPct: computeErrorPct(models[key].rmse, measured),
    isBest: key === classification.best_by_sse,
  })).sort((a, b) => a.errorPct - b.errorPct);
}
