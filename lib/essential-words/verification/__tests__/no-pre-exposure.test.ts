import { describe, expect, it } from "vitest";
import { planKnownClaim } from "../claim-known";
import { buildAssessment } from "../assessment";
import { planAttemptRecord } from "../../record-attempt";
import { fixedExecutionContext } from "../../execution-context";
import type { LearningItem } from "../types";
import type { EssentialWord } from "../../types";

const word = {
  word: "on",
  rank: 12,
  cefr_level: "A1",
  pos: "preposition",
  translation: "en / sobre",
  meaning: "in contact with a surface",
  example_sentence: "The book is on the table.",
  ipa_strong: "/ɒn/",
} as EssentialWord;

const unseen = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule: { kind: "none" },
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

describe("el flujo de claim no expone la respuesta antes de medir", () => {
  it("el paso de verificación no incluye la palabra inglesa en el prompt", () => {
    const plan = planKnownClaim(word, [unseen("meaning"), unseen("production")]);
    if (plan.kind !== "verify") throw new Error("expected verify");

    expect(plan.step.prompt.toLowerCase()).not.toContain(word.word.toLowerCase());
  });

  it("no incluye IPA ni frase de ejemplo: ambas darían la respuesta", () => {
    const plan = planKnownClaim(word, [unseen("meaning"), unseen("production")]);
    if (plan.kind !== "verify") throw new Error("expected verify");

    const serialized = JSON.stringify(plan.step);
    expect(serialized).not.toContain("/ɒn/");
    expect(serialized).not.toContain(word.example_sentence);
  });

  it("un Easy verificado coloca provisionales, no archiva la palabra", () => {
    const assessment = buildAssessment(
      {
        correct: true,
        hintsUsed: 0,
        rescued: false,
        typo: false,
        firstTryFailed: false,
        latencyMs: 4_000,
      },
      "production",
      { interactionDurationMs: 11_000 },
    );
    const plan = planAttemptRecord({
      wordId: "c1k:on",
      sessionId: "s1",
      assessment,
      eventType: "verification",
      currentItems: [unseen("meaning"), unseen("production")],
    }, fixedExecutionContext(
      new Date("2026-08-06T10:00:00.000Z"),
      ["attempt-1", "event-1", "event-2"],
    ));

    expect(plan.updatedItems.every((item) => item.schedule.kind === "provisional")).toBe(true);
    expect(plan.updatedItems.every((item) => item.suspended === false)).toBe(true);
  });

  it("un Again verificado no castiga: coloca en aprendizaje normal", () => {
    const assessment = buildAssessment(
      {
        correct: false,
        hintsUsed: 0,
        rescued: false,
        typo: false,
        firstTryFailed: false,
        latencyMs: 8_000,
      },
      "production",
      { interactionDurationMs: 15_000 },
    );
    const plan = planAttemptRecord({
      wordId: "c1k:on",
      sessionId: "s1",
      assessment,
      eventType: "verification",
      currentItems: [unseen("meaning"), unseen("production")],
    }, fixedExecutionContext(
      new Date("2026-08-06T10:00:00.000Z"),
      ["attempt-1", "event-1", "event-2"],
    ));

    expect(plan.updatedItems).toHaveLength(2);
    expect(plan.updatedItems.every((item) => item.schedule.kind === "fsrs")).toBe(true);
  });
});
