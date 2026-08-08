import { describe, expect, it } from "vitest";
import { resumeState, RESUMPTION_WINDOW_DAYS } from "../essential-word-progress";
import type { EssentialWordProgressRecord } from "../essential-word-progress";

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_AT = "2026-06-01T00:00:00.000Z";

function record(overrides: Partial<EssentialWordProgressRecord> = {}): EssentialWordProgressRecord {
  return {
    wordId: "c1k:the", userId: "user-1",
    exposedAt: BASE_AT, highestLevel: 0, lastLevelAt: BASE_AT,
    lastSessionId: "session-1", attempts: 0,
    ...overrides,
  };
}

function daysAfterBase(n: number): Date {
  return new Date(new Date(BASE_AT).getTime() + n * DAY_MS);
}

describe("resumeState — spec §4.3 resumption table", () => {
  it("exposed, 0 exercises, within 14 days: abbreviated exposure + practice from level 1", () => {
    const decision = resumeState(record({ highestLevel: 0 }), daysAfterBase(5));
    expect(decision).toEqual({ kind: "abbreviated_exposure", fromLevel: 1 });
  });

  it("exposed, 0 exercises, past 14 days: full exposure as if new", () => {
    const decision = resumeState(record({ highestLevel: 0 }), daysAfterBase(20));
    expect(decision).toEqual({ kind: "full_exposure" });
  });

  it("level 1 reached, within 14 days: no exposure, resume at level 2", () => {
    const decision = resumeState(record({ highestLevel: 1 }), daysAfterBase(10));
    expect(decision).toEqual({ kind: "resume_no_exposure", fromLevel: 2 });
  });

  it("level 2 reached, within 14 days: no exposure, resume at level 3", () => {
    const decision = resumeState(record({ highestLevel: 2 }), daysAfterBase(10));
    expect(decision).toEqual({ kind: "resume_no_exposure", fromLevel: 3 });
  });

  it("level 1-2 reached, past 14 days: full exposure, record archived", () => {
    const decision = resumeState(record({ highestLevel: 2 }), daysAfterBase(15));
    expect(decision).toEqual({ kind: "full_exposure", archive: true });
  });

  it("level 3 reached without final round, within 14 days: no exposure, straight to final round", () => {
    const decision = resumeState(record({ highestLevel: 3 }), daysAfterBase(1));
    expect(decision).toEqual({ kind: "resume_final_round" });
  });

  it("level 3 reached without final round, past 14 days: full exposure, record archived", () => {
    const decision = resumeState(record({ highestLevel: 3 }), daysAfterBase(30));
    expect(decision).toEqual({ kind: "full_exposure", archive: true });
  });

  it("boundary: exactly 14 days is still within the window", () => {
    const decision = resumeState(record({ highestLevel: 1 }), daysAfterBase(RESUMPTION_WINDOW_DAYS));
    expect(decision.kind).toBe("resume_no_exposure");
  });

  it("boundary: 14 days + 1ms is past the window", () => {
    const now = new Date(daysAfterBase(RESUMPTION_WINDOW_DAYS).getTime() + 1);
    const decision = resumeState(record({ highestLevel: 1 }), now);
    expect(decision.kind).toBe("full_exposure");
  });
});
