import { describe, expect, it } from "vitest";
import { planKnownClaim, verificationCost } from "../claim-known";
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

const items = () => [unseen("meaning"), unseen("production"), unseen("listening")];

describe("planKnownClaim", () => {
  it("devuelve una prueba de producción, no una omisión", () => {
    const plan = planKnownClaim(word, items());
    expect(plan.kind).toBe("verify");
    if (plan.kind === "verify") expect(plan.step.modality).toBe("production");
  });

  it("la prueba no revela la respuesta", () => {
    const plan = planKnownClaim(word, items());
    if (plan.kind !== "verify") throw new Error("expected verify");

    expect(JSON.stringify(plan.step)).not.toContain(word.example_sentence);
    expect(plan.step.revealsAnswer).toBe(false);
  });

  it("usa la traducción como prompt español a inglés", () => {
    const plan = planKnownClaim(word, items());
    if (plan.kind !== "verify") throw new Error("expected verify");

    expect(plan.step.prompt).toBe(word.translation);
    expect(plan.step.expected).toBe(word.word);
  });

  it("aún verifica si queda una habilidad base sin programar", () => {
    const scheduled = items().map((item) =>
      item.skill === "meaning"
        ? {
            ...item,
            schedule: {
              kind: "fsrs" as const,
              dueAt: "2026-09-01T00:00:00.000Z",
              stability: 30,
              difficulty: 5,
              state: "Review" as const,
            },
          }
        : item,
    );

    expect(planKnownClaim(word, scheduled).kind).toBe("verify");
  });

  it("no verifica cuando todas las habilidades base ya están programadas", () => {
    const allScheduled = items().map((item) => ({
      ...item,
      schedule: {
        kind: "fsrs" as const,
        dueAt: "2026-09-01T00:00:00.000Z",
        stability: 30,
        difficulty: 5,
        state: "Review" as const,
      },
    }));

    expect(planKnownClaim(word, allScheduled).kind).toBe("nothing-to-verify");
  });

  it("sin traducción usa el significado", () => {
    const noTranslation = { ...word, translation: undefined } as EssentialWord;
    const plan = planKnownClaim(noTranslation, items());
    if (plan.kind !== "verify") throw new Error("expected verify");

    expect(plan.step.prompt).toBe(noTranslation.meaning);
  });
});

describe("verificationCost", () => {
  it("cuenta dos activaciones para producción y listening", () => {
    expect(verificationCost("production")).toBe(2);
    expect(verificationCost("listening")).toBe(2);
  });

  it("cuenta una activación para reconocimiento", () => {
    expect(verificationCost("recognition")).toBe(1);
  });
});
