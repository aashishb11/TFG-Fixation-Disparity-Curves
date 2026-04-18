import type { Point } from "../types/fdc";

export type ClinicalMeasurements = {
  fixationDisparity: number | null;
  associatedPhoria: number | null;
};

function normalizeClinicalValue(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function deriveClinicalMeasurements(
  measured: Point[],
): ClinicalMeasurements {
  const fixationDisparityPoint = measured.find((point) => point.x === 0);
  const associatedPhoria = measured.reduce<number | null>((smallestX, point) => {
    if (point.x === 0 || point.y !== 0) {
      return smallestX;
    }

    return smallestX === null || point.x < smallestX ? point.x : smallestX;
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
