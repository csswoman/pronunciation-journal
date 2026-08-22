import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const GEMINI_DIR = path.join(process.cwd(), "app", "api", "gemini");

/** Public dictionary cache; does not call Gemini and is GET-only. */
const LAYERED_LIMIT_EXEMPTIONS = new Set([
  path.join(GEMINI_DIR, "word-of-day", "route.ts"),
]);

function geminiRouteFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return geminiRouteFiles(fullPath);
      return entry.name === "route.ts" ? [fullPath] : [];
    })
    .sort();
}

describe("Gemini layered rate-limit coverage", () => {
  it("uses checkLayeredRateLimit on every Gemini route that calls the model", () => {
    const routes = geminiRouteFiles(GEMINI_DIR);
    expect(routes.length).toBeGreaterThan(5);

    const missing = routes
      .filter((filePath) => !LAYERED_LIMIT_EXEMPTIONS.has(filePath))
      .filter((filePath) => {
        const source = fs.readFileSync(filePath, "utf8");
        return !source.includes("checkLayeredRateLimit(");
      })
      .map((filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, "/"));

    expect(missing).toEqual([]);
  });

  it("checks IP and user quotas before the global emergency budget", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "api", "rate-limit.ts"),
      "utf8",
    );

    const ipIdx = source.indexOf("gemini:ip:");
    const userIdx = source.indexOf("gemini:user:");
    const globalIdx = source.indexOf("gemini:global:emergency");

    expect(ipIdx).toBeGreaterThan(-1);
    expect(userIdx).toBeGreaterThan(ipIdx);
    expect(globalIdx).toBeGreaterThan(userIdx);
  });
});
