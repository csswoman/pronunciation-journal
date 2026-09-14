import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const AUTH_FILE = "tests/a11y/.auth/guest.json";

/**
 * Scans .next/static/chunks to locate the compiled chunk file(s) for ReviewSessionRunner.
 * ReviewSessionRunner contains distinctive strings ("¡Repaso completado!",
 * "No se pudo cargar la sesión de repaso.") not present in any other client module.
 */
function getCompiledRunnerChunks(): string[] {
  const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");
  if (!fs.existsSync(chunksDir)) return [];

  const RUNNER_PROBES = [
    "¡Repaso completado!",
    "No se pudo cargar la sesión de repaso.",
  ];

  const runnerChunks: string[] = [];
  for (const file of fs.readdirSync(chunksDir)) {
    if (!file.endsWith(".js")) continue;
    try {
      const content = fs.readFileSync(path.join(chunksDir, file), "utf8");
      if (
        RUNNER_PROBES.some((probe) => content.includes(probe)) &&
        !content.includes("ReviewHubClient")
      ) {
        runnerChunks.push(file);
      }
    } catch {
      // ignore read error
    }
  }
  return runnerChunks;
}

/**
 * Evaluates whether a network response represents a JavaScript payload.
 * Strictly accepts JavaScript content-types or .js URLs, and explicitly excludes .css
 * so CSS bundles are not misattributed to JavaScript size and chunk counts.
 */
function isJavaScriptResponse(url: string, contentType: string): boolean {
  const cleanUrl = url.split("?")[0].split("#")[0];
  if (cleanUrl.endsWith(".css") || contentType.includes("text/css")) {
    return false;
  }
  return contentType.includes("javascript") || cleanUrl.endsWith(".js");
}

