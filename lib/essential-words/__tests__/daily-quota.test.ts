import { describe, expect, it } from "vitest";
import { isDailyQuotaMet } from "../daily-quota";
import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

function stats(overrides: Partial<EssentialWordsStats>): EssentialWordsStats {
  return {
    totalWords: 740, learned: 10, dueCount: 0, dueTomorrow: 0,
    newToday: 0, newQuota: 10, vaulted: 0,
    ...overrides,
  };
}

describe("isDailyQuotaMet", () => {
  it("is true once today's new-word quota is filled and nothing is due today", () => {
    expect(isDailyQuotaMet(stats({ newToday: 10, newQuota: 10, dueCount: 0 }))).toBe(true);
  });

  it("is false while reviews are still due today, even if new quota is met", () => {
    expect(isDailyQuotaMet(stats({ newToday: 10, newQuota: 10, dueCount: 3 }))).toBe(false);
  });

  it("is false while the new-word quota isn't filled yet", () => {
    expect(isDailyQuotaMet(stats({ newToday: 4, newQuota: 10, dueCount: 0 }))).toBe(false);
  });

  it("is true when newQuota is 0 (no new words configured) and nothing is due", () => {
    expect(isDailyQuotaMet(stats({ newToday: 0, newQuota: 0, dueCount: 0 }))).toBe(true);
  });
});
