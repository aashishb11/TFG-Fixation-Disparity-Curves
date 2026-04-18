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
  chartRef: RefObject<HTMLDivElement | null>;
  data: MergedCurvePoint[];
  measured: Point[];
};

export function CurveChart({ chartRef, data, measured }: CurveChartProps) {
  return (
    <section className="card chart-card">
      <h3 className="card__title">Regression Visualization</h3>
      <div ref={chartRef} className="chart-card__container">
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid
              stroke="#f1f3f5"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="x"
              domain={AXIS_DOMAIN}
              label={{ value: "Input", position: "bottom", offset: 20 }}
              ticks={AXIS_TICKS}
              type="number"
            />
            <YAxis
              domain={AXIS_DOMAIN}
              label={{
                value: "Patient's input",
                angle: -90,
                position: "insideLeft",
                offset: 0,
              }}
              stroke="#adb5bd"
              ticks={AXIS_TICKS}
              type="number"
            />
            <ReferenceLine stroke="#adb5bd" strokeWidth={1.5} x={0} />
            <ReferenceLine stroke="#adb5bd" strokeWidth={1.5} y={0} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
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
              fill="#212529"
              name="Measured Data"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
