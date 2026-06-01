import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageFooter } from "./PageFooter";

describe("PageFooter", () => {
  it("renders the published paper link with the expected secure external attributes", () => {
    render(<PageFooter />);

    const paperLink = screen.getByRole("link", { name: "Published paper" });

    expect(paperLink).toHaveAttribute(
      "href",
      "https://onlinelibrary.wiley.com/doi/10.1111/opo.70025",
    );
    expect(paperLink).toHaveAttribute("target", "_blank");
    expect(paperLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the project authors and copyright", () => {
    render(<PageFooter />);

    expect(screen.getByText(/Marc Argil/i)).toBeInTheDocument();
    expect(screen.getByText(/Xavier Molinero/i)).toBeInTheDocument();
    expect(screen.getByText(/Copyright © 2026/i)).toBeInTheDocument();
  });

  it("renders the developer credit", () => {
    render(<PageFooter />);

    expect(screen.getByText(/Developed by Aashish Bhusal/i)).toBeInTheDocument();
  });
});
