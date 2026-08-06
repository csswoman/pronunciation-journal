import { describe, expect, it } from "vitest";
import { countDueTomorrow } from "../due-tomorrow";
import type { SRSData } from "@/lib/types";

function entry(nextReview: string): SRSData {
  return {
    wordId: "essential-words:test",
    word: "test",
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview,
  };
}

describe("countDueTomorrow", () => {
  it("counts entries whose nextReview falls on tomorrow's local date", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    const entries = [
      entry("2026-08-07T03:00:00.000Z"), // tomorrow
      entry("2026-08-07T23:00:00.000Z"), // tomorrow
      entry("2026-08-06T23:00:00.000Z"), // today
      entry("2026-08-08T03:00:00.000Z"), // day after tomorrow
    ];
    expect(countDueTomorrow(entries, now)).toBe(2);
  });

  it("returns 0 when nothing is due tomorrow", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    expect(countDueTomorrow([entry("2026-08-06T23:00:00.000Z")], now)).toBe(0);
  });

  it("ignores overdue entries (nextReview in the past)", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    expect(countDueTomorrow([entry("2026-08-01T03:00:00.000Z")], now)).toBe(0);
  });
});
