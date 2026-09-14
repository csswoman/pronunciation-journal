// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLastPracticeMode,
  setLastPracticeMode,
} from "../last-practice-mode";

describe("last-practice-mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null when no practice mode is stored", async () => {
    const mode = await getLastPracticeMode();
    expect(mode).toBeNull();
  });

  it("persists and retrieves the last practice mode", async () => {
    await setLastPracticeMode("chunks");
    const mode = await getLastPracticeMode();
    expect(mode).toBe("chunks");
    expect(window.localStorage.getItem("practice:last-mode:v1")).toBe("chunks");
  });

  it("gracefully returns null when localStorage.getItem throws (e.g. private mode or storage disabled)", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("QuotaExceeded or Access Denied");
    });

    const mode = await getLastPracticeMode();
    expect(mode).toBeNull();
  });

  it("gracefully handles localStorage.setItem errors without rejecting", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded or Access Denied");
    });

    await expect(setLastPracticeMode("sounds")).resolves.toBeUndefined();
  });
});
