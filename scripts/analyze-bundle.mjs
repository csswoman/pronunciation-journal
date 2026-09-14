import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const MANIFEST_PATH = path.join(NEXT_DIR, "build-manifest.json");
const APP_SERVER_DIR = path.join(NEXT_DIR, "server", "app");
const BUDGET_PATH = path.join(ROOT, "scripts", "bundle-budget.json");
const OUTPUT_PATH = path.join(ROOT, "bundle-summary.json");

export function gzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

export function readChunkMetrics(fullPath) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing chunk file: ${fullPath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  return { raw: buffer.length, gzip: gzipSize(buffer) };
}

export function sumMetrics(files, baseDir = NEXT_DIR) {
  return files.reduce(
    (acc, file) => {
      const fullPath = path.isAbsolute(file) ? file : path.join(baseDir, file);
      const metrics = readChunkMetrics(fullPath);
      acc.raw += metrics.raw;
      acc.gzip += metrics.gzip;
      return acc;
    },
    { raw: 0, gzip: 0 },
  );
}

/**
 * Chunks that exist only behind an `await import(...)` and are never part of a
 * first load. They are reported separately so published chunks metrics distinguish
 * between standard bundles and very large deferred assets (e.g. dictionaries).
 *
 * Detected by content, not filename: Turbopack chunk names are content-hashed
 * and change every build. Each probe must be a string that only the intended
 * vendor payload can contain.
 */
export const DEFERRED_CHUNK_PROBES = [
  // cmu-pronouncing-dictionary (~940KB gzip): full CMUdict, lazy-loaded by
  // lib/pronunciation/phonemes.ts for phoneme scoring. The ARPAbet entry for
  // "aaberg" appears in no other bundled module.
  { label: "cmu-pronouncing-dictionary", probe: 'aaberg:"AA1 B ER0 G"' },
];

export function classifyChunkContent(source, probes = DEFERRED_CHUNK_PROBES) {
  const match = probes.find((p) => source.includes(p.probe));
  return match ? match.label : null;
}

export function classifyChunk(fullPath, probes = DEFERRED_CHUNK_PROBES) {
  const source = fs.readFileSync(fullPath, "utf8");
  return classifyChunkContent(source, probes);
}

