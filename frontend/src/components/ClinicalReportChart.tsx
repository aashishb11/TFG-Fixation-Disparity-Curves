import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_DOMAIN,
  AXIS_TICKS,
  MEASURED_DATA_COLOR,
  MODEL_COLORS,
} from "../constants/fdc";
import { getPatientLimitMarkers } from "../lib/chartAnnotations";
import type { MergedCurvePoint, ModelKey, Point } from "../types/fdc";

type ClinicalReportChartProps = {
  bestModel: ModelKey;
  data: MergedCurvePoint[];
  measured: Point[];
};

export function ClinicalReportChart({
  bestModel,
  data,
  measured,
}: ClinicalReportChartProps) {
  const patientLimitMarkers = getPatientLimitMarkers(measured);

  return (
    <div className="report-chart-surface">
      <ComposedChart
        data={data}
        height={420}
        margin={{ bottom: 56, left: 30, right: 24, top: 20 }}
        width={780}
      >
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
            offset: 20,
            position: "bottom",
            fill: "#557089",
            fontSize: 12,
            fontWeight: 600,
          }}
          tick={{ fill: "#587088", fontSize: 11 }}
          tickLine={{ stroke: "#c9d8e4" }}
          ticks={AXIS_TICKS}
          type="number"
        />
        <YAxis
          axisLine={false}
          domain={AXIS_DOMAIN}
          label={{
            angle: -90,
            position: "insideLeft",
            value: "Fixation Disparity (arcmin)",
            fill: "#557089",
            fontSize: 12,
            fontWeight: 600,
          }}
          tick={{ fill: "#5c7288", fontSize: 11 }}
          tickLine={{ stroke: "#c9d8e4" }}
          ticks={AXIS_TICKS}
          type="number"
          width={78}
        />
        <ReferenceLine stroke="#a7bac8" strokeWidth={1.1} x={0} />
        <ReferenceLine stroke="#8a9fb1" strokeWidth={1.25} y={0} />

        <Line
          activeDot={false}
          dataKey={bestModel}
          dot={false}
          isAnimationActive={false}
          legendType="none"
          stroke={MODEL_COLORS[bestModel]}
          strokeLinecap="round"
          strokeOpacity={0.18}
          strokeWidth={7.2}
          type="monotone"
        />
        <Line
          activeDot={false}
          dataKey={bestModel}
          dot={false}
          isAnimationActive={false}
          stroke={MODEL_COLORS[bestModel]}
          strokeLinecap="round"
          strokeWidth={4.3}
          type="monotone"
        />

        {patientLimitMarkers.map((limitX) => (
          <ReferenceLine
            key={`report-patient-limit-${limitX}`}
            ifOverflow="discard"
            stroke="#7890a3"
            strokeDasharray="5 7"
            strokeWidth={1.3}
            x={limitX}
          />
        ))}

        <Scatter
          data={measured}
          dataKey="y"
          fill={MEASURED_DATA_COLOR}
          stroke="#f8fbfd"
          strokeWidth={1.4}
        />
      </ComposedChart>
    </div>
  );
}
