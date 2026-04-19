import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type RefObject,
} from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  usePlotArea,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_DOMAIN,
  AXIS_TICKS,
  MEASURED_DATA_COLOR,
  MODEL_CHART_LABELS,
  MODEL_COLORS,
  MODEL_KEYS,
} from "../constants/fdc";
import { getPatientLimitMarkers } from "../lib/chartAnnotations";
import {
  areHoverSnapshotsEqual,
  getHoverSnapshotFromX,
  pixelRatioToAxisX,
} from "../lib/chartHover";
import { ExportMenu } from "./ExportMenu";
import type { HoverSnapshot, MergedCurvePoint, ModelKey, Point } from "../types/fdc";

type CurveChartProps = {
  bestModel: ModelKey | null;
  canExport: boolean;
  chartRef: RefObject<HTMLDivElement | null>;
  data: MergedCurvePoint[];
  measured: Point[];
  onExportPdf: () => void;
  onExportPng: () => void;
  onHoverSnapshotChange?: (snapshot: HoverSnapshot | null) => void;
};

function PlotHoverLayer({
  data,
  measured,
  onHoverChange,
  onHoverLeave,
}: {
  data: MergedCurvePoint[];
  measured: Point[];
  onHoverChange: (nextSnapshot: HoverSnapshot | null) => void;
  onHoverLeave: () => void;
}) {
  const plotArea = usePlotArea();

  if (!plotArea || data.length === 0) {
    return null;
  }

  const handleMouseMove: MouseEventHandler<SVGRectElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, relativeX / rect.width));
    const xValue = pixelRatioToAxisX(clampedRatio);

    onHoverChange(getHoverSnapshotFromX(xValue, data, measured));
  };

  return (
    <g>
      <rect
        aria-hidden="true"
        fill="transparent"
        height={plotArea.height}
        onMouseLeave={onHoverLeave}
        onMouseMove={handleMouseMove}
        pointerEvents="all"
        style={{ cursor: "crosshair" }}
        width={plotArea.width}
        x={plotArea.x}
        y={plotArea.y}
      />
    </g>
  );
}

function HoverGuideLine({ xValue }: { xValue: number }) {
  const plotArea = usePlotArea();

  if (!plotArea) {
    return null;
  }

  return (
    <ReferenceLine
      ifOverflow="discard"
      stroke="#90a8ba"
      strokeDasharray="5 5"
      strokeWidth={1.15}
      x={xValue}
    />
  );
}

function HoverGuidePoint({
  xValue,
  yValue,
}: {
  xValue: number;
  yValue: number | null;
}) {
  if (yValue === null) {
    return null;
  }

  return (
    <ReferenceDot
      fill={MEASURED_DATA_COLOR}
      ifOverflow="discard"
      r={5.5}
      stroke="#f8fbfd"
      strokeWidth={1.4}
      x={xValue}
      y={yValue}
    />
  );
}

function getTooltipCursor() {
  return false;
}

function renderEmptyTooltip() {
  return null;
}

function ensureHoverSnapshotUpdate(
  current: HoverSnapshot | null,
  nextSnapshot: HoverSnapshot | null,
): HoverSnapshot | null {
  if (areHoverSnapshotsEqual(current, nextSnapshot)) {
    return current;
  }

  return nextSnapshot;
}

function getChartLineOpacity(bestModel: ModelKey | null, modelKey: ModelKey): number {
  if (bestModel === null) {
    return 0.94;
  }

  return modelKey === bestModel ? 1 : 0.58;
}

function getChartLineWidth(bestModel: ModelKey | null, modelKey: ModelKey): number {
  if (bestModel === null) {
    return 3.4;
  }

  return modelKey === bestModel ? 4.6 : 2.85;
}

function shouldRenderBestModelHalo(bestModel: ModelKey | null): bestModel is ModelKey {
  return bestModel !== null;
}

function getLegendItems(bestModel: ModelKey | null) {
  return [
    {
      color: MEASURED_DATA_COLOR,
      key: "Measured Data",
      label: "Measured Data",
      selected: false,
    },
    ...MODEL_KEYS.map((modelKey) => ({
      color: MODEL_COLORS[modelKey],
      key: modelKey,
      label: MODEL_CHART_LABELS[modelKey],
      selected: bestModel === modelKey,
    })),
  ];
}

function getYAxisLabelPosition(plotAreaX: number, plotAreaY: number, plotAreaHeight: number) {
  return {
    x: Math.max(40, plotAreaX - 84),
    y: plotAreaY + plotAreaHeight / 2 + 12,
  };
}

