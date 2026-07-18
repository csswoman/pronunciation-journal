import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  addDaysIso,
  patchSnooze,
  patchMaster,
  patchActivateNow,
  activateExpiredSnoozes,
  isDueForQueue,
} from "../status";
import type { SRSData } from "@/lib/types";

const base: SRSData = {
  wordId: "c1k:the",
  word: "the",
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-01-01T00:00:00.000Z",
};

describe("effectiveStatus", () => {
  it("treats missing status as active", () => {
    expect(effectiveStatus(base)).toBe("active");
  });
  it("maps legacy archived to snoozed", () => {
    expect(effectiveStatus({ ...base, archived: true })).toBe("snoozed");
  });
});

describe("patchSnooze", () => {
  it("sets snoozed + nextReview +90d by default", () => {
    const now = new Date("2026-07-17T12:00:00.000Z");
    const next = patchSnooze(base, now, 90);
    expect(next.status).toBe("snoozed");
    expect(next.nextReview).toBe(addDaysIso(now, 90));
    expect(next.snoozedAt).toBe(now.toISOString());
  });
});

describe("activateExpiredSnoozes", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");

  it("activates snoozed entries whose nextReview is in the past", () => {
    const snoozed = {
      ...base,
      status: "snoozed" as const,
      nextReview: "2026-07-01T00:00:00.000Z",
    };
    const [result] = activateExpiredSnoozes([snoozed], now);
    expect(result.status).toBe("active");
    expect(result.nextReview).toBe(now.toISOString());
  });

  it("leaves future snoozed entries unchanged", () => {
    const snoozed = {
      ...base,
      status: "snoozed" as const,
      nextReview: "2026-10-01T00:00:00.000Z",
    };
    const [result] = activateExpiredSnoozes([snoozed], now);
    expect(result).toBe(snoozed);
    expect(result.status).toBe("snoozed");
  });
});

describe("isDueForQueue", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");
  it("excludes mastered and future snoozed", () => {
    expect(isDueForQueue({ ...base, status: "mastered" }, now)).toBe(false);
    expect(
      isDueForQueue(
        { ...base, status: "snoozed", nextReview: "2026-10-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });
  it("includes active when nextReview <= now", () => {
    expect(isDueForQueue({ ...base, status: "active", nextReview: "2026-07-01T00:00:00.000Z" }, now)).toBe(true);
  });
});
