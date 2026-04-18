import type { ModelKey } from "../types/fdc";

export const FIXED_X_VALUES = [-15, -10, -5, 0, 5, 10, 15] as const;
export const AXIS_DOMAIN = [-20, 20] as const;
export const AXIS_TICKS = [-20, -15, -10, -5, 0, 5, 10, 15, 20] as const;

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
  T1: "#e63946",
  T2: "#457b9d",
  T3: "#2a9d8f",
  T4: "#a8dadc",
};
