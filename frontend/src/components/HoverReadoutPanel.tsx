import { useMemo } from "react";
import {
  MEASURED_DATA_COLOR,
  MODEL_CHART_LABELS,
  MODEL_COLORS,
  MODEL_KEYS,
} from "../constants/fdc";
import type { ModelKey } from "../types/fdc";

export type HoverSnapshot = {
  x: number;
  measuredValue: number | null;
  modelValues: Partial<Record<ModelKey, number>>;
};

type HoverReadoutPanelProps = {
  bestModel: ModelKey | null;
  className?: string;
  hoverSnapshot: HoverSnapshot | null;
};

function buildHoverHintText(): string {
  return "Move across the plot to inspect curve values. Measured input appears when the cursor is near an actual patient measurement.";
}

function formatClinicalValue(value: number): string {
  return value.toFixed(2);
}

function getOrderedModelKeys(bestModel: ModelKey | null): ModelKey[] {
  return bestModel === null
    ? [...MODEL_KEYS]
    : [bestModel, ...MODEL_KEYS.filter((modelKey) => modelKey !== bestModel)];
}

function getHoverPanelTitle(snapshot: HoverSnapshot): string {
  return `${formatClinicalValue(snapshot.x)} Prism Diopter`;
}

function getPanelClassName(className?: string): string {
  return className === undefined
    ? "chart-hover-panel"
    : `chart-hover-panel ${className}`;
}

export function HoverReadoutPanel({
  bestModel,
  className,
  hoverSnapshot,
}: HoverReadoutPanelProps) {
  const orderedModelKeys = useMemo(
    () => getOrderedModelKeys(bestModel),
    [bestModel],
  );

  return (
    <aside className={getPanelClassName(className)} aria-live="polite">
      {hoverSnapshot === null ? (
        <>
          <div className="chart-hover-panel__heading">
            <span className="chart-hover-panel__eyebrow">Hover Readout</span>
            <strong className="chart-hover-panel__title">
              Inspect Curve Values
            </strong>
          </div>
          <p className="chart-hover-panel__hint">{buildHoverHintText()}</p>
        </>
      ) : (
        <>
          <div className="chart-hover-panel__heading">
            <span className="chart-hover-panel__eyebrow">Vergence Demand</span>
            <strong className="chart-hover-panel__title">
              {getHoverPanelTitle(hoverSnapshot)}
            </strong>
          </div>

          <div className="chart-hover-panel__rows">
            <div
              className={`chart-hover-panel__row${
                hoverSnapshot.measuredValue === null
                  ? " chart-hover-panel__row--placeholder"
                  : ""
              }`}
            >
              <span className="chart-hover-panel__label">
                <span
                  className="chart-hover-panel__dot"
                  style={{ backgroundColor: MEASURED_DATA_COLOR }}
                />
                Measured Data
              </span>
              <span
                className={`chart-hover-panel__value${
                  hoverSnapshot.measuredValue === null
                    ? " chart-hover-panel__value--muted"
                    : ""
                }`}
              >
                {hoverSnapshot.measuredValue === null
                  ? "--"
                  : `${formatClinicalValue(hoverSnapshot.measuredValue)} arcmin`}
              </span>
            </div>

            {orderedModelKeys.map((modelKey) => {
              const value = hoverSnapshot.modelValues[modelKey];

              if (typeof value !== "number") {
                return null;
              }

              const isSelectedModel = bestModel === modelKey;

              return (
                <div
                  key={modelKey}
                  className={`chart-hover-panel__row${
                    isSelectedModel ? " chart-hover-panel__row--selected" : ""
                  }`}
                >
                  <span className="chart-hover-panel__label">
                    <span
                      className="chart-hover-panel__dot"
                      style={{ backgroundColor: MODEL_COLORS[modelKey] }}
                    />
                    {MODEL_CHART_LABELS[modelKey]}
                    {isSelectedModel ? " (selected)" : ""}
                  </span>
                  <span className="chart-hover-panel__value">
                    {formatClinicalValue(value)} arcmin
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}
