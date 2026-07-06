import { defineConfig } from "vitest/config";
import path from "path";

// Integration tests require real environment (Supabase credentials, etc.).
// Run with: pnpm test:integration
// These are excluded from the default `pnpm test` to keep CI fast.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".claude/**"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
