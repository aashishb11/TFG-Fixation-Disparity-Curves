import { useId, type CSSProperties } from "react";
import {
  MODEL_COLORS,
  MODEL_DISPLAY_LABELS,
  MODEL_KEYS,
} from "../constants/fdc";
import type { ComputeResponse } from "../types/fdc";

type MetricsTableProps = {
  result: ComputeResponse | null;
};

type MetricHeaderTooltipProps = {
  description: string;
  label: string;
};

const METRIC_TOOLTIPS = {
  rmse: "Root Mean Square Error. Lower values summarize fit error on the scale of the measured data.",
  slope:
    "Paper slope descriptor for the fitted curve, computed as |f(3) - f(-3)| / 6.",
  sse: "Sum of Squared Errors. Lower values indicate less overall fit error.",
} as const;

function hexToRgba(hexColor: string, alpha: number): string {
  const normalizedHex = hexColor.replace("#", "");
  const expandedHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalizedHex;

  const parsedValue = Number.parseInt(expandedHex, 16);
  const red = (parsedValue >> 16) & 255;
  const green = (parsedValue >> 8) & 255;
  const blue = parsedValue & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildActiveRowStyle(modelColor: string): CSSProperties {
  return {
    "--metric-row-accent": hexToRgba(modelColor, 0.22),
    "--metric-row-border": hexToRgba(modelColor, 0.38),
    "--metric-row-sheen": hexToRgba(modelColor, 0.08),
  } as CSSProperties;
}

function MetricHeaderTooltip({
  description,
  label,
}: MetricHeaderTooltipProps) {
  const tooltipId = useId();

  return (
    <span className="metric-tooltip">
      <button
        aria-describedby={tooltipId}
        className="metric-tooltip__trigger"
        type="button"
      >
        <span className="metric-tooltip__label">{label}</span>
      </button>
      <span id={tooltipId} className="metric-tooltip__content" role="tooltip">
        <span className="metric-tooltip__title">{label}</span>
        <span className="metric-tooltip__body">{description}</span>
      </span>
    </span>
  );
}

export function MetricsTable({ result }: MetricsTableProps) {
  if (!result) {
    return <div className="card__placeholder">Awaiting computation...</div>;
  }

  return (
    <div className="metric-table__wrap">
      <table className="metric-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>
              <MetricHeaderTooltip
                description={METRIC_TOOLTIPS.sse}
                label="SSE"
              />
            </th>
            <th>
              <MetricHeaderTooltip
                description={METRIC_TOOLTIPS.rmse}
                label="RMSE"
              />
            </th>
            <th>
              <MetricHeaderTooltip
                description={METRIC_TOOLTIPS.slope}
                label="Slope"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {MODEL_KEYS.map((modelKey) => {
            const model = result.models[modelKey];
            const isBestFit = result.classification.best_by_sse === modelKey;

            return (
              <tr
                key={modelKey}
                className={
                  isBestFit
                    ? "metric-table__row metric-table__row--active"
                    : "metric-table__row"
                }
                style={isBestFit ? buildActiveRowStyle(MODEL_COLORS[modelKey]) : undefined}
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
    </div>
  );
}
