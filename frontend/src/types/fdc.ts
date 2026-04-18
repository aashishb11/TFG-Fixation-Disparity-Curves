export type Point = {
  x: number;
  y: number;
};

export type ModelKey = "T1" | "T2" | "T3" | "T4";
export type ViewingDistance = "40cm" | "25cm" | "other";
export type PresetViewingDistance = Exclude<ViewingDistance, "other">;

export type ModelMetrics = {
  params: Record<string, number>;
  sse: number;
  rmse: number;
  slope: number;
  fitted_at_x: number[];
  curve: Point[];
};

export type ComputeResponse = {
  x: number[];
  measured: Point[];
  models: Record<ModelKey, ModelMetrics>;
  classification: {
    best_by_sse: ModelKey;
    best_by_rmse: ModelKey;
  };
};

export type MergedCurvePoint = {
  x: number;
} & Record<ModelKey, number>;
