import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title and subtitle with the paper link", () => {
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
      screen.queryByText(/Developed by Aashish/i),
    ).not.toBeInTheDocument();
  });

  it("renders the paper link with the expected secure external attributes", () => {
    render(<PageHeader />);

    const paperLink = screen.getByRole("link", {
      name: /published paper by Marc Argil/i,
    });

    expect(paperLink).toHaveAttribute(
      "href",
      "https://onlinelibrary.wiley.com/doi/10.1111/opo.70025",
    );
    expect(paperLink).toHaveAttribute("target", "_blank");
    expect(paperLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
