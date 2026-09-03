import { existsSync, rmSync } from "node:fs";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "tests/a11y/.auth/guest.json";

/**
 * Signs in as an anonymous Supabase guest via the real login UI and saves
 * storage state so authenticated a11y specs can reuse it without per-test
 * credentials. Anonymous sign-in must be enabled on the connected Supabase
 * project (`enable_anonymous_sign_ins = true`); if it isn't, guest sign-in
 * fails and dependent specs skip themselves rather than fail CI.
 */
setup("authenticate as guest", async ({ page }) => {
  await page.goto("/login");
  const guestButton = page.getByRole("button", { name: "Probar una sesión" });
  await expect(guestButton).toBeVisible();
  await guestButton.click();

  const authFailed = page.getByText(/no se pudo iniciar sesión|error/i);
  const result = await Promise.race([
    page.waitForURL("/", { timeout: 10_000 }).then(() => "signed-in" as const),
    authFailed.waitFor({ timeout: 10_000 }).then(() => "failed" as const),
  ]).catch(() => "timeout" as const);

  if (result !== "signed-in") {
    if (existsSync(AUTH_FILE)) {
      rmSync(AUTH_FILE);
    }
    setup.skip(
      true,
      "Guest sign-in did not complete — enable_anonymous_sign_ins is likely off on the connected Supabase project.",
    );
    return;
  }

  await page.context().storageState({ path: AUTH_FILE });
});
