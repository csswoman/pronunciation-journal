import { describe, expect, it } from "vitest";
import { resolveThemeMode } from "../resolve-theme-mode";

describe("resolveThemeMode", () => {
  it("prefers an explicit saved dark mode over system light", () => {
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("prefers an explicit saved light mode over system dark", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
  });

  it("falls back to system preference when nothing is saved", () => {
    expect(resolveThemeMode(null, true)).toBe("dark");
    expect(resolveThemeMode(null, false)).toBe("light");
    expect(resolveThemeMode("nope", true)).toBe("dark");
  });
});
