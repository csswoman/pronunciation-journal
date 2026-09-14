import { defineConfig } from "vitest/config";
import os from "os";
import path from "path";

// Coverage instruments every module; combined with jsdom suites this makes
// worker boot much heavier. Unbounded parallelism hits Vitest's hard-coded
// 90s worker-start timeout ("Failed to start forks worker").
const isCoverage = process.argv.includes("--coverage");

// SVGR only runs inside Next's webpack/turbopack pipeline (see next.config.mjs),
// so under Vitest a `.svg` import would resolve to an asset URL instead of a
// component. This plugin stubs every `.svg` as a real functional SVG component,
// letting the illustration registry be tested for real without one `vi.mock`
// per icon — the koboyo set grows to dozens of files.
const svgrStub = {
  name: "svgr-stub",
  enforce: "pre" as const,
  resolveId(id: string) {
    return id.endsWith(".svg") ? "\0svgr-stub" : null;
  },
  load(id: string) {
    if (id !== "\0svgr-stub") return null;
    return `import React from "react";
export default function SvgStub(props) {
  return React.createElement("svg", props);
}`;
  },
};

export default defineConfig({
  plugins: [svgrStub],
  test: {
    // Default to Node for the existing pure-logic suites. Tests that need a
    // DOM declare `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    exclude: [".claude/**", "node_modules/**", "**/*.integration.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // Cap forks to prevent worker startup timeouts. On Windows and high-core machines,
    // unbounded parallelism spawns dozens of Node processes simultaneously, saturating I/O
    // and hitting Vitest's 60s worker-start timeout ("Failed to start forks worker").
    maxWorkers: Math.min(4, Math.max(1, os.availableParallelism?.() ?? os.cpus().length)),
    ...(isCoverage ? { testTimeout: 30_000 } : {}),
    // Node 22+ warns when localStorage is touched without a persistence file.
    execArgv: [
      `--localstorage-file=${path.join(os.tmpdir(), "vitest-localstorage")}`,
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      reportsDirectory: "./coverage",
      // Global floor to catch catastrophic test loss. Per-file floors in
      // `thresholds["path/to/file.ts"]` guard critical modules (Jul 2026).
      thresholds: {
        lines: 50,
        functions: 45,
        statements: 50,
        // Per-file floors: current measured coverage minus ~5% headroom (Jul 2026).
        // See docs/architecture/testing-strategy.md for rationale.
        "lib/gemini/client.ts": { lines: 88, functions: 80, statements: 75 },
        "lib/gemini/fallback.ts": { lines: 95, functions: 95, statements: 90 },
        "lib/api/require-admin.ts": { lines: 95, functions: 95, statements: 95 },
        "lib/sync/sync-manager.ts": { lines: 72, functions: 95, statements: 72 },
        "lib/practice/queries.ts": { lines: 62, functions: 60, statements: 62 },
        "lib/api/guards.ts": { lines: 48, functions: 45, statements: 48 },
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
