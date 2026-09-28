import { describe, expect, it } from "vitest";
import { patchRecheck, addDaysIso, effectiveStatus } from "../status";
import type { SRSData } from "@/lib/types";

const base: SRSData = {
  wordId: "c1k:example",
  word: "example",
  ease: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: "2026-01-01T00:00:00.000Z",
};

describe("patchRecheck", () => {
  it("schedules nextReview +4 days and leaves status unset (active)", () => {
    const now = new Date("2026-09-27T12:00:00.000Z");
    const patched = patchRecheck(base, now, 4);

    expect(patched.status).toBeUndefined();
    expect(effectiveStatus(patched)).toBe("active");
    expect(patched.nextReview).toBe(addDaysIso(now, 4));
    expect(patched.ease).toBe(2.5);
    expect(patched.interval).toBe(4);
    expect(patched.repetitions).toBe(0);
  });

  it("cleans up any preexisting archived, snoozedAt, or masteredAt fields", () => {
    const now = new Date("2026-09-27T12:00:00.000Z");
    const messy: SRSData = {
      ...base,
      archived: true,
      archivedAt: "2026-01-01T00:00:00.000Z",
      snoozedAt: "2026-01-01T00:00:00.000Z",
      masteredAt: "2026-01-01T00:00:00.000Z",
    };
    const patched = patchRecheck(messy, now);

    expect(patched.status).toBeUndefined();
    expect(patched.archived).toBeUndefined();
    expect(patched.archivedAt).toBeUndefined();
    expect(patched.snoozedAt).toBeUndefined();
    expect(patched.masteredAt).toBeUndefined();
  });
});
