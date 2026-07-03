import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default to Node for the existing pure-logic suites. Tests that need a
    // DOM declare `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    exclude: [".claude/**", "node_modules/**", "**/*.integration.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      reportsDirectory: "./coverage",
      // Global floor to catch catastrophic test loss. Per-file targets are
      // tracked in docs/architecture/testing-strategy.md (not enforced yet —
      // raise these as coverage improves).
      // Current measured baseline: ~55% lines globally (Jul 2026).
      thresholds: {
        lines: 50,
        functions: 45,
        statements: 50,
      },
      exclude: [
        "node_modules/**",
        ".next/**",
        "**/*.config.{ts,js,mjs}",
        "**/types/**",
        "**/__tests__/**",
        "scripts/**",
        ".claude/**",
        "supabase/**",
        "public/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
