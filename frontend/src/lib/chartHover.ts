/**
 * Pure utility functions for the chart hover/readout system.
 *
 * These functions are kept in lib/ (not inside CurveChart.tsx) because they
 * contain no React or Recharts dependencies and need to be reasoned about and
 * tested independently of the rendering layer.
 */

import { AXIS_DOMAIN, MODEL_KEYS } from "../constants/fdc";
import type { HoverSnapshot, MergedCurvePoint, ModelKey, Point } from "../types/fdc";

// ─── Thresholds ──────────────────────────────────────────────────────────────

/**
 * Maximum x-distance (in prism diopters) at which a hover position is
 * considered "close enough" to a measured point to show the measured value
 * in the readout panel.
 */
export const MEASURED_HOVER_THRESHOLD = 0.45;

/**
 * Snap radius: within this distance the hover locks onto the exact measured
 * x value instead of interpolating. This prevents the readout from showing
 * a slightly off x when the cursor is almost on a real measurement.
 */
export const MEASURED_POINT_SNAP_THRESHOLD = 0.9;

/** Floating-point tolerance used when looking for an exact curve x match. */
const CLINICAL_EPSILON = 0.0001;

// ─── Equality / comparison ────────────────────────────────────────────────────

/**
 * Returns true when two snapshots represent identical readout state, so the
 * component can skip a React re-render during fast mouse movement.
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

// ─── Measured-point lookups ───────────────────────────────────────────────────

/**
 * Returns the measured y-value when `xValue` is within MEASURED_HOVER_THRESHOLD
 * of a measured point, otherwise null. Does not affect the cursor position —
 * purely used to decide whether to surface the real measurement in the readout.
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
 * Returns the nearest measured point when it is within MEASURED_POINT_SNAP_THRESHOLD,
 * otherwise null. The snap behaviour means the cursor "sticks" to the real
 * x value when hovering near a measurement, avoiding interpolation noise.
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

// ─── Snapshot building ────────────────────────────────────────────────────────

/** Linear interpolation between two y-values at fractional position `ratio`. */
function interpolateValue(startY: number, endY: number, ratio: number): number {
  return startY + (endY - startY) * ratio;
}

/**
 * Builds a HoverSnapshot for a given raw x position (as converted from mouse
 * coordinates) by:
 *
 * 1. Optionally snapping to the nearest measured point if within the snap radius.
 * 2. Looking for an exact curve data point at that x (within CLINICAL_EPSILON).
 * 3. Falling back to linear interpolation between the two bracketing points.
 *
 * Returns null when x is outside the axis domain or the curve data is empty.
 */
export function getHoverSnapshotFromX(
  xValue: number,
  data: MergedCurvePoint[],
  measured: Point[],
): HoverSnapshot | null {
  const snapped = getNearestMeasuredPoint(measured, xValue);
  // If snapped, use the exact measured x so the readout shows the real point.
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

  // Fast path: find a curve point that already sits at this exact x value.
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

  // Interpolation path: find the two curve points that bracket effectiveX.
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

// ─── Domain helpers ───────────────────────────────────────────────────────────

/**
 * Converts a pixel-space x ratio (0–1 across the plot area) into an axis
 * x value in prism diopters. Used by PlotHoverLayer to translate mouse
 * position into domain coordinates.
 */
export function pixelRatioToAxisX(ratio: number): number {
  return AXIS_DOMAIN[0] + ratio * (AXIS_DOMAIN[1] - AXIS_DOMAIN[0]);
}
