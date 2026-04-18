import type { Point } from "../types/fdc";

export type ClinicalMeasurements = {
  fixationDisparity: number | null;
  associatedPhoria: number | null;
};

/**
 * IEEE 754 can produce -0 when subtracting values that cancel out. Normalise
 * it to +0 so clinical readouts don't show "-0.000 arcmin".
 */
function normalizeClinicalValue(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

/**
 * Derives the two key clinical summary metrics from the raw measured points.
 *
 * **Fixation Disparity** — the y-value at x = 0 (zero vergence demand).
 * A non-zero value means the patient has residual misalignment at rest.
 *
 * **Associated Phoria** — the vergence demand (x value) at which the patient's
 * fixation disparity is exactly zero (y = 0). When multiple such points exist
 * we return the one *nearest* to x = 0 (smallest |x|), i.e. the minimum
 * prism correction needed. This is distinct from the "patient limit" markers
 * (see chartAnnotations.ts) which identify the extreme-convergence end of the
 * compensation range.
 */
export function deriveClinicalMeasurements(
  measured: Point[],
): ClinicalMeasurements {
  const fixationDisparityPoint = measured.find((point) => point.x === 0);

  // Walk all points to find the non-central x closest to 0 where y = 0.
  const associatedPhoria = measured.reduce<number | null>((nearest, point) => {
    if (point.x === 0 || point.y !== 0) {
      return nearest;
    }

    return nearest === null || Math.abs(point.x) < Math.abs(nearest)
      ? point.x
      : nearest;
  }, null);

  return {
    fixationDisparity:
      fixationDisparityPoint === undefined
        ? null
        : normalizeClinicalValue(fixationDisparityPoint.y),
    associatedPhoria:
      associatedPhoria === null
        ? null
        : normalizeClinicalValue(associatedPhoria),
  };
}
