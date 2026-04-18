import { useEffect, useId, useState } from "react";
import { MetricsTable } from "./MetricsTable";
import type { ComputeResponse } from "../types/fdc";

type AdvancedMetricsSectionProps = {
  result: ComputeResponse | null;
};

export function AdvancedMetricsSection({
  result,
}: AdvancedMetricsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (result === null) {
      setIsExpanded(false);
    }
  }, [result]);

  return (
    <article
      className={
        isExpanded
          ? "card card--advanced-metrics card--advanced-metrics-open"
          : "card card--advanced-metrics"
      }
    >
      <div className="advanced-metrics__header">
        <div className="advanced-metrics__intro">
          <h3 className="card__title">Advanced Fit Metrics</h3>
          <p className="advanced-metrics__description">
            Review per-model SSE, RMSE, and slope values for technical fit
            comparison.
          </p>
        </div>

        <button
          type="button"
          className="advanced-metrics__toggle"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {isExpanded ? (
        <div id={panelId} className="advanced-metrics__panel">
          <MetricsTable result={result} />
        </div>
      ) : null}
    </article>
  );
}
