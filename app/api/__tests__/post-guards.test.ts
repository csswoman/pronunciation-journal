import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_DIR = path.join(process.cwd(), "app", "api");

const VALIDATION_EXEMPTIONS = new Set([
  "app/api/assessment/results/route.ts",
  "app/api/gemini/word-image/route.ts",
  "app/api/lexicon/[id]/route.ts",
]);

const SAME_ORIGIN_EXEMPTIONS = new Set<string>();

function routeFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return routeFiles(fullPath);
      return entry.name === "route.ts" ? [fullPath] : [];
    })
    .sort();
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

describe("POST API guard coverage", () => {
  const postRoutes = routeFiles(API_DIR).filter((filePath) =>
    fs.readFileSync(filePath, "utf8").includes("export async function POST")
  );

  it("keeps authenticated POST routes behind auth, same-origin, and rate-limit guards", () => {
    const missing = postRoutes.flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      const rel = relative(filePath);
      const issues: string[] = [];

      if (
        !source.includes("requireUser(") &&
        !source.includes(".auth.getUser(")
      ) {
        issues.push("auth");
      }
      if (!SAME_ORIGIN_EXEMPTIONS.has(rel) && !source.includes("requireSameOrigin(")) {
        issues.push("same-origin");
      }
      if (!source.includes("rateLimit(")) {
        issues.push("rate-limit");
      }

      return issues.map((issue) => `${rel}: missing ${issue}`);
    });

    expect(missing).toEqual([]);
  });

  it("keeps JSON POST routes behind centralized body validation", () => {
    const missing = postRoutes.flatMap((filePath) => {
      const rel = relative(filePath);
      if (VALIDATION_EXEMPTIONS.has(rel)) return [];

      const source = fs.readFileSync(filePath, "utf8");
      return source.includes("validateBody(") ? [] : [`${rel}: missing validateBody`];
    });

    expect(missing).toEqual([]);
  });
});
