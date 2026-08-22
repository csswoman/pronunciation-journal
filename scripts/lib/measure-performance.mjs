import fs from "node:fs";

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function fail(message) {
  console.error(`\n[measure-performance] FAIL: ${message}\n`);
  process.exit(1);
}

export async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  fail(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

export async function assertProductionBuild(page) {
  const probe = await page.evaluate(() => {
    const scripts = [...document.scripts].map((s) => s.src || s.id || "");
    // Real next-dev signals only. Do NOT match production Turbopack chunk
    // names like `/_next/static/chunks/turbopack-*.js` — those are normal
    // for `next build` / `next start` on Next 16.
    const hasHmr =
      scripts.some((s) =>
        /webpack-hmr|react-refresh|\/_next\/static\/chunks\/_dev|@vite\/client|\/_next\/webpack/i.test(
          s,
        ),
      ) ||
      Boolean(
        document.querySelector(
          "script[data-nextjs-dev-overlay], #__next-build-watcher, nextjs-portal",
        ),
      );
    const hasProdChunks = [...document.querySelectorAll("script[src]")].some(
      (el) =>
        /\/_next\/static\/(chunks|css|media)\//.test(
          el.getAttribute("src") || "",
        ),
    );
    const bodyText = (document.body?.innerText || "").slice(0, 4000);
    return { hasHmr, hasProdChunks, bodyText, title: document.title };
  });

  if (probe.hasHmr) {
    fail(
      "Detected a development/HMR client. Run against `next start` (or pass --start), not `next dev`.",
    );
  }
  if (!probe.hasProdChunks) {
    fail(
      "No production /_next/static/* chunks found — refusing to write a baseline from a non-production server.",
    );
  }
  return probe;
}

export async function assertAuthenticatedContent(page, route, routeContent) {
  const url = page.url();
  if (/\/(login|auth|signin)/i.test(url) && !route.startsWith("/auth")) {
    fail(
      `${route} redirected to auth (${url}). Set PERF_STORAGE_STATE to a Playwright storageState JSON from an authenticated session.`,
    );
  }

  const bodyText = await page.evaluate(() => document.body?.innerText || "");
  const loginWall =
    /sign in|iniciar sesión|create account|crear cuenta|continuar con google/i.test(
      bodyText,
    ) && bodyText.length < 800;
  if (loginWall) {
    fail(
      `${route} looks like a login wall, not authenticated app content. Provide PERF_STORAGE_STATE.`,
    );
  }

  const patterns = routeContent[route] || [];
  const matched = patterns.some((re) => re.test(bodyText));
  if (!matched) {
    fail(
      `${route} did not contain expected authenticated content markers. Got title/body snippet only — aborting so baselines stay trustworthy.`,
    );
  }
}

