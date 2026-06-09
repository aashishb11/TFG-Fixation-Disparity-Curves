/**
 * Utility functions for the chart hover readout.
 *
 * Kept separate from CurveChart.tsx so they can be tested independently
 * without any React or Recharts dependencies.
 */

import { AXIS_DOMAIN, MODEL_KEYS } from "../constants/fdc";
import type { HoverSnapshot, MergedCurvePoint, ModelKey, Point } from "../types/fdc";

// --- Thresholds ---

/**
 * Max x-distance (prism diopters) to consider a hover "close enough" to
 * a measured point and show the real measured value in the readout.
 */
export const MEASURED_HOVER_THRESHOLD = 0.45;

/**
 * If the cursor is within this distance of a measured point, we snap
 * the x to the exact measured value instead of interpolating.
 * Avoids showing slightly wrong x values when hovering near a measurement.
 */
export const MEASURED_POINT_SNAP_THRESHOLD = 0.9;

/** Tolerance for finding an exact x match in the curve data. */
const CLINICAL_EPSILON = 0.0001;

// --- Equality / comparison ---

/**
 * Checks if two hover snapshots have the same values, so we can skip
 * a re-render if nothing changed during fast mouse movement.
 */
export function areHoverSnapshotsEqual(
  current: HoverSnapshot | null,
  next: HoverSnapshot | null,
): boolean {
  if (current === next) return true;
  if (current === null || next === null) return false;
  if (current.x !== next.x || current.measuredValue !== next.measuredValue) {
    return false;
  }

  return MODEL_KEYS.every(
    (key) => current.modelValues[key] === next.modelValues[key],
  );
}

// --- Measured point lookups ---

/**
 * Returns the measured y-value if xValue is close enough to a measured point,
 * otherwise null. Only used to decide what to show in the readout, doesn't
 * affect the cursor position.
 */
export function getMeasuredValueAtX(
  measured: Point[],
  xValue: number,
): number | null {
  return (
    measured.find((p) => Math.abs(p.x - xValue) <= MEASURED_HOVER_THRESHOLD)
      ?.y ?? null
  );
}

/**
 * Returns the nearest measured point if it's within the snap threshold,
 * null otherwise. This makes the cursor stick to real measurement positions
 * when hovering nearby, avoiding interpolation noise.
 */
export function getNearestMeasuredPoint(
  measured: Point[],
  xValue: number,
): Point | null {
  let nearest: Point | null = null;
  let nearestDist = Number.POSITIVE_INFINITY;

  for (const point of measured) {
    const dist = Math.abs(point.x - xValue);
    if (dist < nearestDist) {
      nearest = point;
      nearestDist = dist;
    }
  }

  return nearestDist <= MEASURED_POINT_SNAP_THRESHOLD ? nearest : null;
}

// --- Snapshot building ---

/** Linear interpolation between two y values. */
function interpolateValue(startY: number, endY: number, ratio: number): number {
  return startY + (endY - startY) * ratio;
}

/**
 * Builds the HoverSnapshot for a given x position (from mouse coordinates).
 *
 * Steps:
 * 1. Snap to nearest measured point if close enough.
 * 2. Try to find exact curve point at that x.
 * 3. Otherwise interpolate between the two bracketing points.
 *
 * Returns null if x is outside the domain or there's no data.
 */
export function getHoverSnapshotFromX(
  xValue: number,
  data: MergedCurvePoint[],
  measured: Point[],
): HoverSnapshot | null {
  const snapped = getNearestMeasuredPoint(measured, xValue);
  // use the snapped x so the readout shows the exact measurement position
  const effectiveX = snapped?.x ?? xValue;

  if (!Number.isFinite(effectiveX) || data.length === 0) return null;

  const first = data[0];
  const last = data[data.length - 1];

  if (
    first === undefined ||
    last === undefined ||
    effectiveX < first.x ||
    effectiveX > last.x
  ) {
    return null;
  }

  // try to find an exact match first before doing interpolation
  const exactPoint = data.find(
    (p) => Math.abs(p.x - effectiveX) <= CLINICAL_EPSILON,
  );

  if (exactPoint !== undefined) {
    return {
      x: exactPoint.x,
      measuredValue: snapped?.y ?? getMeasuredValueAtX(measured, exactPoint.x),
      modelValues: MODEL_KEYS.reduce(
        (acc, key) => {
          acc[key] = exactPoint[key];
          return acc;
        },
        {} as Partial<Record<ModelKey, number>>,
      ),
    };
  }

  // no exact match, interpolate between the two surrounding points
  let lower: MergedCurvePoint | undefined;
  let upper: MergedCurvePoint | undefined;

  for (let i = 0; i < data.length - 1; i += 1) {
    const curr = data[i];
    const next = data[i + 1];
    if (
      curr !== undefined &&
      next !== undefined &&
      curr.x <= effectiveX &&
      next.x >= effectiveX
    ) {
      lower = curr;
      upper = next;
      break;
    }
  }

  if (lower === undefined || upper === undefined) return null;

  const span = upper.x - lower.x;
  const ratio = span === 0 ? 0 : (effectiveX - lower.x) / span;

  const modelValues = MODEL_KEYS.reduce(
    (acc, key) => {
      acc[key] = interpolateValue(lower![key], upper![key], ratio);
      return acc;
    },
    {} as Partial<Record<ModelKey, number>>,
  );

  if (Object.keys(modelValues).length === 0) return null;

  return {
    x: effectiveX,
    measuredValue: snapped?.y ?? getMeasuredValueAtX(measured, effectiveX),
    modelValues,
  };
}

// --- Domain helpers ---

/**
 * Converts a pixel ratio (0 to 1 across the plot area) to an axis x value
 * in prism diopters. Used by PlotHoverLayer to convert mouse position.
 */
export function pixelRatioToAxisX(ratio: number): number {
  return AXIS_DOMAIN[0] + ratio * (AXIS_DOMAIN[1] - AXIS_DOMAIN[0]);
}
