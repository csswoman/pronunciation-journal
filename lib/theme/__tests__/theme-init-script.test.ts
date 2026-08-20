import { describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT } from "../theme-init-script";

describe("THEME_INIT_SCRIPT", () => {
  it("applies persisted dark mode and hue before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain("theme-mode");
    expect(THEME_INIT_SCRIPT).toContain("theme-hue");
    expect(THEME_INIT_SCRIPT).toContain("classList.toggle('dark'");
    expect(THEME_INIT_SCRIPT).toContain("colorScheme");
    // Must not depend on next/script loaders — layout embeds this as raw <script>.
    expect(THEME_INIT_SCRIPT).not.toContain("beforeInteractive");
  });

  it("seeds split-complementary accent hues before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain("--hue-accent-1");
    expect(THEME_INIT_SCRIPT).toContain("--hue-accent-2");
    expect(THEME_INIT_SCRIPT).toContain("--chroma-boost-accent-1");
  });
});
