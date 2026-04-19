/** A single {x, y} coordinate used for measured data and smooth curves. */
export type Point = {
  x: number;
  y: number;
};

/** The four mathematical model types supported by the fitting backend. */
export type ModelKey = "T1" | "T2" | "T3" | "T4";

/** Union of all valid viewing distances selectable in the UI. */
export type ViewingDistance = "40cm" | "25cm" | "other";

/** Subset of ViewingDistance values that have built-in clinical presets. */
export type PresetViewingDistance = Exclude<ViewingDistance, "other">;

/**
 * Per-model output from the backend fitting service.
 *
 * - `params` — fitted model coefficients (a, b, c, and optionally d)
 * - `sse` / `rmse` — goodness-of-fit metrics; lower is better
 * - `slope` — paper-defined descriptor: |f(3) − f(−3)| / 6
 * - `fitted_at_x` — model's y values evaluated at the 7 input x positions
 * - `curve` — 200-point smooth curve used for plotting
 */
export type ModelMetrics = {
  params: Record<string, number>;
  sse: number;
  rmse: number;
  slope: number;
  fitted_at_x: number[];
  curve: Point[];
};

/**
 * Full response from `POST /api/v1/compute`.
 *
 * `classification.best_by_sse` is the primary result used throughout the UI;
 * `best_by_rmse` is surfaced in the advanced metrics table for comparison.
 */
export type ComputeResponse = {
  x: number[];
  measured: Point[];
  models: Record<ModelKey, ModelMetrics>;
  classification: {
    best_by_sse: ModelKey;
    best_by_rmse: ModelKey;
  };
};

/**
 * A merged row for Recharts: one entry per smooth-curve x position, with
 * each model's y value keyed by model name. Produced by `mergeModelCurves`.
 */
export type MergedCurvePoint = {
  x: number;
} & Record<ModelKey, number>;

/**
 * Snapshot of interpolated curve values at a given hover x position.
 * `measuredValue` is null when the cursor is not near an actual patient
 * measurement point. `modelValues` holds one interpolated y-value per model.
 */
export type HoverSnapshot = {
  x: number;
  measuredValue: number | null;
  modelValues: Partial<Record<ModelKey, number>>;
};
