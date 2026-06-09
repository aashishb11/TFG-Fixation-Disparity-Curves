import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComputeResponse, ModelMetrics } from "./types/fdc";
import App from "./App";
import { computeFits } from "./api/fdc";

vi.mock("./api/fdc", () => ({
  computeFits: vi.fn(),
}));

vi.mock("./components/AdvancedMetricsSection", () => ({
  AdvancedMetricsSection: () => <div data-testid="advanced-metrics" />,
}));

vi.mock("./components/ClassificationCard", () => ({
  ClassificationCard: () => <div data-testid="classification-card" />,
}));

vi.mock("./components/ClinicalReportChart", () => ({
  ClinicalReportChart: () => <div data-testid="clinical-report-chart" />,
}));

vi.mock("./components/CurveChart", () => ({
  CurveChart: () => <div data-testid="curve-chart" />,
}));

vi.mock("./components/HoverReadoutPanel", () => ({
  HoverReadoutPanel: () => <div data-testid="hover-readout-panel" />,
}));

vi.mock("./components/PageHeader", () => ({
  PageHeader: () => <div data-testid="page-header" />,
}));

vi.mock("./components/PdfExportDialog", () => ({
  PdfExportDialog: () => null,
}));

function buildModelMetrics(): ModelMetrics {
  return {
    params: { a: 0, b: 0, c: 0, d: 0 },
    sse: 1,
    rmse: 1,
    slope: 1,
    fitted_at_x: [0, 0, 0, 0, 0, 0, 0],
    curve: [
      { x: -15, y: 0 },
      { x: 15, y: 0 },
    ],
  };
}

function buildResponse(): ComputeResponse {
  return {
    x: [-15, -10, -5, 0, 5, 10, 15],
    measured: [
      { x: -15, y: 12 },
      { x: -10, y: 0 },
      { x: -5, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 15, y: 0 },
    ],
    models: {
      T1: buildModelMetrics(),
      T2: buildModelMetrics(),
      T3: buildModelMetrics(),
      T4: buildModelMetrics(),
    },
    classification: {
      best_by_sse: "T1",
      best_by_rmse: "T1",
    },
  };
}

describe("App", () => {
  beforeEach(() => {
    vi.mocked(computeFits).mockReset();
  });

  it("shows only the supported viewing distances and no custom-distance field", () => {
    render(<App />);

    const distanceSelect = screen.getByRole("combobox", {
      name: /Viewing Distance/i,
    });
    const optionLabels = within(distanceSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(optionLabels).toEqual(["Select a distance", "40 cm", "25 cm"]);
    expect(screen.queryByLabelText(/Preferred Distance/i)).not.toBeInTheDocument();
  });

  it("keeps the seven measured values editable and does not overwrite them when distance changes", async () => {
    vi.mocked(computeFits).mockResolvedValue(buildResponse());

    const user = userEvent.setup();
    render(<App />);

    const distanceSelect = screen.getByRole("combobox", {
      name: /Viewing Distance/i,
    });
    const measuredInputs = () => screen.getAllByRole("spinbutton");

    expect(measuredInputs()).toHaveLength(7);
    measuredInputs().forEach((input) => {
      expect(input).toHaveValue(null);
    });

    await user.selectOptions(distanceSelect, "25cm");
    measuredInputs().forEach((input) => {
      expect(input).toHaveValue(null);
    });

    await user.clear(measuredInputs()[0]);
    await user.type(measuredInputs()[0], "12");
    await user.selectOptions(distanceSelect, "25cm");

    expect(measuredInputs()[0]).toHaveValue(12);
    measuredInputs()
      .slice(1)
      .forEach((input) => {
        expect(input).toHaveValue(null);
      });

    await user.click(
      screen.getByRole("button", { name: /Run Statistical Fit/i }),
    );

    await waitFor(() => {
      expect(computeFits).toHaveBeenCalledWith([12, 0, 0, 0, 0, 0, 0]);
    });
  });
});
