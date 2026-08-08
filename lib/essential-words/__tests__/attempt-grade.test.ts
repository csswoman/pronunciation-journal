import { describe, expect, it } from "vitest";
import { attemptGrade, gradeToLegacyQuality, LOW_LATENCY_MS, type AttemptOutcome } from "../attempt-grade";

function outcome(overrides: Partial<AttemptOutcome> = {}): AttemptOutcome {
  return {
    correct: true, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false,
    latencyMs: 1000,
    ...overrides,
  };
}

describe("attemptGrade — spec §2.1 grade table", () => {
  it("no hints, low latency, correct -> Easy", () => {
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS - 1 }))).toBe("Easy");
  });

  it("no hints, latency not low, correct -> Good", () => {
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS + 1 }))).toBe("Good");
  });

  it("1 priced hint -> Hard, regardless of latency", () => {
    expect(attemptGrade(outcome({ hintsUsed: 1, latencyMs: 100 }))).toBe("Hard");
  });

  it("2+ priced hints -> Again, even if eventually correct", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2 }))).toBe("Again");
    expect(attemptGrade(outcome({ hintsUsed: 3 }))).toBe("Again");
  });

  it("rescued to multiple choice -> Again ALWAYS, even when correct and hintsUsed is 0 (spec §2.4)", () => {
    expect(attemptGrade(outcome({ rescued: true, correct: true, hintsUsed: 0 }))).toBe("Again");
    expect(attemptGrade(outcome({ rescued: true, correct: false }))).toBe("Again");
  });

  it("firstTryFailed (failed, retried without hints, then correct) -> Again — failed recovery, decided explicitly (spec §2.2)", () => {
    expect(attemptGrade(outcome({ firstTryFailed: true, hintsUsed: 0, correct: true }))).toBe("Again");
  });

  it("typo is treated as correct without penalty — same grade as a clean correct answer", () => {
    const clean = attemptGrade(outcome({ typo: false, latencyMs: 500 }));
    const typo = attemptGrade(outcome({ typo: true, latencyMs: 500 }));
    expect(typo).toBe(clean);
  });

  it("an outright incorrect (not typo, not rescued) attempt -> Again", () => {
    expect(attemptGrade(outcome({ correct: false, typo: false, rescued: false, hintsUsed: 0 }))).toBe("Again");
  });

  it("precedence: rescued overrides everything else, including firstTryFailed and typo", () => {
    expect(
      attemptGrade(outcome({ rescued: true, correct: true, typo: true, firstTryFailed: true, hintsUsed: 0 })),
    ).toBe("Again");
  });

  it("precedence: firstTryFailed overrides hint count and latency", () => {
    expect(
      attemptGrade(outcome({ firstTryFailed: true, hintsUsed: 0, latencyMs: 1 })),
    ).toBe("Again");
  });

  it("precedence: 2+ hints overrides low latency (still Again, not Easy)", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2, latencyMs: 1 }))).toBe("Again");
  });
});

describe("gradeToLegacyQuality — bridges Grade to the existing 0-5 scheduler input", () => {
  it("maps each Grade to a distinct quality in [0,5], preserving Again < Hard < Good < Easy ordering", () => {
    const again = gradeToLegacyQuality("Again");
    const hard = gradeToLegacyQuality("Hard");
    const good = gradeToLegacyQuality("Good");
    const easy = gradeToLegacyQuality("Easy");
    expect(again).toBeLessThan(hard);
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
    expect(again).toBeGreaterThanOrEqual(0);
    expect(easy).toBeLessThanOrEqual(5);
  });

  it("Again maps below the SM-2 pass threshold of 3 (existing hook logic branches on quality >= 3)", () => {
    expect(gradeToLegacyQuality("Again")).toBeLessThan(3);
  });

  it("Hard, Good, Easy all map to >= 3 (all count as a passing attempt)", () => {
    expect(gradeToLegacyQuality("Hard")).toBeGreaterThanOrEqual(3);
    expect(gradeToLegacyQuality("Good")).toBeGreaterThanOrEqual(3);
    expect(gradeToLegacyQuality("Easy")).toBeGreaterThanOrEqual(3);
  });
});
