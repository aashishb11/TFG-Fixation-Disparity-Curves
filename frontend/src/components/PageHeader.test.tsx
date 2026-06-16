import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(<PageHeader />);

    expect(
      screen.getByRole("heading", {
        name: "Fixation Disparity Curve Modeling",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clinical curve fitting and classification/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Developed by Aashish/i)).not.toBeInTheDocument();
  });

  it("renders the ALBCOM link with the expected href and secure external attributes", () => {
    render(<PageHeader />);

    const albcomLink = screen.getByRole("link", { name: /ALBCOM/i });

    expect(albcomLink).toHaveAttribute(
      "href",
      "https://futur.upc.edu/ALBCOM?locale=en",
    );
    expect(albcomLink).toHaveAttribute("target", "_blank");
    expect(albcomLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
