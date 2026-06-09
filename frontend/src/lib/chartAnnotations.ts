import type { Point } from "../types/fdc";

/**
 * Returns positions from [-15, -10] where the measured disparity is exactly zero.
 *
 * These are the far-convergent limits of the patient's compensation range,
 * shown as "Patient Limit" dashed lines on the chart so clinicians can
 * see the boundary of adaptive vergence.
 *
 * Note: different from associatedPhoria in clinicalSummary.ts which finds
 * the nearest zero crossing, this one only looks at the outermost positions.
 */
export function getPatientLimitMarkers(measured: Point[]): number[] {
  return [-15, -10].filter((limitX) =>
    measured.some((point) => point.x === limitX && point.y === 0),
  );
}
