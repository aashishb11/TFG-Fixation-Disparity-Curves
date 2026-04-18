import { useMemo, useRef, useState } from "react";
import "./App.css";
import { computeFits } from "./api/fdc";
import { ClassificationCard } from "./components/ClassificationCard";
import { CurveChart } from "./components/CurveChart";
import { InputPanel } from "./components/InputPanel";
import { MetricsTable } from "./components/MetricsTable";
import { PageHeader } from "./components/PageHeader";
import { FIXED_X_VALUES, getPresetValuesForFixedX } from "./constants/fdc";
import { mergeModelCurves } from "./lib/chart";
import { exportSvgToPng } from "./lib/exportChart";
import { parseYValues, validateViewingDistance } from "./lib/input";
import type {
  ComputeResponse,
  PresetViewingDistance,
  ViewingDistance,
} from "./types/fdc";

export default function App() {
  const computationVersionRef = useRef(0);
  const emptyYValues = useMemo(
    () => Array(FIXED_X_VALUES.length).fill(""),
    [],
  );
  const [viewingDistance, setViewingDistance] = useState<ViewingDistance | "">(
    "",
  );
  const [customDistance, setCustomDistance] = useState("");
  const [customDistanceTouched, setCustomDistanceTouched] = useState(false);
  const [yValues, setYValues] = useState<string[]>(() => emptyYValues);
  const [response, setResponse] = useState<ComputeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const mergedCurve = useMemo(() => mergeModelCurves(response), [response]);

  const resetComputedResults = () => {
    computationVersionRef.current += 1;
    setResponse(null);
    setLoading(false);
  };

  const handleInputChange = (index: number, value: string) => {
    setError(null);
    setYValues((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    );
  };

  const handleDistanceChange = (nextDistance: ViewingDistance | "") => {
    resetComputedResults();
    setError(null);
    setViewingDistance(nextDistance);
    setCustomDistanceTouched(false);

    if (nextDistance === "40cm" || nextDistance === "25cm") {
      setYValues(
        getPresetValuesForFixedX(nextDistance as PresetViewingDistance),
      );
      return;
    }

    setYValues(emptyYValues);
  };

  const handleCustomDistanceChange = (value: string) => {
    if (viewingDistance === "other") {
      resetComputedResults();
    }
    setError(null);
    setCustomDistance(value);
  };

  const handleCustomDistanceBlur = () => {
    setCustomDistanceTouched(true);
  };

  const handleCompute = async () => {
    setError(null);

    const viewingDistanceValidation = validateViewingDistance(
      viewingDistance,
      customDistance,
    );
    if (!viewingDistanceValidation.ok) {
      if (viewingDistanceValidation.field === "customDistance") {
        setCustomDistanceTouched(true);
      }
      return;
    }

    const parsed = parseYValues(yValues);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setLoading(true);
    const computationVersion = computationVersionRef.current + 1;
    computationVersionRef.current = computationVersion;

    try {
      const nextResponse = await computeFits(parsed.values);
      if (computationVersionRef.current === computationVersion) {
        setResponse(nextResponse);
      }
    } catch (requestError) {
      if (computationVersionRef.current === computationVersion) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Computation error.",
        );
      }
    } finally {
      if (computationVersionRef.current === computationVersion) {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    exportSvgToPng(chartRef.current, "Fixation_Disparity_Analysis.png");
  };

  return (
    <div className="app-shell">
      <PageHeader />

      <div className="app-body">
        <InputPanel
          customDistance={customDistance}
          customDistanceTouched={customDistanceTouched}
          error={error}
          loading={loading}
          selectedDistance={viewingDistance}
          xValues={FIXED_X_VALUES}
          yValues={yValues}
          onChange={handleInputChange}
          onCustomDistanceBlur={handleCustomDistanceBlur}
          onCustomDistanceChange={handleCustomDistanceChange}
          onDistanceChange={handleDistanceChange}
          onSubmit={handleCompute}
        />

        <main className="dashboard">
          <section className="dashboard-grid">
            <ClassificationCard result={response} />
            <MetricsTable result={response} />
          </section>

          <CurveChart
            canExport={Boolean(response)}
            chartRef={chartRef}
            data={mergedCurve}
            measured={response?.measured ?? []}
            onExport={handleExport}
          />
        </main>
      </div>
    </div>
  );
}
