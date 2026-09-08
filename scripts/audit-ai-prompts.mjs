#!/usr/bin/env node
/**
 * AI prompt boundary audit.
 * Hard rule (CLAUDE.md): no Gemini prompts inside components; all Gemini
 * calls go through /api/gemini/*. This script checks two things:
 *   1. BLOCKING — @google/genai imports / generateContent() / systemInstruction
 *      calls outside the sanctioned server-side allowlist.
 *   2. WARNING — instruction-shaped string literals (e.g. "You are a...",
 *      "Return ONLY") in components/** or hooks/**, which usually means a
 *      prompt was inlined instead of living in lib/ai-prompts.ts.
 *
 * Run: npm run audit:ai-prompts
 * Exit 1 only on rule (1) violations.
 */

import { readFileSync, readdirSync } from "fs";
import { join, extname, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const SCAN_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "build", ".git", ".claude"]);

/**
 * Directories/files allowed to import @google/genai or call generateContent
 * directly. Everything else calling Gemini must go through these.
 */
const GENAI_ALLOWLIST_PREFIXES = [
  "lib/ai-prompts.ts",
  "lib/gemini/",
  "lib/word-bank/gemini.ts",
  "app/api/gemini/",
  "scripts/",
];

const GENAI_PATTERNS = [
  { rule: "genai-import", regex: /from\s+["']@google\/genai["']/ },
  { rule: "generate-content-call", regex: /\.generateContent\s*\(/ },
  { rule: "system-instruction", regex: /systemInstruction\s*:/ },
];

/** Heuristic: instruction-shaped literals that suggest an inlined prompt. */
const PROMPT_HEURISTIC_PATTERNS = [
  /you\s+are\s+an?\s+/i,
  /return\s+only\s+/i,
  /respond\s+in\s+json/i,
  /respond\s+only\s+with/i,
];
const PROMPT_HEURISTIC_DIRS = ["components/", "hooks/"];

function* walkFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkFiles(join(dir, entry.name));
    } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      yield join(dir, entry.name);
    }
  }
}

/**
 * Integration tests (*.integration.test.ts) are excluded from `pnpm test`
 * and deliberately exercise the real SDK end-to-end (see
 * lib/ai-practice/__tests__/annotate-turn.integration.test.ts) — that is
 * their job, not a UI/component leak, so they are exempt from the
 * prefix allowlist below rather than added to it wholesale.
 */
const INTEGRATION_TEST_SUFFIX = ".integration.test.ts";

function isAllowlisted(relPath) {
  if (relPath.endsWith(INTEGRATION_TEST_SUFFIX)) return true;
  return GENAI_ALLOWLIST_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function isHeuristicScope(relPath) {
  return PROMPT_HEURISTIC_DIRS.some((prefix) => relPath.startsWith(prefix));
}

const violations = [];
const warnings = [];

for (const filePath of walkFiles(ROOT)) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, "/");
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    if (!isAllowlisted(relPath)) {
      for (const { rule, regex } of GENAI_PATTERNS) {
        if (regex.test(line)) {
          violations.push({
            file: relPath,
            line: i + 1,
            rule,
            detail: `Gemini access must go through lib/ai-prompts.ts + lib/gemini/* + app/api/gemini/*, found: ${line.trim()}`,
          });
        }
      }
    }

    if (isHeuristicScope(relPath)) {
      for (const pattern of PROMPT_HEURISTIC_PATTERNS) {
        if (pattern.test(line)) {
          warnings.push({
            file: relPath,
            line: i + 1,
            detail: `Instruction-shaped string in ${relPath} looks like an inlined prompt. Prompts belong in lib/ai-prompts.ts: ${line.trim()}`,
          });
          break;
        }
      }
    }
  });
}

if (warnings.length > 0) {
  console.warn("AI prompt audit warnings (heuristic, non-blocking):");
  for (const w of warnings) {
    console.warn(`- ${w.file}:${w.line} ${w.detail}`);
  }
  console.warn();
}

if (violations.length > 0) {
  console.error("AI prompt audit failed:");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
  }
  process.exit(1);
}

console.log("AI prompt audit passed.");