export function listChunkFiles(chunksDir = path.join(NEXT_DIR, "static", "chunks")) {
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

export function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

export function parseRscManifest(source) {
  const match = source.match(/globalThis\.__RSC_MANIFEST\[[^\]]+\]\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function extractRouteChunks(data) {
  const chunkSet = new Set();
  for (const mod of Object.values(data?.clientModules ?? {})) {
    for (const chunk of mod?.chunks ?? []) {
      chunkSet.add(chunk);
    }
  }
  return chunkSet;
}

export function calculateRouteGzip(chunkSet, getGzipSizeFn) {
  let totalBytes = 0;
  for (const chunk of chunkSet) {
    totalBytes += getGzipSizeFn(chunk);
  }
  return toKb(totalBytes);
}

export function findClientReferenceManifests(dir) {
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

export function routeNameFromManifestPath(manifestPath, appServerDir = APP_SERVER_DIR) {
  const rel = path.relative(appServerDir, manifestPath).replace(/\\/g, "/");
  return rel.replace(/\/page_client-reference-manifest\.js$/, "") || "/";
}

export function findRouteExclusiveChunks(targetRouteName, routes) {
  const target = routes.find((r) => r.route === targetRouteName);
  if (!target || !target.chunks) return [];
  const otherChunks = new Set();
  for (const r of routes) {
    if (r.route !== targetRouteName && r.chunks) {
      for (const c of r.chunks) {
        otherChunks.add(c);
      }
    }
  }
  return target.chunks.filter((c) => !otherChunks.has(c));
}

export function measureRoutes(appServerDir = APP_SERVER_DIR, nextDir = NEXT_DIR) {
  const manifestPaths = findClientReferenceManifests(appServerDir);
  const chunkGzipCache = new Map();

  const getChunkGzip = (chunkUrl) => {
    if (chunkGzipCache.has(chunkUrl)) return chunkGzipCache.get(chunkUrl);
    const rel = chunkUrl.replace(/^\/_next\//, "");
    const fullPath = path.join(nextDir, rel);
    const size = fs.existsSync(fullPath) ? gzipSize(fs.readFileSync(fullPath)) : 0;
    chunkGzipCache.set(chunkUrl, size);
    return size;
  };

  const routes = [];
  for (const manifestPath of manifestPaths) {
    const source = fs.readFileSync(manifestPath, "utf8");
    const data = parseRscManifest(source);
    if (!data) continue;

    const chunkSet = extractRouteChunks(data);
    const gzipKB = calculateRouteGzip(chunkSet, getChunkGzip);

    routes.push({
      route: routeNameFromManifestPath(manifestPath, appServerDir),
      chunkCount: chunkSet.size,
      gzipKB,
      chunks: Array.from(chunkSet),
    });
  }

  routes.sort((a, b) => b.gzipKB - a.gzipKB);
  return routes;
}

export function loadBudget(budgetPath = BUDGET_PATH) {
  if (!fs.existsSync(budgetPath)) {
    throw new Error(`Missing budget file: ${budgetPath}`);
  }
  return JSON.parse(fs.readFileSync(budgetPath, "utf8"));
}

export function assertBudget(summary, budget, { exitOnError = true } = {}) {
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
      failures.push(
        `${key}: ${actualKb} KB gzip exceeds budget ${limitKb} KB (+${tolerance}% tolerance → ${maxKb.toFixed(1)} KB)`
      );
    }
  }

  if (failures.length > 0) {
    const message = `Bundle budget check failed:\n${failures.map((f) => `- ${f}`).join("\n")}`;
    if (exitOnError) {
      console.error(message);
      process.exit(1);
    } else {
      throw new Error(message);
    }
  }
}

export function main() {
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

  const publishedGzipKB = toKb(allChunks.gzip);
  const publishedRawKB = toKb(allChunks.raw);
  const maxRouteGzipKB = maxRoute?.gzipKB ?? 0;

  const targetRouteName = maxRoute?.route ?? "(authenticated)/practice/review";
  const exclusiveChunks = findRouteExclusiveChunks(targetRouteName, routes);

  const summary = {
    generatedAt: new Date().toISOString(),
    buildId: fs.existsSync(path.join(NEXT_DIR, "BUILD_ID"))
      ? fs.readFileSync(path.join(NEXT_DIR, "BUILD_ID"), "utf8").trim()
      : null,
    metrics: {
      rootMainGzipKB: toKb(rootMain.gzip),
      rootMainRawKB: toKb(rootMain.raw),
      maxRouteGzipKB,
      maxRouteName: maxRoute?.route ?? null,
      // initialRouteGzipKB represents the static clientModules manifest payload for the heaviest route.
      // Validated dynamically via browser cold-navigation network capture (tests/performance/cold-navigation-js.spec.ts).
      initialRouteGzipKB: maxRouteGzipKB,
      initialRouteDerivation: "client_reference_manifest",
      publishedChunksGzipKB: publishedGzipKB,
      publishedChunksRawKB: publishedRawKB,
      publishedChunkCount: eager.length,
      allChunksGzipKB: publishedGzipKB,
      allChunksRawKB: publishedRawKB,
      chunkCount: eager.length,
      deferredChunksGzipKB: toKb(deferredChunks.gzip),
      deferredChunkCount: deferred.length,
    },
    rootMainFiles: rootFiles,
    deferredChunks: deferred.map((d) => d.label),
    exclusiveChunksForMaxRoute: {
      route: targetRouteName,
      count: exclusiveChunks.length,
      chunks: exclusiveChunks,
    },
    routes: routes.map((r) => ({
      route: r.route,
      chunkCount: r.chunkCount,
      gzipKB: r.gzipKB,
    })),
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log("Bundle summary written to bundle-summary.json");
  console.log(JSON.stringify(summary.metrics, null, 2));
  console.log("\nTop 5 heaviest routes (gzip):");
  for (const r of routes.slice(0, 5)) {
    console.log(`  ${r.gzipKB.toString().padStart(7)} KB  ${r.route}`);
  }
  if (exclusiveChunks.length > 0) {
    console.log(`\nExclusive chunks for ${targetRouteName} (${exclusiveChunks.length} chunks):`);
    for (const c of exclusiveChunks) {
      console.log(`  - ${c}`);
    }
  }
  console.log(
    `\nPublished total (diagnostic): ${publishedGzipKB} KB gzip (${eager.length} chunks)`
  );

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

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("analyze-bundle.mjs") ||
    process.argv[1].endsWith("analyze-bundle"));

if (isDirectExecution) {
  main();
}
