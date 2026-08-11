import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("login accessibility", () => {
  test("has no critical or serious axe violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("tab", { name: "Iniciar sesión", selected: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Explorar sin cuenta" })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blockingViolations = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    );

    expect(blockingViolations).toEqual([]);
  });
});
