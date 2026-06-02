import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// clean up the DOM after each test to avoid stale state between tests
afterEach(() => {
  cleanup();
});
