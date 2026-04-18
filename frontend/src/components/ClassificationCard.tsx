import { MODEL_DISPLAY_LABELS } from "../constants/fdc";
import type { ComputeResponse } from "../types/fdc";

type ClassificationCardProps = {
  result: ComputeResponse | null;
};

export function ClassificationCard({ result }: ClassificationCardProps) {
  return (
    <article className="card card--classification">
      <h3 className="card__title">Classification</h3>
      {result ? (
        <div className="classification-card__value">
          {MODEL_DISPLAY_LABELS[result.classification.best_by_sse]}
          <span className="classification-card__note">
            Selected as the primary clinical model based on Sum of Squared
            Errors (SSE)
          </span>
        </div>
      ) : (
        <div className="card__placeholder">Run analysis to classify...</div>
      )}
    </article>
  );
}
