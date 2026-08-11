#!/usr/bin/env node
/**
 * Design token lint script.
 * Detects three categories of violations in JSX/TSX/JS/TS files:
 *   1. Hardcoded hex colors in Tailwind arbitrary values (e.g. bg-[#fff])
 *   2. Arbitrary text-[Xpx] values not in the documented exception list
 *   3. Arbitrary spacing values that are not on the 4px grid
 *
 * Run: npm run lint:design-tokens
 * Exit 1 if any violations found, 0 if clean.
 */

import { readFileSync, readdirSync } from "fs";
import { join, extname, relative } from "path";

// --- Configuration -----------------------------------------------------------

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const SCAN_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "build", ".git", ".claude", "scripts"]);

/**
 * Arbitrary text sizes that are documented in DESIGN_SYSTEM.md §7.4 as
 * "known, pending @theme integration". These are ALLOWED and must NOT be
 * flagged. Any other text-[Xpx/rem/em] is a violation.
 */
const ALLOWED_TEXT_ARBITRARY = new Set([
  "9px", "10px", "11px", "12px", "13px", "14px", "15px",
]);

/**
 * Arbitrary border-radius values that come directly from the design-tokens
 * table (DESIGN_SYSTEM.md §5). These map to --radius-xl and --radius-3xl
 * and are ALLOWED until @theme integration lands.
 */
const ALLOWED_ROUNDED_ARBITRARY = new Set(["20px", "32px"]);

/**
 * For spacing properties, values ≥ this threshold are treated as intentional
 * layout dimensions (width, height, max-width, min-width) and skipped.
 * See DESIGN_SYSTEM.md §8 enforcement log.
 */
const LAYOUT_DIMENSION_THRESHOLD_PX = 20;

/** Spacing-related Tailwind prefixes that must stay on the 4px grid. */
const SPACING_PREFIXES = [
  "p", "m",
  "px", "py", "pt", "pb", "pl", "pr",
  "mx", "my", "mt", "mb", "ml", "mr",
  "gap", "space-x", "space-y",
  "inset", "top", "right", "bottom", "left",
  // small-value w/h are also spacing (waveform bars, borders, etc.)
  "w", "h", "min-w", "min-h",
];

// Build one regex that matches any spacing prefix followed by an arbitrary px value.
// Capture groups: (1) prefix, (2) numeric value
const SPACING_PREFIX_PATTERN = SPACING_PREFIXES
  .map((p) => p.replace("-", "\\-"))
  .join("|");
const SPACING_REGEX = new RegExp(
  `(?<![\\w-])(${SPACING_PREFIX_PATTERN})-\\[(\\d+(?:\\.\\d+)?)px\\]`,
  "g",
);

// --- Rule patterns -----------------------------------------------------------

/**
 * Rule 1: Hardcoded hex color inside a Tailwind arbitrary value bracket.
 * Matches things like:  bg-[#fff]  text-[#1a2b3c]  border-[#aabbcc80]
 */
