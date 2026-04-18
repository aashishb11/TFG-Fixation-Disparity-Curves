import { MODEL_DISPLAY_LABELS } from "../constants/fdc";
import { deriveClinicalMeasurements } from "../lib/clinicalSummary";
import type { ComputeResponse } from "../types/fdc";

type ClassificationCardProps = {
  result: ComputeResponse | null;
};

export function ClassificationCard({ result }: ClassificationCardProps) {
  const selectedModel =
    result === null ? null : result.models[result.classification.best_by_sse];
  const clinicalMeasurements = deriveClinicalMeasurements(result?.measured ?? []);

  const formatSummaryValue = (
    value: number | null,
    fallback = "--",
  ): string => {
    if (value === null) {
      return fallback;
    }

    return value.toFixed(3);
  };

  return (
    <article className="card card--classification">
      <div className="classification-card__top">
        <section className="classification-card__primary">
          <h3 className="card__title">Classification</h3>
          {result ? (
            <>
              <div className="classification-card__value">
                {MODEL_DISPLAY_LABELS[result.classification.best_by_sse]}
              </div>
              <span className="classification-card__note">
                Selected as the primary clinical model based on Sum of Squared
                Errors (SSE)
              </span>
            </>
          ) : (
            <div className="card__placeholder">
              Run analysis to populate the clinical summary.
            </div>
          )}
        </section>

        <section className="classification-card__slope">
          <span className="classification-card__stat-label">Slope</span>
          <strong className="classification-card__stat-value">
            {formatSummaryValue(selectedModel?.slope ?? null)}
          </strong>
          <span className="classification-card__stat-note">
            Reported from the selected clinical model
          </span>
        </section>
      </div>

      <div className="classification-card__stats">
        <section className="summary-stat">
          <span className="summary-stat__label">Fixation Disparity</span>
          <strong className="summary-stat__value">
            {formatSummaryValue(clinicalMeasurements.fixationDisparity)}
          </strong>
          <span className="summary-stat__meta">Measured patient input at x = 0</span>
        </section>

        <section className="summary-stat">
          <span className="summary-stat__label">Associated Phoria</span>
          <strong className="summary-stat__value">
            {formatSummaryValue(clinicalMeasurements.associatedPhoria, "N/A")}
          </strong>
          <span className="summary-stat__meta">
            Smallest non-central x where measured input equals 0
          </span>
        </section>
      </div>
    </article>
  );
}
