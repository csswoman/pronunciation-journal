import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const GUEST_AUTH_STATE = path.join(process.cwd(), "tests", "a11y", ".auth", "guest.json");

test("registers the worker, caches search data, and serves the Daily shell offline", async ({
  browser,
}) => {
  const baseURL = test.info().project.use.baseURL as string;
  const context = await browser.newContext({
    baseURL,
    ...(fs.existsSync(GUEST_AUTH_STATE) ? { storageState: GUEST_AUTH_STATE } : {}),
  });
  const page = await context.newPage();

  try {
    await page.goto("/offline", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Modo sin conexión" })).toBeVisible();

    await page.waitForFunction(
      () => Boolean(navigator.serviceWorker.controller),
      null,
      { timeout: 15_000 },
    );
    const worker = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return {
        active: Boolean(registration.active),
        scriptURL: registration.active?.scriptURL ?? "",
      };
    });
    expect(worker.active).toBe(true);
    expect(worker.scriptURL).toContain("/sw.js");

    const onlineIndex = await page.evaluate(async () => {
      const response = await fetch("/search/content-index.json");
      const data: unknown = await response.json();
      return {
        status: response.status,
        count: Array.isArray(data) ? data.length : 0,
      };
    });
    expect(onlineIndex.status).toBe(200);
    expect(onlineIndex.count).toBeGreaterThan(0);

    await page.waitForFunction(
      async () => {
        const cache = await caches.open("public-search-index");
        return Boolean(await cache.match("/search/content-index.json"));
      },
      null,
      { timeout: 15_000 },
    );

    await context.setOffline(true);
    const cachedIndex = await page.evaluate(async () => {
      const response = await fetch("/search/content-index.json");
      const data: unknown = await response.json();
      return {
        status: response.status,
        count: Array.isArray(data) ? data.length : 0,
      };
    });
    expect(cachedIndex).toEqual(onlineIndex);

    await page.evaluate(() => {
      window.history.replaceState({}, "", "/daily?step=review");
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
    await expect(page).toHaveURL(/\/daily\?step=review$/);
    await expect(page.getByRole("heading", { name: "Tu sesión de hoy" })).toBeVisible({
      timeout: 15_000,
    });

    await context.setOffline(false);
    await page.goto("/daily?step=review", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Tu sesión de hoy" })).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});
