import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const envLocal = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocal) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envLocal);
  } catch {
    // ignore
  }
}

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const HOST = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests/performance",
  globalSetup: "./tests/performance/global-setup.ts",
  globalTeardown: "./tests/performance/global-teardown.ts",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-perf-report" }]]
    : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `cross-env NODE_OPTIONS=--max-old-space-size=4096 pnpm exec next start --hostname ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
    },
  },
  projects: [
    {
      name: "setup",
      testDir: "./tests/a11y",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "performance",
      testDir: "./tests/performance",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