export async function measureRoute(browser, route, options) {
  const { storageState, defaultAuthFile, port, baseUrl, routeContent } =
    options;
  const contextOptions = {
    // Block Serwist so /essential-words/*.json keep real network headers/sizes.
    serviceWorkers: "block",
  };
  if (storageState) {
    if (!fs.existsSync(storageState)) {
      fail(
        `PERF_STORAGE_STATE file not found: ${storageState}\n` +
          `  Generate a guest session (with the prod server already on :${port}):\n` +
          `    pnpm exec playwright install chromium\n` +
          `    pnpm exec playwright test --project=setup\n` +
          `  Then re-run:\n` +
          `    PERF_STORAGE_STATE=${defaultAuthFile} pnpm measure:performance`,
      );
    }
    contextOptions.storageState = storageState;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  let jsBytesTransferred = 0;
  let totalBytesTransferred = 0;
  let totalRequests = 0;
  let clientRestRequests = 0;
  let essentialWordsJsonBytes = 0;
  /** @type {string[]} */
  const essentialWordsUrls = [];
  /** @type {Promise<void>[]} */
  const sizeJobs = [];

  const headerSize = (response) => {
    const raw =
      response.headers()["content-length"] ??
      response.headers()["Content-Length"] ??
      "";
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const resolveSize = async (response) => {
    const fromHeader = headerSize(response);
    if (fromHeader > 0) return fromHeader;
    try {
      const body = await response.body();
      return body?.length ?? 0;
    } catch {
      return 0;
    }
  };

  page.on("response", (response) => {
    totalRequests++;
    const url = response.url();
    if (url.includes("/rest/v1/") || url.includes("/api/")) clientRestRequests++;

    const isJs =
      response.headers()["content-type"]?.includes("javascript") ||
      url.endsWith(".js") ||
      url.includes("/_next/static/chunks/");
    const isEssentialWords = url.includes("/essential-words/");

    if (isEssentialWords) essentialWordsUrls.push(url);

    sizeJobs.push(
      (async () => {
        const size = await resolveSize(response);
        totalBytesTransferred += size;
        if (isJs) jsBytesTransferred += size;
        if (isEssentialWords) essentialWordsJsonBytes += size;
      })(),
    );
  });

  await page.addInitScript(() => {
    window.__perf_metrics = {
      fcp: 0,
      lcp: 0,
      cls: 0,
      longTaskDuration: 0,
      longTaskCount: 0,
    };
    try {
      const poFCP = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === "first-contentful-paint")
            window.__perf_metrics.fcp = e.startTime;
        }
      });
      poFCP.observe({ type: "paint", buffered: true });

      const poLCP = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0)
          window.__perf_metrics.lcp = entries[entries.length - 1].startTime;
      });
      poLCP.observe({ type: "largest-contentful-paint", buffered: true });

      const poCLS = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__perf_metrics.cls += e.value;
        }
      });
      poCLS.observe({ type: "layout-shift", buffered: true });

      const poLong = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__perf_metrics.longTaskDuration += e.duration;
          window.__perf_metrics.longTaskCount += 1;
        }
      });
      poLong.observe({ type: "longtask", buffered: true });
    } catch {
      // PerformanceObserver may be unavailable
    }
  });

  const essentialWordsResponse =
    route === "/practice/essential-words"
      ? page.waitForResponse(
          (res) =>
            res.url().includes("/essential-words/") &&
            res.ok() &&
            !res.url().includes("favicon"),
          { timeout: 90_000 },
        )
      : null;

  await page.goto(baseUrl + route, { waitUntil: "load", timeout: 45000 });
  await sleep(2500);

  await assertProductionBuild(page);
  await assertAuthenticatedContent(page, route, routeContent);

  if (route === "/practice/essential-words") {
    let firstEssential = null;
    try {
      firstEssential = await essentialWordsResponse;
    } catch {
      fail(
        `/practice/essential-words never requested /essential-words/* within 90s.\n` +
          `  Seen so far: ${essentialWordsUrls.length ? essentialWordsUrls.join(", ") : "(none)"}\n` +
          `  The hub should call fetchEssentialWords() / catalog on mount — check auth, CSP, or a stuck loading phase.`,
      );
    }

    // Finish body reads (words-all.json is ~25MB — Content-Length is often missing
    // under Playwright when SW/cache intervenes; body()/resource timing still work).
    await Promise.all(sizeJobs);

    if (essentialWordsJsonBytes === 0 && firstEssential) {
      try {
        essentialWordsJsonBytes = (await firstEssential.body()).length;
        totalBytesTransferred += essentialWordsJsonBytes;
      } catch {
        // fall through to PerformanceResourceTiming
      }
    }

    if (essentialWordsJsonBytes === 0) {
      const fromPerf = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter((e) => e.name.includes("/essential-words/"))
          .reduce(
            (sum, e) =>
              sum +
              (e.encodedBodySize ||
                e.decodedBodySize ||
                e.transferSize ||
                0),
            0,
          ),
      );
      essentialWordsJsonBytes = fromPerf;
      totalBytesTransferred += fromPerf;
    }

    if (essentialWordsJsonBytes === 0) {
      fail(
        `/practice/essential-words loaded /essential-words/ but payload size is still 0.\n` +
          `  URLs: ${essentialWordsUrls.join(", ") || "(none)"}\n` +
          `  Refuse to write a false 0 KB baseline.`,
      );
    }
  } else {
    await Promise.all(sizeJobs);
  }

  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const memory = performance.memory
      ? performance.memory.usedJSHeapSize
      : null;
    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : 0,
      dcl: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      heapMB: memory ? Math.round((memory / (1024 * 1024)) * 10) / 10 : null,
      custom: window.__perf_metrics,
    };
  });

  await context.close();

  return {
    route,
    ttfb: Math.round(navTiming.ttfb),
    dcl: Math.round(navTiming.dcl),
    fcp: Math.round(navTiming.custom?.fcp || 0),
    lcp: Math.round(navTiming.custom?.lcp || 0),
    cls: Math.round((navTiming.custom?.cls || 0) * 1000) / 1000,
    longTaskMs: Math.round(navTiming.custom?.longTaskDuration || 0),
    jsKb: Math.round((jsBytesTransferred / 1024) * 10) / 10,
    totalKb: Math.round((totalBytesTransferred / 1024) * 10) / 10,
    essentialWordsKb: Math.round((essentialWordsJsonBytes / 1024) * 10) / 10,
    requests: totalRequests,
    restRequests: clientRestRequests,
    heapMB: navTiming.heapMB,
  };
}

export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
