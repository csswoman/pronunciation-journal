import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import {
  fail,
  median,
  measureRoute,
  sleep,
  waitForServer,
} from "./lib/measure-performance.mjs";

const portArgIdx = process.argv.indexOf("--port");
const PORT =
  portArgIdx !== -1 && process.argv[portArgIdx + 1]
    ? process.argv[portArgIdx + 1]
    : process.env.PORT || "3000";
const BASE_URL = process.env.PERF_BASE_URL || `http://localhost:${PORT}`;
const DEFAULT_AUTH_FILE = "tests/a11y/.auth/guest.json";
const STORAGE_STATE =
  process.env.PERF_STORAGE_STATE ||
  (fs.existsSync(DEFAULT_AUTH_FILE) ? DEFAULT_AUTH_FILE : "");
const SHOULD_START = process.argv.includes("--start");
const NUM_SAMPLES = 3;

const ROUTES = [
  "/",
  "/daily",
  "/practice/sounds",
  "/practice/review",
  "/progress",
  "/practice/essential-words",
];

/** Route → markers that must appear in authenticated production content. */
const ROUTE_CONTENT = {
  "/": [/Pronunciation Journal|Hoy|Daily|Práctica|Practice/i],
  "/daily": [/Daily|Plan|Hoy|ejercicio|exercise/i],
  "/practice/sounds": [/sound|fonema|contrast|Sound/i],
  "/practice/review": [/review|repaso|Review/i],
  "/progress": [/progress|progreso|racha|streak|fluidez|fluency/i],
  "/practice/essential-words": [/essential|palabra|word|Core|NGSL/i],
};

const MEASURE_OPTIONS = {
  storageState: STORAGE_STATE,
  defaultAuthFile: DEFAULT_AUTH_FILE,
  port: PORT,
  baseUrl: BASE_URL,
  routeContent: ROUTE_CONTENT,
};

async function maybeStartProductionServer() {
  if (!SHOULD_START) return null;

  const nextBin = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  if (!fs.existsSync(nextBin)) {
    fail("next binary not found — run pnpm install first");
  }

  console.log("Building production bundle (next build)...");
  await new Promise((resolve, reject) => {
    const build = spawn(process.execPath, [nextBin, "build"], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    build.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`next build exited ${code}`)),
    );
  });

  console.log(`Starting production server on :${PORT} (next start)...`);
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
  });
  child.stdout.on("data", (buf) => process.stdout.write(buf));
  child.stderr.on("data", (buf) => process.stderr.write(buf));
  await waitForServer(BASE_URL);
  return child;
}

async function main() {
  if (!STORAGE_STATE) {
    fail(
      `No auth storageState found.\n` +
        `  Set PERF_STORAGE_STATE to a Playwright JSON, or generate the default guest file:\n` +
        `    pnpm exec playwright install chromium\n` +
        `    pnpm exec playwright test --project=setup\n` +
        `  That writes ${DEFAULT_AUTH_FILE} (gitignored). Then:\n` +
        `    pnpm measure:performance`,
    );
  }
  console.log(`Using storageState: ${STORAGE_STATE}`);

  const child = await maybeStartProductionServer();
  if (!SHOULD_START) {
    await waitForServer(BASE_URL, 15_000).catch(() =>
      fail(
        `Nothing listening at ${BASE_URL}. Start with \`pnpm build && pnpm start\` or re-run with --start.`,
      ),
    );
  }

  const isAfter = process.argv.includes("--after");
  const outFile = isAfter
    ? "performance-after.json"
    : "performance-baseline.json";
  console.log(
    `Measuring performance against ${BASE_URL} (${isAfter ? "AFTER" : "BASELINE"})...`,
  );
  const browser = await chromium.launch({ headless: true });
  const results = {};

  try {
    for (const route of ROUTES) {
      console.log(`Measuring ${route}...`);
      const samples = [];
      for (let i = 0; i < NUM_SAMPLES; i++) {
        samples.push(await measureRoute(browser, route, MEASURE_OPTIONS));
        await sleep(500);
      }
      results[route] = {
        ttfb: median(samples.map((s) => s.ttfb)),
        fcp: median(samples.map((s) => s.fcp)),
        lcp: median(samples.map((s) => s.lcp)),
        dcl: median(samples.map((s) => s.dcl)),
        cls: median(samples.map((s) => s.cls)),
        longTaskMs: median(samples.map((s) => s.longTaskMs)),
        jsKb: median(samples.map((s) => s.jsKb)),
        totalKb: median(samples.map((s) => s.totalKb)),
        essentialWordsKb: median(samples.map((s) => s.essentialWordsKb)),
        requests: median(samples.map((s) => s.requests)),
        restRequests: median(samples.map((s) => s.restRequests)),
        heapMB: median(samples.map((s) => s.heapMB).filter(Boolean)),
      };
    }
  } finally {
    await browser.close();
    if (child) {
      child.kill("SIGTERM");
    }
  }

  console.table(results);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
