import { describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT } from "../theme-init-script";

describe("THEME_INIT_SCRIPT", () => {
  it("applies persisted dark mode and accent before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain("theme-mode");
    expect(THEME_INIT_SCRIPT).toContain("theme-accent");
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
    expect(THEME_INIT_SCRIPT).toContain("data-accent");
    expect(THEME_INIT_SCRIPT).toContain("classList.toggle('dark'");
    expect(THEME_INIT_SCRIPT).toContain("colorScheme");
    // Must not depend on next/script loaders — layout embeds this as raw <script>.
    expect(THEME_INIT_SCRIPT).not.toContain("beforeInteractive");
  });
});

