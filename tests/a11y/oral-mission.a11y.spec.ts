import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AUTH_FILE = "tests/a11y/.auth/guest.json";

test.describe("oral mission accessibility", () => {
  test.skip(
    !existsSync(AUTH_FILE),
    "No guest session available — auth.setup.ts skipped because anonymous sign-in is disabled on the connected Supabase project.",
  );
  test.use({ storageState: AUTH_FILE });

  test("has no critical or serious axe violations on an active mission", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Abrir el asistente de práctica" }).click();
    await page.getByRole("button", { name: "Misiones" }).click();

    const startButton = page.getByRole("button", { name: "Empezar" }).first();
    await expect(startButton).toBeVisible({ timeout: 15_000 });
    await startButton.click();

    // MissionRunner starts in the briefing phase — wait for its OBJETIVO kicker.
    await expect(page.getByText("OBJETIVO", { exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blockingViolations = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    );

    expect(blockingViolations).toEqual([]);
  });
});
