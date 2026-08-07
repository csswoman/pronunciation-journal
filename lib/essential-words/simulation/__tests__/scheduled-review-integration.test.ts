import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../../cost-estimate";
import { emptyLoadBreakdown } from "../../planning-load";
import type { DailyPlan, PlannedItem } from "../../planning-types";
import { applyCompletedSession, completePlannedSession } from "../apply-session";
import { PROFILES } from "../profiles";
import { seededRandom } from "../random";
import { createInitialWorld, simulationContext } from "../state";

const NOW = new Date("2026-08-20T00:00:00.000Z");
const options = {
  days: 180,
  corpusSize: 1,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

function plan(item: PlannedItem): DailyPlan {
  return {
    allowance: {
      newWords: 0,
      capacitySafeNewWords: 0,
      baseSkillActivations: 0,
      usageActivations: 0,
      newWordMeaningActivations: 0,
      totalSkillActivations: 0,
      plannedSeconds: 0,
      mode: "normal",
    },
    mandatorySelected: [item],
    deferredMandatory: [],
    baseSkillSelected: [],
    usageSelected: [],
    newWordsSelected: [],
    placementSelected: [],
    placementDeferred: 0,
    futureReservations: [],
    loadBreakdown: emptyLoadBreakdown(),
  };
}

describe("scheduled review integration", () => {
  it("separa recall de accuracy y audita retrievability FSRS", () => {
    const world = createInitialWorld(options, PROFILES.beginner);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "fsrs",
      dueAt: NOW.toISOString(),
      stability: 10,
      difficulty: 5,
      state: "Review",
    };
    word.meaning.lastReview = "2026-08-10T00:00:00.000Z";
    const item: PlannedItem = {
      itemId: word.meaning.id,
      wordId: word.wordId,
      skill: "meaning",
      modality: "recognition",
      dueAt: NOW.toISOString(),
    };
    const zeroAccuracy = {
      ...PROFILES.beginner,
      accuracyByModality: {
        ...PROFILES.beginner.accuracyByModality,
        recognition: 0,
      },
    };
    const perfectAccuracy = {
      ...zeroAccuracy,
      accuracyByModality: { ...zeroAccuracy.accuracyByModality, recognition: 1 },
    };
    const reviewContext = { now: NOW, resolveItem: () => word.meaning };
    const fromZero = completePlannedSession(
      [item], zeroAccuracy, DEFAULT_SECONDS_BY_MODALITY, 60, seededRandom(42), reviewContext,
    );
    const fromPerfect = completePlannedSession(
      [item], perfectAccuracy, DEFAULT_SECONDS_BY_MODALITY, 60, seededRandom(42), reviewContext,
    );

    expect(fromZero[0].assessment.correct).toBe(fromPerfect[0].assessment.correct);
    expect(fromZero[0].scheduledReview).toMatchObject({
      retrievability: 0.9,
      eventType: "scheduled-review",
      affectsSchedule: true,
    });

    applyCompletedSession(
      world,
      plan(item),
      fromZero,
      simulationContext(NOW, 42, { value: 0 }),
      "session-reviewed",
    );

    expect(world.srsEvents[0].fsrsAudit).toMatchObject({
      schedulerVersion: "ts-fsrs@5.4.1",
      parametersVersion: "ts-fsrs@5.4.1/default-w",
      desiredRetention: 0.9,
      retrievabilityBeforeReview: 0.9,
    });
  });

  it("clasifica los estados FSRS no Review como learning-step", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.meaning.schedule = {
      kind: "fsrs",
      dueAt: NOW.toISOString(),
      stability: 1,
      difficulty: 5,
      state: "Learning",
    };
    const item: PlannedItem = {
      itemId: word.meaning.id,
      wordId: word.wordId,
      skill: "meaning",
      modality: "recognition",
      dueAt: NOW.toISOString(),
    };
    const completions = completePlannedSession(
      [item], PROFILES.steady, DEFAULT_SECONDS_BY_MODALITY, 60, seededRandom(42), {
        now: NOW,
        resolveItem: () => word.meaning,
      },
    );

    applyCompletedSession(
      world,
      plan(item),
      completions,
      simulationContext(NOW, 42, { value: 0 }),
      "session-learning",
    );

    expect(world.attemptLogs[0].eventType).toBe("learning-step");
    expect(world.srsEvents).toHaveLength(1);
  });
});
