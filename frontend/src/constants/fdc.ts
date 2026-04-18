import type {
  ModelKey,
  PresetViewingDistance,
  ViewingDistance,
} from "../types/fdc";

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

// ─── Viewing distance UI ──────────────────────────────────────────────────────

export const VIEWING_DISTANCE_OPTIONS: ReadonlyArray<{
  value: ViewingDistance;
  label: string;
}> = [
  { value: "40cm", label: "40 cm" },
  { value: "25cm", label: "25 cm" },
  { value: "other", label: "Other" },
];

export const VIEWING_DISTANCE_LABELS: Record<ViewingDistance, string> = {
  "40cm": "40 cm",
  "25cm": "25 cm",
  other: "Other",
};

// ─── Clinical presets ─────────────────────────────────────────────────────────

/**
 * Thirteen evenly-spaced fixation-disparity values for each preset distance,
 * spanning x = -30 to +30 in steps of 5. Index 6 corresponds to x = 0
 * (the midpoint / no-demand position).
 */
const VIEWING_DISTANCE_PRESETS: Record<
  PresetViewingDistance,
  readonly string[]
> = {
  "40cm": [
    "-34.4", "25.8", "17.2", "12.9", "8.6", "4.3", "0",
    "-4.3", "-8.6", "-12.9", "-17.2", "-25.8", "-34.4",
  ],
  "25cm": [
    "55", "41.2", "27.5", "20.6", "13.7", "6.9", "0",
    "-6.9", "-13.7", "-20.6", "-27.5", "-41.2", "-55",
  ],
};

// Internal mapping constants — not part of the public API.
const PRESET_STEP = 5;
const PRESET_CENTER_INDEX = 6; // index of x = 0 in the 13-value preset array

/**
 * Returns the 7 preset y-values that correspond to FIXED_X_VALUES for the
 * given viewing distance. Throws if a mapping gap is ever introduced.
 */
export function getPresetValuesForFixedX(
  distance: PresetViewingDistance,
): string[] {
  const presetValues = VIEWING_DISTANCE_PRESETS[distance];

  return FIXED_X_VALUES.map((xValue) => {
    const presetIndex = xValue / PRESET_STEP + PRESET_CENTER_INDEX;
    const presetValue = presetValues[presetIndex];

    if (presetValue === undefined) {
      throw new Error(`No preset value mapped for fixed x position ${xValue}.`);
    }

    return presetValue;
  });
}

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