const HEX_COLOR_REGEX = /(?<![[\w-])[a-z-]+-\[#([0-9a-fA-F]{3,8})\]/g;

/**
 * Rule 2: Arbitrary text size.
 * Matches: text-[14px]  text-[1.5rem]  text-[0.875em]
 */
const TEXT_SIZE_REGEX = /(?<![[\w-])text-\[(\d+(?:\.\d+)?(?:px|rem|em))\]/g;

/**
 * Rule 5 (blocking): raw color literal outside a Tailwind arbitrary-value
 * bracket and outside the CSS token files. Matches #hex, rgb()/rgba(),
 * hsl()/hsla(), oklch() used as plain JS/TS values (object literals, string
 * literals, template literals) rather than `var(--token)`.
 */
const RAW_COLOR_REGEX = /(#(?:[0-9a-fA-F]{3,4}){1,2}\b|\brgba?\(|\bhsla?\(|\boklch\()/g;

/** Files/globs allowed to contain raw color literals (design tokens, brand assets, user palettes). */
const RAW_COLOR_ALLOWLIST = new Set([
  "app/layout.tsx",
  "app/manifest.ts",
  "components/ai-coach/MessageBubble.tsx",
  "components/ai-coach/PracticeSession.tsx",
  "components/auth/AuthGoogleButton.tsx",
  "components/auth/AuthImagePanel.tsx",
  "components/auth/AuthMobileIdentity.tsx",
  "components/auth/AuthPanel.tsx",
  "components/exercises/MatchPairsExercise.tsx",
  "components/interview/InterviewResults.tsx",
  "components/layout/BottomNavMenu.tsx",
  "components/lexicon/LessonGrid.tsx",
  "components/phoneme-practice/SoundGrid.tsx",
  "components/ui/WaveformVisualizer.tsx",
  "components/vocabulary/decks/AddToExistingDeckModal.tsx",
  "components/vocabulary/decks/CreateDeckFromWordsModal.tsx",
  "components/vocabulary/decks/CreateDeckModal.tsx",
  "components/vocabulary/decks/EditDeckModal.tsx",
  "components/vocabulary/decks/study-utils.ts",
  "lib/lexicon/categories.ts",
  "lib/lexicon/domains.ts",
]);

/**
 * Rule 6 (warning only): inline style={{ ... }} whose object appears to be a
 * pure literal — no template interpolation (${), no var(--token) reference,
 * no identifier lookup. A reliable literal-vs-computed check needs a real
 * JS/TS parser; this is a best-effort heuristic surfaced as a warning so it
 * never blocks CI on a false positive.
 */
// Any of: template interpolation, CSS var() reference, spread, arrow fn,
// ternary, or an identifier/member expression used as a value
// (`prop: someVar`, `prop: segment.total`) all indicate the object is
// computed rather than a pure literal.
const RUNTIME_COMPUTED_HINTS =
  /\$\{|var\(--|\.\.\.|=>|\?|:\s*[a-zA-Z_]\w*(?:\??\.[a-zA-Z_]\w*)*\s*[,}]/;

// --- File walker -------------------------------------------------------------

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

// --- Violation collector -----------------------------------------------------

function collectViolations(filePath, content) {
  const violations = [];
  const lines = content.split("\n");

  function addViolation(rule, lineIndex, match, detail) {
    violations.push({
      rule,
      file: relative(ROOT, filePath).replace(/\\/g, "/"),
      line: lineIndex + 1,
      match,
      detail,
    });
  }

  lines.forEach((line, i) => {
    // Skip pure comment lines and import statements
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("import ")) return;

    // Rule 1 — hex colors
    let m;
    HEX_COLOR_REGEX.lastIndex = 0;
    while ((m = HEX_COLOR_REGEX.exec(line)) !== null) {
      addViolation("hex-color", i, m[0], `Use a CSS variable (e.g. var(--primary)) instead of hardcoded hex #${m[1]}`);
    }

    // Rule 2 — arbitrary text sizes
    TEXT_SIZE_REGEX.lastIndex = 0;
    while ((m = TEXT_SIZE_REGEX.exec(line)) !== null) {
      const size = m[1];
      if (!ALLOWED_TEXT_ARBITRARY.has(size)) {
        addViolation(
          "arbitrary-text-size",
          i,
          m[0],
          `text-[${size}] is not in the documented exception list. Use a Tailwind text scale class or add a @theme token.`,
        );
      }
    }

    // Rule 3 — arbitrary spacing not on 4px grid
    SPACING_REGEX.lastIndex = 0;
    while ((m = SPACING_REGEX.exec(line)) !== null) {
      const prefix = m[1];
      const value = parseFloat(m[2]);
      const isLayoutDim =
        ["w", "h", "min-w", "min-h"].includes(prefix) &&
        value >= LAYOUT_DIMENSION_THRESHOLD_PX;

      if (isLayoutDim) continue;

      // Allow rounded exceptions when the prefix is actually in rounded (separate rule, not here)
      const isOnGrid = value % 4 === 0;
      if (!isOnGrid) {
        const nearest = [Math.floor(value / 4) * 4, Math.ceil(value / 4) * 4];
        addViolation(
          "off-grid-spacing",
          i,
          m[0],
          `${prefix}-[${value}px] is not on the 4px grid. Nearest valid values: ${nearest[0]}px or ${nearest[1]}px.`,
        );
      }
    }

    // Bonus: arbitrary rounded values not in allowlist
    const roundedRegex = /(?<![[\w-])rounded(?:-[trbl]{1,2})?-\[(\d+(?:\.\d+)?px)\]/g;
    roundedRegex.lastIndex = 0;
    while ((m = roundedRegex.exec(line)) !== null) {
      const size = m[1];
      if (!ALLOWED_ROUNDED_ARBITRARY.has(size)) {
        addViolation(
          "arbitrary-radius",
          i,
          m[0],
          `rounded-[${size}] is not in the documented radius token list (20px, 32px). Use a Tailwind rounded class.`,
        );
      }
    }

    // Rule 5 — raw color literal outside Tailwind brackets / token files
    // (test fixtures legitimately use arbitrary literal values as mock data)
    const relFile = relative(ROOT, filePath).replace(/\\/g, "/");
    const isTestFile = /\.test\.[tj]sx?$/.test(relFile) || relFile.includes("__tests__/");
    if (!isTestFile && !RAW_COLOR_ALLOWLIST.has(relFile)) {
      RAW_COLOR_REGEX.lastIndex = 0;
      while ((m = RAW_COLOR_REGEX.exec(line)) !== null) {
        // Skip when inside a Tailwind arbitrary-value bracket — that's rules 1-4's job.
        const before = line.slice(0, m.index);
        if (/-\[[^\]]*$/.test(before)) continue;
        addViolation(
          "raw-color",
          i,
          m[0],
          `Raw color literal outside a design token. Use a CSS variable (var(--token)) or add this file to RAW_COLOR_ALLOWLIST with a reason.`,
        );
      }
    }
  });

  return violations;
}

// --- Rule 6: inline style={{}} with a likely-literal object (warning only) --

const INLINE_STYLE_WARNING_TEMPLATE =
  "style={{...}} looks like a pure literal (no template interpolation, var(--) reference, or identifier lookup found). If this isn't a runtime-computed value, use Tailwind tokens instead.";

function collectInlineStyleWarnings(filePath, content) {
  const warnings = [];
  const relFile = relative(ROOT, filePath).replace(/\\/g, "/");
  let searchFrom = 0;

  while (true) {
    const openIdx = content.indexOf("style={{", searchFrom);
    if (openIdx === -1) break;

    const braceStart = openIdx + "style={".length; // index of the inner '{'
    let depth = 0;
    let closeIdx = -1;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    if (closeIdx === -1) break;

    const objectSource = content.slice(braceStart, closeIdx + 1);
    searchFrom = closeIdx + 1;

    if (RUNTIME_COMPUTED_HINTS.test(objectSource)) continue;

    const lineIndex = content.slice(0, openIdx).split("\n").length - 1;
    warnings.push({
      file: relFile,
      line: lineIndex + 1,
      detail: INLINE_STYLE_WARNING_TEMPLATE,
    });
  }

  return warnings;
}

// --- Reporter ----------------------------------------------------------------

const RULE_LABELS = {
  "hex-color": "Hardcoded hex color",
  "arbitrary-text-size": "Arbitrary text size",
  "off-grid-spacing": "Off-grid spacing",
  "arbitrary-radius": "Arbitrary border radius",
  "raw-color": "Raw color literal",
};

const RULE_COLORS = {
  "hex-color": "\x1b[31m",       // red
  "arbitrary-text-size": "\x1b[33m", // yellow
  "off-grid-spacing": "\x1b[33m",    // yellow
  "arbitrary-radius": "\x1b[36m",   // cyan
  "raw-color": "\x1b[31m",          // red
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

// --- Main --------------------------------------------------------------------

const allViolations = [];
const allInlineStyleWarnings = [];

for (const filePath of walkFiles(ROOT)) {
  const content = readFileSync(filePath, "utf8");
  allViolations.push(...collectViolations(filePath, content));
  allInlineStyleWarnings.push(...collectInlineStyleWarnings(filePath, content));
}

if (allInlineStyleWarnings.length > 0) {
  console.warn(`${BOLD}Inline style warnings (heuristic, non-blocking)${RESET}`);
  for (const w of allInlineStyleWarnings) {
    console.warn(`  ${w.file}:${w.line}  ${w.detail}`);
  }
  console.warn(`\n  Total: ${allInlineStyleWarnings.length} warning${allInlineStyleWarnings.length === 1 ? "" : "s"}\n`);
}

if (allViolations.length === 0) {
  console.log(`\x1b[32m✔ No design token violations found.\x1b[0m`);
  process.exit(0);
}

// Group by file
const byFile = new Map();
for (const v of allViolations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}

console.log(`\n${BOLD}Design token violations${RESET}\n`);

for (const [file, violations] of byFile) {
  console.log(`${BOLD}${file}${RESET}`);
  for (const v of violations) {
    const color = RULE_COLORS[v.rule] ?? "";
    const label = RULE_LABELS[v.rule] ?? v.rule;
    console.log(
      `  ${DIM}${String(v.line).padStart(4)}:${RESET}  ${color}${v.match}${RESET}`,
    );
    console.log(`        ${DIM}[${label}]${RESET} ${v.detail}`);
  }
  console.log();
}

// Summary by rule
const counts = {};
for (const v of allViolations) counts[v.rule] = (counts[v.rule] ?? 0) + 1;
console.log(`${BOLD}Summary${RESET}`);
for (const [rule, count] of Object.entries(counts)) {
  const color = RULE_COLORS[rule] ?? "";
  console.log(`  ${color}${RULE_LABELS[rule]}${RESET}: ${count}`);
}
console.log(`\n  Total: ${BOLD}${allViolations.length} violation${allViolations.length === 1 ? "" : "s"}${RESET}\n`);

process.exit(1);
