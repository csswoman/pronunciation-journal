import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("pronunciation assessment accessibility", () => {
  test("has no critical or serious axe violations on the preflight stage", async ({ page }) => {
    await page.goto("/assessment/pronunciation");
    // The first visit compiles this route in the dev server used by CI.
    await expect(page.getByRole("button", { name: /empezar las preguntas/i })).toBeVisible({
      timeout: 15_000,
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blockingViolations = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    );

    expect(blockingViolations).toEqual([]);
  });
});
