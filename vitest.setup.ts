import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL cleanup only applies in jsdom; skip in node-environment suites.
if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup();
  });
}
