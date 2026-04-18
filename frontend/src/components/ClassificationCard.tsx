import type { CSSProperties } from "react";
import { MODEL_CHART_LABELS, MODEL_COLORS } from "../constants/fdc";
import { deriveClinicalMeasurements } from "../lib/clinicalSummary";
import type { ComputeResponse } from "../types/fdc";

type ClassificationCardProps = {
  result: ComputeResponse | null;
};

export function ClassificationCard({ result }: ClassificationCardProps) {
  const selectedModel =
    result === null ? null : result.models[result.classification.best_by_sse];
  const selectedModelKey = result?.classification.best_by_sse ?? null;
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

  const cardStyle = selectedModelKey
    ? ({ "--card-accent-color": MODEL_COLORS[selectedModelKey] } as CSSProperties)
    : undefined;

  return (
    <article className="card card--classification" style={cardStyle}>
      <div className="classification-card__grid">
        <section className="classification-card__primary">
          <h3 className="card__title">Classification</h3>
          {result ? (
            <>
              <div className="classification-card__value">
                <span
                  style={
                    selectedModelKey === null
                      ? undefined
                      : { color: MODEL_COLORS[selectedModelKey] }
                  }
                >
                  {MODEL_CHART_LABELS[result.classification.best_by_sse]}
                </span>
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
            {selectedModel?.slope != null ? (
              <>
                {selectedModel.slope.toFixed(3)}
                <span className="stat-unit"> arcmin/Δ</span>
              </>
            ) : "--"}
          </strong>
          <span className="classification-card__stat-note">
            Reported from the selected clinical model
          </span>
        </section>

        <section className="summary-stat">
          <span className="summary-stat__label">Fixation Disparity</span>
          <strong className="summary-stat__value">
            {clinicalMeasurements.fixationDisparity != null ? (
              <>
                {clinicalMeasurements.fixationDisparity.toFixed(3)}
                <span className="stat-unit"> arcmin</span>
              </>
            ) : "--"}
          </strong>
          <span className="summary-stat__meta">Measured at x = 0</span>
        </section>

        <section className="summary-stat">
          <span className="summary-stat__label">Associated Phoria</span>
          <strong className="summary-stat__value">
            {clinicalMeasurements.associatedPhoria != null ? (
              <>
                {clinicalMeasurements.associatedPhoria.toFixed(3)}
                <span className="stat-unit"> Δ</span>
              </>
            ) : "N/A"}
          </strong>
          <span className="summary-stat__meta">
            Nearest x where measured y = 0
          </span>
        </section>
      </div>
    </article>
  );
}
