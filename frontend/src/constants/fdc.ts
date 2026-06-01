import type { ModelKey, ViewingDistance } from "../types/fdc";

// ─── Chart axis ───────────────────────────────────────────────────────────────

/** Visible x/y range for both axes (prism diopters / arcmin). */
export const AXIS_DOMAIN = [-20, 20] as const;

/** Tick positions rendered on both axes. */
export const AXIS_TICKS = [-20, -15, -10, -5, 0, 5, 10, 15, 20] as const;

// ─── Input x positions ────────────────────────────────────────────────────────

/**
 * The seven fixed vergence-demand values at which patients are measured.
 * Must match DEFAULT_X in backend/app/services/fdc_fit.py.
 */
export const FIXED_X_VALUES = [-15, -10, -5, 0, 5, 10, 15] as const;

/** Default measured fixation-disparity values shown on initial load. */
export const DEFAULT_MEASURED_Y_VALUES = Array.from(
  { length: FIXED_X_VALUES.length },
  () => "0",
);

// ─── Viewing distance UI ──────────────────────────────────────────────────────

export const VIEWING_DISTANCE_OPTIONS: ReadonlyArray<{
  value: ViewingDistance;
  label: string;
}> = [
  { value: "40cm", label: "40 cm" },
  { value: "25cm", label: "25 cm" },
];

// ─── Model metadata ───────────────────────────────────────────────────────────

export const MODEL_KEYS: readonly ModelKey[] = ["T1", "T2", "T3", "T4"];

/**
 * Human-readable label used in the metrics table and PDF report.
 * Kept separate from MODEL_CHART_LABELS so the two contexts can diverge
 * independently if needed in future.
 */
export const MODEL_DISPLAY_LABELS: Record<ModelKey, string> = {
  T1: "Type I",
  T2: "Type II",
  T3: "Type III",
  T4: "Type IV",
};

/** Human-readable label shown in the chart legend. */
export const MODEL_CHART_LABELS: Record<ModelKey, string> = MODEL_DISPLAY_LABELS;

export const MODEL_COLORS: Record<ModelKey, string> = {
  T1: "#d84c4c",
  T2: "#2f8f57",
  T3: "#2f6ea5",
  T4: "#bf46b2",
};

/** Colour used for the raw measured data scatter points. */
export const MEASURED_DATA_COLOR = "#18324a";
