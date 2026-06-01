import type { CSSProperties } from "react";
import { MODEL_CHART_LABELS, MODEL_COLORS } from "../constants/fdc";
import { deriveClinicalMeasurements } from "../lib/clinicalSummary";
import type { CompatibleClassification, ComputeResponse } from "../types/fdc";

type ClassificationCardProps = {
  result: ComputeResponse | null;
  compatibleModels: CompatibleClassification[];
};

export function ClassificationCard({ result, compatibleModels }: ClassificationCardProps) {
  const selectedModelKey = result?.classification.best_by_sse ?? null;
  const selectedModel =
    result === null ? null : result.models[result.classification.best_by_sse];
  const clinicalMeasurements = deriveClinicalMeasurements(result?.measured ?? []);

  const cardStyle = selectedModelKey
    ? ({ "--card-accent-color": MODEL_COLORS[selectedModelKey] } as CSSProperties)
    : undefined;

  return (
    <article className="card card--classification" style={cardStyle}>
      <section className="classification-card__primary classification-card__primary--list">
        <h3 className="card__title">Classification</h3>
        {result ? (
          <div className="classification-compat-list">
            <span className="classification-compat-list__heading">
              Compatible types — NRMSE &lt; 10%
            </span>
            {compatibleModels.length > 0 ? (
              <ul className="classification-compat-list__items">
                {compatibleModels.map(({ modelKey, errorPct, isBest }) => (
                  <li key={modelKey} className="classification-compat-list__row">
                    <span
                      className="classification-compat-list__swatch"
                      style={{ backgroundColor: MODEL_COLORS[modelKey] }}
                    />
                    <span className="classification-compat-list__name">
                      {MODEL_CHART_LABELS[modelKey]}
                    </span>
                    <span className="classification-compat-list__error">
                      {errorPct.toFixed(1)}%
                    </span>
                    {isBest ? (
                      <span className="classification-compat-list__badge">
                        best
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="classification-compat-list__empty">
                No curve type has fitting error below 10%.
              </p>
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
