import { MODEL_DISPLAY_LABELS, MODEL_KEYS } from "../constants/fdc";
import type { ComputeResponse } from "../types/fdc";

type MetricsTableProps = {
  result: ComputeResponse | null;
};

export function MetricsTable({ result }: MetricsTableProps) {
  return (
    <article className="card">
      <h3 className="card__title">Fit Accuracy Metrics</h3>

      {!result ? (
        <div className="card__placeholder">Awaiting computation...</div>
      ) : (
        <table className="metric-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>SSE</th>
              <th>RMSE</th>
              <th>Slope</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_KEYS.map((modelKey) => {
              const model = result.models[modelKey];
              const isBestFit = result.classification.best_by_sse === modelKey;

              return (
                <tr
                  key={modelKey}
                  className={isBestFit ? "metric-table__row metric-table__row--active" : "metric-table__row"}
                >
                  <td>{MODEL_DISPLAY_LABELS[modelKey]}</td>
                  <td>{model.sse.toFixed(3)}</td>
                  <td>{model.rmse.toFixed(3)}</td>
                  <td>{model.slope.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </article>
  );
}
