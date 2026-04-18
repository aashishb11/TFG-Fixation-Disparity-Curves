import type { RefObject } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  return (
    <section className="card chart-card">
      <div className="chart-card__header">
        <h3 className="card__title">Regression Visualization</h3>
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
            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid
              stroke="#dbe6ee"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={{ stroke: "#c9d8e4" }}
              dataKey="x"
              domain={AXIS_DOMAIN}
              label={{
                value: "Input",
                position: "bottom",
                offset: 20,
                fill: "#5c7288",
              }}
              tick={{ fill: "#5c7288", fontSize: 12 }}
              tickLine={{ stroke: "#c9d8e4" }}
              ticks={AXIS_TICKS}
              type="number"
            />
            <YAxis
              axisLine={{ stroke: "#c9d8e4" }}
              domain={AXIS_DOMAIN}
              label={{
                value: "Patient's input",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fill: "#5c7288",
              }}
              stroke="#a8bac8"
              tick={{ fill: "#5c7288", fontSize: 12 }}
              tickLine={{ stroke: "#c9d8e4" }}
              ticks={AXIS_TICKS}
              type="number"
            />
            <ReferenceLine stroke="#a8bac8" strokeWidth={1.5} x={0} />
            <ReferenceLine stroke="#a8bac8" strokeWidth={1.5} y={0} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#f8fbfd",
                borderRadius: "8px",
                border: "1px solid #c9d8e4",
                boxShadow: "0 10px 20px rgba(24, 50, 74, 0.08)",
              }}
            />
            <Legend align="right" iconType="circle" verticalAlign="top" />

            {MODEL_KEYS.map((modelKey) => (
              <Line
                key={modelKey}
                dataKey={modelKey}
                dot={false}
                isAnimationActive={false}
                name={MODEL_CHART_LABELS[modelKey]}
                stroke={MODEL_COLORS[modelKey]}
                strokeWidth={3}
                type="monotone"
              />
            ))}

            <Scatter
              data={measured}
              dataKey="y"
              fill="#18324a"
              name="Measured Data"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
