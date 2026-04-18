import type {
  ModelKey,
  PresetViewingDistance,
  ViewingDistance,
} from "../types/fdc";

export const FIXED_X_VALUES = [-15, -10, -5, 0, 5, 10, 15] as const;
export const AXIS_DOMAIN = [-20, 20] as const;
export const AXIS_TICKS = [-20, -15, -10, -5, 0, 5, 10, 15, 20] as const;
export const FIXED_X_PRESET_STEP = 5;
export const FIXED_X_PRESET_CENTER_INDEX = 6;
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

export const VIEWING_DISTANCE_PRESETS: Record<
  PresetViewingDistance,
  readonly string[]
> = {
  "40cm": [
    "-34.4",
    "25.8",
    "17.2",
    "12.9",
    "8.6",
    "4.3",
    "0",
    "-4.3",
    "-8.6",
    "-12.9",
    "-17.2",
    "-25.8",
    "-34.4",
  ],
  "25cm": [
    "55",
    "41.2",
    "27.5",
    "20.6",
    "13.7",
    "6.9",
    "0",
    "-6.9",
    "-13.7",
    "-20.6",
    "-27.5",
    "-41.2",
    "-55",
  ],
};

export function getPresetValuesForFixedX(
  distance: PresetViewingDistance,
): string[] {
  const presetValues = VIEWING_DISTANCE_PRESETS[distance];

  return FIXED_X_VALUES.map((xValue) => {
    const presetIndex = xValue / FIXED_X_PRESET_STEP + FIXED_X_PRESET_CENTER_INDEX;
    const presetValue = presetValues[presetIndex];

    if (presetValue === undefined) {
      throw new Error(`No preset value mapped for fixed x position ${xValue}.`);
    }

    return presetValue;
  });
}

export const MODEL_KEYS: readonly ModelKey[] = ["T1", "T2", "T3", "T4"];

export const MODEL_DISPLAY_LABELS: Record<ModelKey, string> = {
  T1: "Type 1",
  T2: "Type 2",
  T3: "Type 3",
  T4: "Type 4",
};

export const MODEL_CHART_LABELS: Record<ModelKey, string> = {
  T1: "Type I",
  T2: "Type II",
  T3: "Type III",
  T4: "Type IV",
};

export const MODEL_COLORS: Record<ModelKey, string> = {
  T1: "#b86b79",
  T2: "#2f6ea5",
  T3: "#4f9089",
  T4: "#8fb4c8",
};