function getCentralXAxisTextOffset(tick: number): {
  textAnchor: "start" | "end" | "middle";
  textX: number;
} {
  const isMinimum = tick === AXIS_DOMAIN[0];
  const isMaximum = tick === AXIS_DOMAIN[1];
  const isOrigin = tick === 0;

  return {
    textAnchor: isMinimum
      ? "start"
      : isMaximum
        ? "end"
        : isOrigin
          ? "start"
          : "middle",
    textX: isMinimum ? 2 : isMaximum ? -2 : isOrigin ? 8 : 0,
  };
}

function getMeasuredHoverPointY(snapshot: HoverSnapshot | null): number | null {
  if (snapshot === null || snapshot.measuredValue === null) {
    return null;
  }

  return snapshot.measuredValue;
}

function getMeasuredHoverPointX(snapshot: HoverSnapshot | null): number | null {
  if (snapshot === null || snapshot.measuredValue === null) {
    return null;
  }

  return snapshot.x;
}

function isHoverActive(snapshot: HoverSnapshot | null): snapshot is HoverSnapshot {
  return snapshot !== null;
}

function useStableLegendItems(bestModel: ModelKey | null) {
  return useMemo(() => getLegendItems(bestModel), [bestModel]);
}

function useStablePatientLimitMarkers(measured: Point[]) {
  return useMemo(() => getPatientLimitMarkers(measured), [measured]);
}

function useHoverUpdater() {
  const [hoverSnapshot, setHoverSnapshot] = useState<HoverSnapshot | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingSnapshotRef = useRef<HoverSnapshot | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const flushHoverSnapshot = () => {
    frameRef.current = null;
    setHoverSnapshot((current) =>
      ensureHoverSnapshotUpdate(current, pendingSnapshotRef.current),
    );
  };

  const updateHoverSnapshot = (nextSnapshot: HoverSnapshot | null) => {
    pendingSnapshotRef.current = nextSnapshot;

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = requestAnimationFrame(flushHoverSnapshot);
  };

  const clearHoverSnapshot = () => {
    pendingSnapshotRef.current = null;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setHoverSnapshot((current) => (current === null ? current : null));
  };

  return { hoverSnapshot, updateHoverSnapshot, clearHoverSnapshot };
}

const TooltipPlaceholder = () => (
  <Tooltip
    content={renderEmptyTooltip}
    cursor={getTooltipCursor()}
    isAnimationActive={false}
  />
);

