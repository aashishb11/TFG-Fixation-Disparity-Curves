import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageFooter } from "./PageFooter";

describe("PageFooter", () => {
  it("renders the copyright", () => {
    render(<PageFooter />);

    expect(screen.getByText(/Copyright © 2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/Marc Argil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Xavier Molinero/i)).not.toBeInTheDocument();
  });

  it("renders the developer credit", () => {
    render(<PageFooter />);

    expect(screen.getByText(/Developed by Aashish Bhusal/i)).toBeInTheDocument();
  });
});
