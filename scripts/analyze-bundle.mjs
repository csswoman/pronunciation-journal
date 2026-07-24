import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const MANIFEST_PATH = path.join(NEXT_DIR, "build-manifest.json");
const BUDGET_PATH = path.join(ROOT, "scripts", "bundle-budget.json");
const OUTPUT_PATH = path.join(ROOT, "bundle-summary.json");

function gzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

function readChunkMetrics(relativePath) {
  const fullPath = path.join(NEXT_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing chunk file: ${relativePath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  return { raw: buffer.length, gzip: gzipSize(buffer) };
}

function sumMetrics(files) {
  return files.reduce(
    (acc, file) => {
      const metrics = readChunkMetrics(file);
      acc.raw += metrics.raw;
      acc.gzip += metrics.gzip;
      return acc;
    },
    { raw: 0, gzip: 0 },
  );
}

/**
 * Chunks that exist only behind an `await import(...)` and are never part of a
 * first load. They are reported separately so `allChunksGzipKB` tracks the
 * payload users actually download rather than total build output.
 *
 * Detected by content, not filename: Turbopack chunk names are content-hashed
 * and change every build. Each probe must be a string that only the intended
 * vendor payload can contain.
 */
const DEFERRED_CHUNK_PROBES = [
  // cmu-pronouncing-dictionary (~940KB gzip): full CMUdict, lazy-loaded by
  // lib/pronunciation/phonemes.ts for phoneme scoring. The ARPAbet entry for
  // "aaberg" appears in no other bundled module.
  { label: "cmu-pronouncing-dictionary", probe: 'aaberg:"AA1 B ER0 G"' },
];

function classifyChunk(fullPath) {
  const source = fs.readFileSync(fullPath, "utf8");
  const match = DEFERRED_CHUNK_PROBES.find((p) => source.includes(p.probe));
  return match ? match.label : null;
}

function listChunkFiles() {
  const chunksDir = path.join(NEXT_DIR, "static", "chunks");
  if (!fs.existsSync(chunksDir)) {
    throw new Error("Missing .next/static/chunks — run `pnpm build` first.");
  }

  const eager = [];
  const deferred = [];

  for (const file of fs.readdirSync(chunksDir).filter((f) => f.endsWith(".js"))) {
    const relative = path.join("static", "chunks", file);
    const label = classifyChunk(path.join(chunksDir, file));
    if (label) {
      deferred.push({ file: relative, label });
    } else {
      eager.push(relative);
    }
  }

  return { eager, deferred };
}

function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function loadBudget() {
  if (!fs.existsSync(BUDGET_PATH)) {
    throw new Error(`Missing budget file: ${BUDGET_PATH}`);
  }
  return JSON.parse(fs.readFileSync(BUDGET_PATH, "utf8"));
}

function assertBudget(summary, budget) {
  const tolerance = budget.tolerancePct ?? 0;
  const failures = [];

  for (const [key, limitKb] of Object.entries(budget.limitsKb ?? {})) {
    const actualKb = summary.metrics[key];
    if (typeof actualKb !== "number") {
      failures.push(`${key}: metric missing from summary`);
      continue;
    }
    const maxKb = limitKb * (1 + tolerance / 100);
    if (actualKb > maxKb) {
      failures.push(`${key}: ${actualKb} KB gzip exceeds budget ${limitKb} KB (+${tolerance}% tolerance → ${maxKb.toFixed(1)} KB)`);
    }
  }

  if (failures.length > 0) {
    console.error("Bundle budget check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

function main() {
  const checkMode = process.argv.includes("--check");

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Missing .next/build-manifest.json — run `pnpm build` before analyze:bundle.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const rootFiles = [
    ...(manifest.rootMainFiles ?? []),
    ...(manifest.polyfillFiles ?? []),
  ];
  const rootMain = sumMetrics(rootFiles);
  const { eager, deferred } = listChunkFiles();
  const allChunks = sumMetrics(eager);
  const deferredChunks = sumMetrics(deferred.map((d) => d.file));

  const summary = {
    generatedAt: new Date().toISOString(),
    buildId: fs.existsSync(path.join(NEXT_DIR, "BUILD_ID"))
      ? fs.readFileSync(path.join(NEXT_DIR, "BUILD_ID"), "utf8").trim()
      : null,
    metrics: {
      rootMainGzipKB: toKb(rootMain.gzip),
      rootMainRawKB: toKb(rootMain.raw),
      allChunksGzipKB: toKb(allChunks.gzip),
      allChunksRawKB: toKb(allChunks.raw),
      chunkCount: eager.length,
      deferredChunksGzipKB: toKb(deferredChunks.gzip),
      deferredChunkCount: deferred.length,
    },
    rootMainFiles: rootFiles,
    deferredChunks: deferred.map((d) => d.label),
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Bundle summary written to bundle-summary.json");
  console.log(JSON.stringify(summary.metrics, null, 2));

  // A probe that matches nothing means the vendor payload changed shape and is
  // now being counted against the budget. Fail loudly rather than let CI report
  // a confusing size regression.
  const unmatched = DEFERRED_CHUNK_PROBES.filter(
    (p) => !deferred.some((d) => d.label === p.label),
  );
  if (unmatched.length > 0) {
    console.error("Deferred-chunk probe matched no chunk:");
    for (const p of unmatched) {
      console.error(`- ${p.label}: update the probe in scripts/analyze-bundle.mjs`);
    }
    process.exit(1);
  }

  if (checkMode) {
    const budget = loadBudget();
    assertBudget(summary, budget);
    console.log("Bundle budget check passed.");
  }
}

main();