test.describe("cold navigation JavaScript payload", () => {
  test.beforeAll(() => {
    const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
    if (!fs.existsSync(buildIdPath)) {
      throw new Error(
        "Missing .next/BUILD_ID. Run `pnpm build` before running performance cold-navigation tests against `next start`.",
      );
    }
  });

  test.use({
    // If guest auth was created by setup, use it; otherwise test cold nav without storage
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  });

  test("records and validates JS downloaded during cold navigation to /practice/review", async ({
    page,
    context,
  }) => {
    // Ensure fresh context / no cached resources
    await context.clearCookies();

    // 1. Identify compiled runner chunk from the production build
    const compiledRunnerChunks = getCompiledRunnerChunks();
    console.log(
      `[Cold Navigation JS] Compiled runner chunk(s) identified from build:`,
      compiledRunnerChunks,
    );
    expect(
      compiledRunnerChunks.length,
      "Expected to find compiled runner chunk in .next/static/chunks. Run `pnpm build` first.",
    ).toBeGreaterThan(0);

    const downloadedJs: Array<{ url: string; size: number; textSnippet: string }> = [];

    page.on("response", async (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";

      if (isJavaScriptResponse(url, contentType) && response.status() === 200) {
        let size = 0;
        let textSnippet = "";
        try {
          const body = await response.body();
          size = body?.length ?? 0;
          textSnippet = body?.toString("utf8") ?? "";
        } catch {
          const contentLength = response.headers()["content-length"];
          size = contentLength ? parseInt(contentLength, 10) : 0;
        }
        downloadedJs.push({ url, size, textSnippet });
      }
    });

    const targetUrl = "/practice/review";
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    // 2. Wait for a specific hydrated element from ReviewHubClient (or GuestBanner),
    // NOT generic body or container tags, ensuring client hydration has completed.
    const reviewCta = page.getByRole("button", {
      name: /repaso completo|repasar|reintentar|preparando repaso/i,
    });
    const hubMarkers = page.getByText(
      /estás al día|oraciones fallidas|palabras débiles|vocabulario pendiente|srs history/i,
    );
    const guestCta = page.getByRole("button", { name: /iniciar sesión/i });

    await expect(reviewCta.or(hubMarkers).or(guestCta).first()).toBeVisible({
      timeout: 15_000,
    });

    const totalRawBytes = downloadedJs.reduce((acc, curr) => acc + curr.size, 0);
    const totalRawKb = Math.round((totalRawBytes / 1024) * 10) / 10;
    const chunkUrls = downloadedJs.map((j) => j.url);

    console.log(`[Cold Navigation JS] Route: ${targetUrl}`);
    console.log(`[Cold Navigation JS] Downloaded chunks count: ${downloadedJs.length}`);
    console.log(`[Cold Navigation JS] Total raw JS payload: ${totalRawKb} KB`);
    console.log(
      "[Cold Navigation JS] Captured chunk URLs:\n" +
        chunkUrls.slice(0, 10).map((u) => `  - ${u}`).join("\n"),
    );

    // Validation 1: Confirm the response was served by production (next start), not next dev
    const hasDevSignals = downloadedJs.some(
      (j) =>
        j.url.includes("webpack.js") ||
        j.url.includes("webpack-hmr") ||
        j.url.includes("/_next/webpack/") ||
        j.url.includes("react-refresh"),
    );
    expect(
      hasDevSignals,
      "Expected cold-navigation test to run against a production build (`next start`), but Next dev server artifacts were detected",
    ).toBe(false);

    // Validation 2: Initial client chunks must have been downloaded, and no CSS chunks included
    expect(downloadedJs.length).toBeGreaterThan(0);
    const hasCssChunks = downloadedJs.some(
      (j) => j.url.split("?")[0].endsWith(".css"),
    );
    expect(hasCssChunks, "Expected no CSS chunks in downloadedJs").toBe(false);

    // Validation 3: Cold navigation must NOT download deferred dictionary payloads (CMUdict)
    const hasCmuDict = downloadedJs.some((j) => j.url.includes("cmu-pronouncing-dictionary"));
    expect(hasCmuDict).toBe(false);

    // Validation 3: If compiled build is present, assert none of the runner chunk files were downloaded
    if (compiledRunnerChunks.length > 0) {
      for (const runnerChunk of compiledRunnerChunks) {
        const wasChunkDownloaded = downloadedJs.some((j) => j.url.includes(runnerChunk));
        expect(
          wasChunkDownloaded,
          `Expected deferred chunk ${runnerChunk} NOT to be downloaded during cold navigation`,
        ).toBe(false);
      }
    }

    // Validation 4: In both dev and prod, assert no downloaded JS contains the ReviewSessionRunner implementation
    const downloadedRunnerContent = downloadedJs.some(
      (j) =>
        j.textSnippet.includes("¡Repaso completado!") ||
        j.textSnippet.includes("No se pudo cargar la sesión de repaso."),
    );
    expect(
      downloadedRunnerContent,
      "Expected no downloaded JS to contain ReviewSessionRunner implementation during cold navigation",
    ).toBe(false);
  });

  test("records and validates JS downloaded during cold navigation to /login", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    const downloadedJs: Array<{ url: string; size: number }> = [];

    page.on("response", async (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";

      if (isJavaScriptResponse(url, contentType) && response.status() === 200) {
        let size = 0;
        try {
          const body = await response.body();
          size = body?.length ?? 0;
        } catch {
          const contentLength = response.headers()["content-length"];
          size = contentLength ? parseInt(contentLength, 10) : 0;
        }
        downloadedJs.push({ url, size });
      }
    });

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Probar una sesión" })).toBeVisible({
      timeout: 15_000,
    });

    const totalRawBytes = downloadedJs.reduce((acc, curr) => acc + curr.size, 0);
    const totalRawKb = Math.round((totalRawBytes / 1024) * 10) / 10;

    console.log(`[Cold Navigation JS] Route: /login`);
    console.log(`[Cold Navigation JS] Downloaded chunks count: ${downloadedJs.length}`);
    console.log(`[Cold Navigation JS] Total raw JS payload: ${totalRawKb} KB`);
    const hasDevSignals = downloadedJs.some(
      (j) =>
        j.url.includes("webpack.js") ||
        j.url.includes("webpack-hmr") ||
        j.url.includes("/_next/webpack/") ||
        j.url.includes("react-refresh"),
    );
    expect(
      hasDevSignals,
      "Expected cold-navigation test to run against a production build (`next start`), but Next dev server artifacts were detected",
    ).toBe(false);

    expect(downloadedJs.length).toBeGreaterThan(0);
    const hasCssChunks = downloadedJs.some(
      (j) => j.url.split("?")[0].endsWith(".css"),
    );
    expect(hasCssChunks, "Expected no CSS chunks in downloadedJs").toBe(false);
  });
});
