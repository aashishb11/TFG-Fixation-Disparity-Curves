import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageFooter } from "./PageFooter";

describe("PageFooter", () => {
  it("renders the rdlab host credit with the expected link", () => {
    render(<PageFooter />);

    const hostLink = screen.getByRole("link", { name: /rdlab \(UPC\)/i });

    expect(hostLink).toHaveAttribute("href", "https://rdlab.cs.upc.edu/");
    expect(hostLink).toHaveAttribute("target", "_blank");
    expect(hostLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the authors, copyright, and developer credit", () => {
    render(<PageFooter />);

    expect(
      screen.getByText(/Marc Argilés & Xavier Molinero/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Copyright © 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Developed by Aashish Bhusal/i)).toBeInTheDocument();
  });
});
