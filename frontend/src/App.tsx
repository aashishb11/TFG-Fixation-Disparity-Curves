import { useMemo, useRef, useState } from "react";
import "./App.css";
import { computeFits } from "./api/fdc";
import { ClassificationCard } from "./components/ClassificationCard";
import { CurveChart } from "./components/CurveChart";
import { InputPanel } from "./components/InputPanel";
import { MetricsTable } from "./components/MetricsTable";
import { PageHeader } from "./components/PageHeader";
import { FIXED_X_VALUES } from "./constants/fdc";
import { mergeModelCurves } from "./lib/chart";
import { exportSvgToPng } from "./lib/exportChart";
import { parseYValues } from "./lib/input";
import type { ComputeResponse } from "./types/fdc";

export default function App() {
  const [yValues, setYValues] = useState<string[]>(
    () => Array(FIXED_X_VALUES.length).fill(""),
  );
  const [response, setResponse] = useState<ComputeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const mergedCurve = useMemo(() => mergeModelCurves(response), [response]);

  const handleInputChange = (index: number, value: string) => {
    setYValues((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    );
  };

  const handleCompute = async () => {
    setError(null);

    const parsed = parseYValues(yValues);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const nextResponse = await computeFits(parsed.values);
      setResponse(nextResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Computation error.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportSvgToPng(chartRef.current, "Fixation_Disparity_Analysis.png");
  };

  return (
    <div className="app-shell">
      <PageHeader canExport={Boolean(response)} onExport={handleExport} />

      <div className="app-body">
        <InputPanel
          error={error}
          loading={loading}
          xValues={FIXED_X_VALUES}
          yValues={yValues}
          onChange={handleInputChange}
          onSubmit={handleCompute}
        />

        <main className="dashboard">
          <section className="dashboard-grid">
            <MetricsTable result={response} />
            <ClassificationCard result={response} />
          </section>

          <CurveChart
            chartRef={chartRef}
            data={mergedCurve}
            measured={response?.measured ?? []}
          />
        </main>
      </div>
    </div>
  );
}
