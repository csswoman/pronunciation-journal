import { describe, expect, it } from "vitest";
import { deriveObservations, derivePlacements } from "../policy";
import type { AttemptAssessment, AttemptModality, LearningItem } from "../types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const assess = (
  modality: AttemptModality,
  grade: AttemptAssessment["grade"],
): AttemptAssessment => ({
  grade,
  modality,
  correct: grade !== "Again",
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: grade === "Hard",
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: grade === "Again",
  freeAudioReplays: 0,
});

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

const place = (
  assessment: AttemptAssessment,
  items = [unseen("meaning"), unseen("production")],
) => derivePlacements(deriveObservations(assessment, NOW), assessment, items, NOW);

describe("derivePlacements — verificación directa de producción", () => {
  it("Easy coloca ambas habilidades como provisionales", () => {
    const placements = place(assess("production", "Easy"));

    expect(placements).toHaveLength(2);
    expect(placements.every((placement) => placement.schedule.kind === "provisional")).toBe(true);
    expect(placements.every((placement) => placement.verificationSource === "direct")).toBe(true);
  });

  it("Good deja meaning provisional y production en learning", () => {
    const placements = place(assess("production", "Good"));
    const meaning = placements.find((placement) => placement.skill === "meaning")!;
    const production = placements.find((placement) => placement.skill === "production")!;

    expect(meaning.schedule.kind).toBe("provisional");
    expect(production.schedule.kind).toBe("fsrs");
  });

  it("Hard coloca production en learning", () => {
    const production = place(assess("production", "Hard"))
      .find((placement) => placement.skill === "production")!;

    expect(production.schedule.kind).toBe("fsrs");
  });

  it("Again coloca ambas en learning, sin reinterpretar la modalidad", () => {
    const placements = place(assess("production", "Again"));

    expect(placements).toHaveLength(2);
    expect(placements.every((placement) => placement.schedule.kind === "fsrs")).toBe(true);
    expect(placements.map((placement) => placement.skill).sort()).toEqual(["meaning", "production"]);
  });

  it("nunca coloca listening desde una prueba escrita", () => {
    for (const grade of ["Easy", "Good", "Hard", "Again"] as const) {
      expect(place(assess("production", grade)).map((placement) => placement.skill))
        .not.toContain("listening");
    }
  });
});

describe("derivePlacements — prueba auditiva", () => {
  const items = [unseen("meaning"), unseen("listening")];

  it("Easy coloca meaning y listening como provisionales", () => {
    const placements = place(assess("listening", "Easy"), items);

    expect(placements.every((placement) => placement.schedule.kind === "provisional")).toBe(true);
  });

  it("Hard deja listening en learning", () => {
    const listening = place(assess("listening", "Hard"), items)
      .find((placement) => placement.skill === "listening")!;

    expect(listening.schedule.kind).toBe("fsrs");
  });

  it("nunca coloca production", () => {
    for (const grade of ["Easy", "Good", "Hard", "Again"] as const) {
      expect(place(assess("listening", grade), items).map((placement) => placement.skill))
        .not.toContain("production");
    }
  });
});

describe("derivePlacements — reglas transversales", () => {
  it("no coloca una habilidad que no fue observada", () => {
    const placements = place(assess("recognition", "Easy"), [
      unseen("meaning"),
      unseen("listening"),
    ]);

    expect(placements.map((placement) => placement.skill)).toEqual(["meaning"]);
  });

  it("un ítem ya en FSRS no se degrada a provisional", () => {
    const mature: LearningItem = {
      ...unseen("meaning"),
      schedule: {
        kind: "fsrs",
        dueAt: "2026-09-01T00:00:00.000Z",
        stability: 30,
        difficulty: 5,
        state: "Review",
      },
    };
    const placements = place(assess("production", "Easy"), [mature, unseen("production")]);
    const meaning = placements.find((placement) => placement.skill === "meaning")!;

    expect(meaning.schedule.kind).toBe("fsrs");
  });

  it("una colocación provisional nunca produce un ítem maduro", () => {
    const placements = place(assess("production", "Easy"));

    expect(placements.every((placement) => placement.schedule.kind === "provisional")).toBe(true);
  });
});
