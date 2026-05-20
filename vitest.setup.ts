import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's automatic cleanup is only wired up for Jest. Manually unmount between
// tests so DOM nodes from prior renders don't bleed into later queries.
afterEach(() => {
  cleanup();
});
