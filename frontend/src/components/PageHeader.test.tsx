import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title and subtitle without credits or paper link", () => {
    render(<PageHeader />);

    expect(
      screen.getByRole("heading", {
        name: "Fixation Disparity Curve Modeling",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clinical curve fitting and classification/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Marc Argil/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Developed by Aashish/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Published paper" }),
    ).not.toBeInTheDocument();
  });
});
