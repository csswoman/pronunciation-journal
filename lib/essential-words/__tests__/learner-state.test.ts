// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { deriveEssentialWordLearnerState } from "../learner-state";
import {
  declareEssentialWordKnown,
  getEssentialWordLearnerSignal,
  reportEssentialWordPronunciationDifficulty,
} from "../learner-state-queries";
import type { LearningItem } from "../verification/types";

const USER = "00000000-0000-4000-8000-000000000013";
const WORD = "c1k:achieve";
const AT = "2026-09-13T12:00:00.000Z";

function item(skill: "meaning" | "listening" | "production"): LearningItem {
  return {
    id: `${WORD}#${skill}`,
    wordId: WORD,
    skill,
    contentOrigin: "authored",
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  };
}

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

afterEach(() => db.close());

describe("estado multidimensional de Essential Words", () => {
  it("deriva significado, escucha y producción por separado de la autoevaluación", () => {
    const state = deriveEssentialWordLearnerState([
      { ...item("meaning"), schedule: { kind: "provisional", dueAt: AT, source: "direct", evidenceConfidence: 1 } },
      { ...item("listening"), schedule: { kind: "fsrs", dueAt: AT, stability: 3, difficulty: 5, state: "Learning" } },
      item("production"),
    ], { familiarity: "self-declared", pronunciationDifficulty: "self-reported" });

    expect(state).toEqual({
      familiarity: "self-declared",
      pronunciationDifficulty: "self-reported",
      meaning: "provisional",
      listening: "learning",
      production: "unseen",
      usage: "unseen",
    });
  });

  it("persiste ambos avisos por la misma clave sin alterar el otro", async () => {
    await declareEssentialWordKnown(USER, WORD, AT);
    await reportEssentialWordPronunciationDifficulty(USER, WORD, AT);
    await reportEssentialWordPronunciationDifficulty(USER, WORD, AT);

    expect(await getEssentialWordLearnerSignal(USER, WORD)).toEqual({
      id: `${USER}:${WORD}`,
      userId: USER,
      wordId: WORD,
      familiarity: "self-declared",
      declaredKnownAt: AT,
      pronunciationDifficulty: "self-reported",
      pronunciationDifficultyAt: AT,
      updatedAt: AT,
    });
    expect(await db.essentialWordLearnerSignals.count()).toBe(1);
  });
});
