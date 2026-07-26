import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
// Prefer localhost over 127.0.0.1 so local `pnpm dev` (and Next's
// allowedDevOrigins defaults) can be reused without a blank CSR bailout.
const HOST = process.env.PLAYWRIGHT_HOST ?? "localhost";
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests/a11y",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `cross-env NODE_OPTIONS=--max-old-space-size=4096 pnpm exec next dev --webpack --hostname ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "ci-anon-placeholder",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "ci-gemini-placeholder",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
