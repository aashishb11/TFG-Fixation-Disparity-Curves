import type { RefObject } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_DOMAIN,
  AXIS_TICKS,
  MODEL_CHART_LABELS,
  MODEL_COLORS,
  MODEL_KEYS,
} from "../constants/fdc";
import type { MergedCurvePoint, Point } from "../types/fdc";

type CurveChartProps = {
  canExport: boolean;
  chartRef: RefObject<HTMLDivElement | null>;
  data: MergedCurvePoint[];
  measured: Point[];
  onExport: () => void;
};

export function CurveChart({
  canExport,
  chartRef,
  data,
  measured,
  onExport,
}: CurveChartProps) {
  function CentralXAxisTickMarker({ tick }: { tick: number }) {
    const isMinimum = tick === AXIS_DOMAIN[0];
    const isMaximum = tick === AXIS_DOMAIN[1];
    const isOrigin = tick === 0;
    const textAnchor = isMinimum
      ? "start"
      : isMaximum
        ? "end"
        : isOrigin
          ? "start"
          : "middle";
    const textX = isMinimum ? 2 : isMaximum ? -2 : isOrigin ? 8 : 0;

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

  return (
    <section className="card chart-card">
      <div className="chart-card__header">
        <h3 className="card__title">Fixation Disparity Curve Visualization</h3>
        {canExport ? (
          <button
            className="button button--secondary chart-card__action"
            onClick={onExport}
            type="button"
          >
            Export High-Res PNG
          </button>
        ) : null}
      </div>
      <div ref={chartRef} className="chart-card__container">
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 16, right: 32, left: 28, bottom: 56 }}
          >
            <CartesianGrid
              stroke="#d9e5ed"
              strokeDasharray="4 4"
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
              label={{
                value: "Fixation Disparity (arcmin)",
                angle: -90,
                position: "insideLeft",
                offset: -8,
                fill: "#557089",
                fontSize: 13,
                fontWeight: 600,
              }}
              tickMargin={8}
              tick={{ fill: "#5c7288", fontSize: 12 }}
              tickLine={{ stroke: "#c9d8e4" }}
              ticks={AXIS_TICKS}
              type="number"
              width={78}
            />
            <ReferenceLine stroke="#9fb4c4" strokeWidth={1.35} x={0} />
            <ReferenceLine stroke="#88a2b6" strokeWidth={1.55} y={0} />
            {AXIS_TICKS.map((tick) => (
              <CentralXAxisTickMarker key={tick} tick={tick} />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: "#f8fbfd",
                borderRadius: "8px",
                border: "1px solid #c9d8e4",
                boxShadow: "0 10px 20px rgba(24, 50, 74, 0.08)",
              }}
            />
            <Legend
              align="left"
              iconSize={10}
              iconType="circle"
              verticalAlign="top"
              wrapperStyle={{ fontSize: "12px", paddingBottom: "0.4rem" }}
            />

            {MODEL_KEYS.map((modelKey) => (
              <Line
                key={modelKey}
                dataKey={modelKey}
                dot={false}
                isAnimationActive={false}
                name={MODEL_CHART_LABELS[modelKey]}
                stroke={MODEL_COLORS[modelKey]}
                strokeWidth={2.7}
                type="monotone"
              />
            ))}

            <Scatter
              data={measured}
              dataKey="y"
              fill="#18324a"
              name="Measured Data"
              stroke="#f8fbfd"
              strokeWidth={1.4}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