function ChartHighlightDefs({ glowFilterId }: { glowFilterId: string }) {
  return (
    <defs>
      <filter
        id={glowFilterId}
        height="180%"
        width="180%"
        x="-40%"
        y="-40%"
      >
        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="2.4" />
        <feColorMatrix
          in="blur"
          result="glow"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 0.22 0"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function ClinicalYAxisTitle() {
  const plotArea = usePlotArea();

  if (!plotArea) {
    return null;
  }

  const labelPosition = getYAxisLabelPosition(
    plotArea.x,
    plotArea.y,
    plotArea.height,
  );

  return (
    <g aria-hidden="true" pointerEvents="none">
      <text
        fill="#557089"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        transform={`rotate(-90, ${labelPosition.x}, ${labelPosition.y})`}
        x={labelPosition.x}
        y={labelPosition.y}
      >
        Fixation Disparity (arcmin)
      </text>
    </g>
  );
}

function CentralXAxisTickMarker({ tick }: { tick: number }) {
  const { textAnchor, textX } = getCentralXAxisTextOffset(tick);

  return (
    <ReferenceDot
      fill="none"
      ifOverflow="discard"
      r={0}
      stroke="none"
      x={tick}
      y={0}
      zIndex={650}
      shape={(props: { cx?: number; cy?: number }) => {
        if (typeof props.cx !== "number" || typeof props.cy !== "number") {
          return <g />;
        }

        return (
          <g aria-hidden="true" transform={`translate(${props.cx}, ${props.cy})`}>
            <line
              stroke="#9ab1c2"
              strokeWidth={1}
              x1={0}
              x2={0}
              y1={-5}
              y2={5}
            />
            <text
              fill="#577087"
              fontSize={11}
              fontWeight={600}
              paintOrder="stroke"
              stroke="#f8fbfd"
              strokeWidth={3}
              textAnchor={textAnchor}
              x={textX}
              y={18}
            >
              {tick}
            </text>
          </g>
        );
      }}
    />
  );
}

export const CurveChart = memo(function CurveChart({
  bestModel,
  canExport,
  chartRef,
  data,
  measured,
  onExportPdf,
  onExportPng,
  onHoverSnapshotChange,
}: CurveChartProps) {
  const { hoverSnapshot, updateHoverSnapshot, clearHoverSnapshot } =
    useHoverUpdater();
  const glowFilterId = useId().replace(/:/g, "");

  const patientLimitMarkers = useStablePatientLimitMarkers(measured);
  const legendItems = useStableLegendItems(bestModel);

  useEffect(() => {
    onHoverSnapshotChange?.(hoverSnapshot);
  }, [hoverSnapshot, onHoverSnapshotChange]);

  const getCurveOpacity = useCallback(
    (modelKey: ModelKey): number => getChartLineOpacity(bestModel, modelKey),
    [bestModel],
  );

  const getCurveWidth = useCallback(
    (modelKey: ModelKey): number => getChartLineWidth(bestModel, modelKey),
    [bestModel],
  );

  return (
    <section className="card chart-card">
      <div className="chart-card__header">
        <h3 className="card__title">Fixation Disparity Curve Visualization</h3>
        {canExport ? (
          <ExportMenu
            onDownloadPdf={onExportPdf}
            onDownloadPng={onExportPng}
          />
        ) : null}
      </div>

      <div className="chart-card__meta">
        <div className="chart-card__meta-main">
          <div className="chart-legend" aria-label="Chart legend">
            {legendItems.map((item) => (
              <span
                key={item.key}
                className={`chart-legend__item${
                  item.selected ? " chart-legend__item--active" : ""
                }`}
              >
                <span
                  className="chart-legend__swatch"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card__plot-shell">
        <div ref={chartRef} className="chart-card__container">
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 26, left: 42, bottom: 56 }}
            >
              <ChartHighlightDefs glowFilterId={glowFilterId} />
              <CartesianGrid
                stroke="#dbe7ef"
                strokeDasharray="4 6"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="x"
                domain={AXIS_DOMAIN}
                label={{
                  value: "Vergence Demand (Prism Diopter)",
                  position: "bottom",
                  offset: 28,
                  fill: "#557089",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                tick={false}
                tickLine={false}
                ticks={AXIS_TICKS}
                type="number"
              />
              <YAxis
                axisLine={false}
                domain={AXIS_DOMAIN}
                tickMargin={8}
                tick={{ fill: "#5c7288", fontSize: 12 }}
                tickLine={{ stroke: "#c9d8e4" }}
                ticks={AXIS_TICKS}
                type="number"
                width={94}
              />
              <ClinicalYAxisTitle />
              <ReferenceLine stroke="#a6b9c8" strokeWidth={1.25} x={0} />
              <ReferenceLine stroke="#889fb2" strokeWidth={1.45} y={0} />
              {AXIS_TICKS.map((tick) => (
                <CentralXAxisTickMarker key={tick} tick={tick} />
              ))}
              <TooltipPlaceholder />
              {isHoverActive(hoverSnapshot) ? (
                <HoverGuideLine xValue={hoverSnapshot.x} />
              ) : null}

              {shouldRenderBestModelHalo(bestModel) ? (
                <Line
                  activeDot={false}
                  dataKey={bestModel}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                  stroke={MODEL_COLORS[bestModel]}
                  strokeLinecap="round"
                  strokeOpacity={0.2}
                  strokeWidth={8.2}
                  type="monotone"
                />
              ) : null}

              {MODEL_KEYS.map((modelKey) => (
                <Line
                  activeDot={false}
                  key={modelKey}
                  dataKey={modelKey}
                  dot={false}
                  isAnimationActive={false}
                  name={MODEL_CHART_LABELS[modelKey]}
                  opacity={getCurveOpacity(modelKey)}
                  stroke={MODEL_COLORS[modelKey]}
                  strokeLinecap="round"
                  style={
                    bestModel === modelKey
                      ? { filter: `url(#${glowFilterId})` }
                      : undefined
                  }
                  strokeWidth={getCurveWidth(modelKey)}
                  type="monotone"
                />
              ))}

              {patientLimitMarkers.map((limitX, index) => (
                <ReferenceLine
                  key={`patient-limit-${limitX}`}
                  ifOverflow="discard"
                  label={
                    index === 0
                      ? {
                          fill: "#6b8193",
                          fontSize: 10,
                          fontWeight: 600,
                          position: "insideTop",
                          value: "Patient Limit",
                        }
                      : undefined
                  }
                  stroke="#768fa2"
                  strokeDasharray="5 7"
                  strokeWidth={1.35}
                  x={limitX}
                />
              ))}

              <Scatter
                data={measured}
                dataKey="y"
                fill={MEASURED_DATA_COLOR}
                name="Measured Data"
                stroke="#f8fbfd"
                strokeWidth={1.4}
              />
              <HoverGuidePoint
                xValue={getMeasuredHoverPointX(hoverSnapshot) ?? 0}
                yValue={getMeasuredHoverPointY(hoverSnapshot)}
              />
              <PlotHoverLayer
                data={data}
                measured={measured}
                onHoverChange={updateHoverSnapshot}
                onHoverLeave={clearHoverSnapshot}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
});
