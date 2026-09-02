import { describe, expect, it } from "vitest";
import { safeNextPath } from "../safe-next-path";

describe("safeNextPath", () => {
  it("keeps ordinary in-app paths", () => {
    expect(safeNextPath("/journal")).toBe("/journal");
    expect(safeNextPath("/login?mode=recovery")).toBe("/login?mode=recovery");
  });

  it("falls back when there is no target", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("http://evil.com")).toBe("/");
  });

  it("rejects protocol-relative open redirects", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("//evil.com/phish")).toBe("/");
  });

  it("rejects backslash-smuggled absolute URLs", () => {
    expect(safeNextPath("/\\evil.com")).toBe("/");
  });

  it("honours a custom fallback", () => {
    expect(safeNextPath("//evil.com", "/login")).toBe("/login");
  });
});
