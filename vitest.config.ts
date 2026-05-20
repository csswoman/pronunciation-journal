import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default to Node for the existing pure-logic suites. Tests that need a
    // DOM declare `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
