import type { Point } from "../types/fdc";

export function getPatientLimitMarkers(measured: Point[]): number[] {
  return [-15, -10].filter((limitX) =>
    measured.some((point) => point.x === limitX && point.y === 0),
  );
}
