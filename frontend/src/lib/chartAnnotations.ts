import type { Point } from "../types/fdc";

/**
 * Returns the subset of [-15, -10] x-positions where the measured
 * fixation disparity is exactly zero.
 *
 * These positions represent the far-convergent end of the patient's
 * compensation range — the point(s) where the curve meets y = 0 under
 * maximum convergence demand. Rendering them as dashed "Patient Limit"
 * reference lines lets clinicians visually identify the boundary of
 * the patient's adaptive vergence.
 *
 * Note: this is clinically distinct from `associatedPhoria` (see
 * clinicalSummary.ts), which identifies the *nearest* zero crossing.
 */
export function getPatientLimitMarkers(measured: Point[]): number[] {
  return [-15, -10].filter((limitX) =>
    measured.some((point) => point.x === limitX && point.y === 0),
  );
}
