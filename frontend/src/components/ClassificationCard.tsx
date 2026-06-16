import type { CSSProperties } from "react";
import { MODEL_CHART_LABELS, MODEL_COLORS } from "../constants/fdc";
import { computeErrorPct } from "../lib/classification";
import { deriveClinicalMeasurements } from "../lib/clinicalSummary";
import type { ComputeResponse } from "../types/fdc";

type ClassificationCardProps = {
  result: ComputeResponse | null;
};

export function ClassificationCard({ result }: ClassificationCardProps) {
  const selectedModelKey = result?.classification.best_by_sse ?? null;
  const selectedModel =
    result === null ? null : result.models[result.classification.best_by_sse];
  const clinicalMeasurements = deriveClinicalMeasurements(
    result?.measured ?? [],
  );

  const bestErrorPct =
    selectedModelKey && result
      ? computeErrorPct(result.models[selectedModelKey].rmse, result.measured)
      : null;

  const cardStyle = selectedModelKey
    ? ({
        "--card-accent-color": MODEL_COLORS[selectedModelKey],
      } as CSSProperties)
    : undefined;

  return (
    <article className="card card--classification" style={cardStyle}>
      <section className="classification-card__primary classification-card__primary--list">
        <h3 className="card__title">Classification</h3>
        {result && selectedModelKey ? (
          <div className="classification-best">
            <span
              className="classification-best__swatch"
              style={{ backgroundColor: MODEL_COLORS[selectedModelKey] }}
            />
            <span className="classification-best__name">
              {MODEL_CHART_LABELS[selectedModelKey]}
            </span>
            {bestErrorPct !== null && (
              <span className="classification-best__nrmse">
                NRMSE {bestErrorPct.toFixed(1)}%
              </span>
            )}
          </div>
        ) : (
          <div className="card__placeholder">
            Run analysis to populate the clinical summary.
          </div>
        )}
      </section>

      <div className="classification-card__stats">
        <section className="classification-card__slope">
          <span className="classification-card__stat-label">Slope</span>
          <strong className="classification-card__stat-value">
            {selectedModel?.slope != null ? (
              <>
                {selectedModel.slope.toFixed(3)}
                <span className="stat-unit"> arcmin/Δ</span>
              </>
            ) : (
              "--"
            )}
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
            ) : (
              "--"
            )}
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
            ) : (
              "N/A"
            )}
          </strong>
          <span className="summary-stat__meta">
            Nearest x where measured y = 0
          </span>
        </section>
      </div>
    </article>
  );
}
