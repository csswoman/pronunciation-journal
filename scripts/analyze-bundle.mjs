import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const MANIFEST_PATH = path.join(NEXT_DIR, "build-manifest.json");
const APP_SERVER_DIR = path.join(NEXT_DIR, "server", "app");
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

/**
 * Per-route gzip size, computed from each route's
 * `page_client-reference-manifest.js` (App Router + Turbopack). This is the
 * "First Load JS" equivalent Turbopack's `next build` does not print — Webpack
 * builds show that table in the terminal, but Turbopack's build output lists
 * routes with no size column, and there is no persisted manifest with it either.
 *
 * Each client-reference manifest lists every client module the route can
 * render and the chunk files each module lives in (`clientModules[id].chunks`).
 * The union of those chunk files, deduped, is what that route's client
 * actually downloads on first load — so summing their gzip sizes reproduces
 * "First Load JS" without needing the Webpack builder.
 *
 * `allChunksGzipKB` stays as the aggregate regression guard (total shipped JS
 * across all routes); `maxRouteGzipKB` complements it by catching a regression
 * concentrated in one heavily-visited route (e.g. /daily) that the aggregate
 * could dilute across 150+ chunks.
 */
function findClientReferenceManifests(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findClientReferenceManifests(full));
    } else if (entry.name.endsWith("page_client-reference-manifest.js")) {
      results.push(full);
    }
  }
  return results;
}

function routeNameFromManifestPath(manifestPath) {
  const rel = path.relative(APP_SERVER_DIR, manifestPath).replace(/\\/g, "/");
  return rel.replace(/\/page_client-reference-manifest\.js$/, "") || "/";
}

function measureRoutes() {
  const manifestPaths = findClientReferenceManifests(APP_SERVER_DIR);
  const chunkGzipCache = new Map();

  const chunkGzipKb = (chunkUrl) => {
    if (chunkGzipCache.has(chunkUrl)) return chunkGzipCache.get(chunkUrl);
    const rel = chunkUrl.replace(/^\/_next\//, "");
    const fullPath = path.join(NEXT_DIR, rel);
    const size = fs.existsSync(fullPath) ? gzipSize(fs.readFileSync(fullPath)) : 0;
    chunkGzipCache.set(chunkUrl, size);
    return size;
  };

  const routes = [];
  for (const manifestPath of manifestPaths) {
    const source = fs.readFileSync(manifestPath, "utf8");
    const match = source.match(/globalThis\.__RSC_MANIFEST\[[^\]]+\]\s*=\s*(\{[\s\S]*\});?\s*$/);
    if (!match) continue;

    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const chunkSet = new Set();
    for (const mod of Object.values(data.clientModules ?? {})) {
      for (const chunk of mod.chunks ?? []) {
        chunkSet.add(chunk);
      }
    }

    let totalGzip = 0;
    for (const chunk of chunkSet) {
      totalGzip += chunkGzipKb(chunk);
    }

    routes.push({
      route: routeNameFromManifestPath(manifestPath),
      chunkCount: chunkSet.size,
      gzipKB: toKb(totalGzip),
    });
  }

  routes.sort((a, b) => b.gzipKB - a.gzipKB);
  return routes;
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
  const routes = measureRoutes();
  const maxRoute = routes[0] ?? null;

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
      maxRouteGzipKB: maxRoute?.gzipKB ?? 0,
      maxRouteName: maxRoute?.route ?? null,
    },
    rootMainFiles: rootFiles,
    deferredChunks: deferred.map((d) => d.label),
    routes,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Bundle summary written to bundle-summary.json");
  console.log(JSON.stringify(summary.metrics, null, 2));
  console.log("\nTop 5 heaviest routes (gzip):");
  for (const r of routes.slice(0, 5)) {
    console.log(`  ${r.gzipKB.toString().padStart(7)} KB  ${r.route}`);
  }

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
