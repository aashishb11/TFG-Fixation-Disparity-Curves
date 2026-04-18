import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { computeFits } from "./api/fdc";
import { AdvancedMetricsSection } from "./components/AdvancedMetricsSection";
import { ClassificationCard } from "./components/ClassificationCard";
import { ClinicalReportChart } from "./components/ClinicalReportChart";
import { CurveChart } from "./components/CurveChart";
import {
  HoverReadoutPanel,
  type HoverSnapshot,
} from "./components/HoverReadoutPanel";
import { InputPanel } from "./components/InputPanel";
import { PageHeader } from "./components/PageHeader";
import { PdfExportDialog } from "./components/PdfExportDialog";
import { FIXED_X_VALUES, getPresetValuesForFixedX } from "./constants/fdc";
import { mergeModelCurves } from "./lib/chart";
import { exportSvgToPng, renderSvgToPngDataUrl } from "./lib/exportChart";
import { parseYValues, validateViewingDistance } from "./lib/input";
import {
  EMPTY_REPORT_SUBJECT_DETAILS,
  exportClinicalReportPdf,
  type ReportSubjectDetails,
} from "./lib/pdfReport";
import type {
  ComputeResponse,
  PresetViewingDistance,
  ViewingDistance,
} from "./types/fdc";

type ExportDialogStep = "choice" | "details" | null;

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

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
  const [hoverSnapshot, setHoverSnapshot] = useState<HoverSnapshot | null>(null);
  const [exportDialogStep, setExportDialogStep] = useState<ExportDialogStep>(null);
  const [reportSubjectDetails, setReportSubjectDetails] =
    useState<ReportSubjectDetails>({ ...EMPTY_REPORT_SUBJECT_DETAILS });
  const [exportDialogError, setExportDialogError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const pdfChartRef = useRef<HTMLDivElement | null>(null);

  const mergedCurve = useMemo(() => mergeModelCurves(response), [response]);
  const bestModel = response?.classification.best_by_sse ?? null;

  useEffect(() => {
    setHoverSnapshot(null);
    if (response === null) {
      setExportDialogStep(null);
      setExportDialogError(null);
      setReportSubjectDetails({ ...EMPTY_REPORT_SUBJECT_DETAILS });
    }
  }, [response]);

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

  const resetExportDialog = useCallback(() => {
    setExportDialogStep(null);
    setExportDialogError(null);
    setReportSubjectDetails({ ...EMPTY_REPORT_SUBJECT_DETAILS });
  }, []);

  const handlePngExport = useCallback(async () => {
    setError(null);
    const didExport = await exportSvgToPng(
      chartRef.current,
      "Fixation_Disparity_Analysis.png",
    );

    if (!didExport) {
      setError("PNG export could not be generated.");
    }
  }, []);

  const buildPdfReport = useCallback(
    async (subjectDetails: ReportSubjectDetails) => {
      if (response === null || bestModel === null) {
        return false;
      }

      setExportDialogError(null);
      setIsExportingPdf(true);

      try {
        await waitForNextPaint();
        const chartImage = await renderSvgToPngDataUrl(pdfChartRef.current, {
          backgroundColor: "#ffffff",
          scale: 3,
        });

        if (chartImage === null) {
          throw new Error("The report chart could not be prepared for PDF export.");
        }

        exportClinicalReportPdf({
          bestModel,
          chartImage,
          slope: response.models[bestModel].slope,
          subjectDetails,
        });

        return true;
      } catch (exportError) {
        setExportDialogError(
          exportError instanceof Error
            ? exportError.message
            : "PDF export could not be generated.",
        );
        return false;
      } finally {
        setIsExportingPdf(false);
      }
    },
    [bestModel, response],
  );

  const handleOpenPdfDialog = useCallback(() => {
    setExportDialogError(null);
    setReportSubjectDetails({ ...EMPTY_REPORT_SUBJECT_DETAILS });
    setExportDialogStep("choice");
  }, []);

  const handleClosePdfDialog = useCallback(() => {
    if (isExportingPdf) {
      return;
    }

    resetExportDialog();
  }, [isExportingPdf, resetExportDialog]);

  const handleChoosePdfWithoutDetails = useCallback(async () => {
    const didExport = await buildPdfReport({
      ...EMPTY_REPORT_SUBJECT_DETAILS,
    });

    if (didExport) {
      resetExportDialog();
    }
  }, [buildPdfReport, resetExportDialog]);

  const handleChoosePdfWithDetails = useCallback(() => {
    setExportDialogError(null);
    setExportDialogStep("details");
  }, []);

  const handleReportSubjectDetailChange = useCallback(
    (field: keyof ReportSubjectDetails, value: string) => {
      setReportSubjectDetails((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmitPdfDetails = useCallback(async () => {
    const didExport = await buildPdfReport(reportSubjectDetails);

    if (didExport) {
      resetExportDialog();
    }
  }, [buildPdfReport, reportSubjectDetails, resetExportDialog]);

  return (
    <div className="app-shell">
      <PageHeader />

      <div className="app-body">
        <div className="app-sidebar-column">
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
          <HoverReadoutPanel
            bestModel={bestModel}
            className="app-hover-readout"
            hoverSnapshot={hoverSnapshot}
          />
        </div>

        <main className="dashboard">
          <section className="dashboard-grid">
            <ClassificationCard result={response} />
            <AdvancedMetricsSection result={response} />
          </section>

          <CurveChart
            bestModel={bestModel}
            canExport={Boolean(response)}
            chartRef={chartRef}
            data={mergedCurve}
            measured={response?.measured ?? []}
            onExportPdf={handleOpenPdfDialog}
            onExportPng={handlePngExport}
            onHoverSnapshotChange={setHoverSnapshot}
          />
        </main>
      </div>

      <PdfExportDialog
        details={reportSubjectDetails}
        error={exportDialogError}
        isOpen={exportDialogStep !== null}
        isSubmitting={isExportingPdf}
        onChange={handleReportSubjectDetailChange}
        onChooseDetails={handleChoosePdfWithDetails}
        onChooseNoDetails={handleChoosePdfWithoutDetails}
        onClose={handleClosePdfDialog}
        onSubmit={handleSubmitPdfDetails}
        step={exportDialogStep}
      />

      {response !== null && bestModel !== null ? (
        <div aria-hidden="true" className="report-export-stage">
          <div ref={pdfChartRef} className="report-export-stage__inner">
            <ClinicalReportChart
              bestModel={bestModel}
              data={mergedCurve}
              measured={response.measured}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
