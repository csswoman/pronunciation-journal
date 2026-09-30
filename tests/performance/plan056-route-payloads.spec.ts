import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ROUTES = ["/offline", "/daily", "/tracking", "/practice"] as const;
const GUEST_AUTH_STATE = path.join(process.cwd(), "tests", "a11y", ".auth", "guest.json");

test("records fresh-context JavaScript payloads for Plan 056 routes", async ({ browser }) => {
  test.setTimeout(60_000);
  const baseURL = test.info().project.use.baseURL as string;
  const storageState = fs.existsSync(GUEST_AUTH_STATE) ? GUEST_AUTH_STATE : undefined;

  for (const route of ROUTES) {
    const context = await browser.newContext({
      baseURL,
      ...(storageState ? { storageState } : {}),
    });
    const page = await context.newPage();
    const responses = new Map<string, Promise<{ url: string; body: Buffer }>>();

    page.on("response", (response) => {
      const contentType = response.headers()["content-type"] ?? "";
      const pathname = new URL(response.url()).pathname;
      if (
        response.status() === 200 &&
        (contentType.includes("javascript") || pathname.endsWith(".js")) &&
        !pathname.endsWith(".css")
      ) {
        const url = response.url();
        if (!responses.has(url)) {
          responses.set(url, response.body().then((body) => ({ url, body })));
        }
      }
    });

    try {
      const documentResponse = await page.goto(route, { waitUntil: "load" });
      expect(documentResponse?.status(), route).toBe(200);
      await page.waitForTimeout(500);
      const downloaded = await Promise.all(
        [...responses.values()].map((response) =>
          response.catch(() => ({ url: "", body: Buffer.alloc(0) })),
        ),
      );
      const bytes = downloaded.reduce((total, response) => total + response.body.length, 0);
      const rawKb = Math.round((bytes / 1024) * 10) / 10;
      console.log(
        "[Plan 056 JS] " +
          route +
          ": " +
          rawKb +
          " KB across " +
          downloaded.length +
          " JavaScript responses",
      );
      console.log(
        "[Plan 056 JS top chunks] " +
          route +
          ": " +
          downloaded
            .filter((response) => Boolean(response.url))
            .map((response) => ({
              url: new URL(response.url).pathname,
              kb: Math.round((response.body.length / 1024) * 10) / 10,
            }))
            .sort((left, right) => right.kb - left.kb)
            .slice(0, 8)
            .map((response) => response.url + " (" + response.kb + " KB)")
            .join(", "),
      );
    } finally {
      await context.close();
    }
  }
});
