import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Settled preflight CTAs — excludes the transient "Comprobando micrófono" label. */
const PREFLIGHT_CTA =
  /activar micrófono|empezar las preguntas|continuar sin micrófono/i;

test.describe("pronunciation assessment accessibility", () => {
  test("has no critical or serious axe violations on the preflight stage", async ({ page }) => {
    await page.goto("/assessment/pronunciation");
    // First visit compiles this route in the CI dev server. Button copy depends on
    // mic permission (prompt → Activar; granted → Empezar; denied → Continuar sin).
    await expect(page.getByRole("button", { name: PREFLIGHT_CTA })).toBeVisible({
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
