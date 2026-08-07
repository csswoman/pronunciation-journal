import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../../cost-estimate";
import { emptyLoadBreakdown } from "../../planning-load";
import type { DailyPlan, PlannedItem } from "../../planning-types";
import {
  applyCompletedSession,
  completePlannedSession,
  type SimulatedCompletion,
} from "../apply-session";
import { PROFILES } from "../profiles";
import { seededRandom } from "../random";
import {
  applyInferenceConversions,
  createInitialWorld,
  simulationContext,
  type SimulationOptions,
} from "../state";

const NOW = new Date("2026-08-20T00:00:00.000Z");
const options: SimulationOptions = {
  days: 180,
  corpusSize: 3,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const allowance = (mode: "normal" | "recovery" = "normal") => ({
  newWords: 0,
  capacitySafeNewWords: 0,
  baseSkillActivations: 0,
  usageActivations: 0,
  newWordMeaningActivations: 0,
  totalSkillActivations: 0,
  plannedSeconds: 0,
  mode,
});

function dailyPlan(overrides: Partial<DailyPlan> = {}): DailyPlan {
  return {
    allowance: allowance(),
    mandatorySelected: [],
    deferredMandatory: [],
    baseSkillSelected: [],
    usageSelected: [],
    newWordsSelected: [],
    placementSelected: [],
    placementDeferred: 0,
    futureReservations: [],
    loadBreakdown: emptyLoadBreakdown(),
    ...overrides,
  };
}

function planned(
  itemId: string,
  skill: PlannedItem["skill"],
  modality: PlannedItem["modality"],
  dueAt = "",
): PlannedItem {
  return { itemId, wordId: itemId.split("#")[0], skill, modality, dueAt };
}

function completion(item: PlannedItem): SimulatedCompletion {
  return {
    item,
    assessment: {
      grade: "Good",
      modality: item.modality,
      correct: true,
      latencyMs: 2_000,
      interactionDurationMs: 4_000,
      usedHints: false,
      rescued: false,
      acceptedVariant: false,
      firstTryFailed: false,
      freeAudioReplays: 0,
    },
  };
}

describe("completePlannedSession", () => {
  it("respeta el presupuesto real del perfil y conserva assessments coherentes", () => {
    const queue = Array.from({ length: 20 }, (_, index) => (
      planned(`c1k:sim-${index}#meaning`, "meaning", "recognition")
    ));
    const completions = completePlannedSession(
      queue,
      PROFILES.intermittent,
      DEFAULT_SECONDS_BY_MODALITY,
      60,
      seededRandom(42),
    );
    const seconds = completions.reduce(
      (total, item) => total + item.assessment.interactionDurationMs / 1_000,
      0,
    );

    expect(completions.length).toBeGreaterThan(0);
    expect(completions.length).toBeLessThan(queue.length);
    expect(seconds).toBeLessThanOrEqual(60 * PROFILES.intermittent.completionBudgetRatio);
    expect(completions.every(({ assessment }) => assessment.interactionDurationMs >= assessment.latencyMs))
      .toBe(true);
  });
});

describe("applyCompletedSession", () => {
  it("producción registra un intento y dos efectos por ítem", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "fsrs", dueAt: NOW.toISOString(), stability: 1, difficulty: 5, state: "Review",
    };
    const item = planned(word.production.id, "production", "production");
    const plan = dailyPlan({
      baseSkillSelected: [{ ...item }],
      allowance: { ...allowance(), baseSkillActivations: 1, totalSkillActivations: 1 },
    });

    applyCompletedSession(
      world,
      plan,
      [completion(item)],
      simulationContext(NOW, 42, { value: 0 }),
      "session-1",
    );

    expect(world.attemptLogs).toHaveLength(1);
    expect(world.srsEvents.map((event) => event.learningItemId).sort()).toEqual([
      word.meaning.id,
      word.production.id,
    ].sort());
  });

  it("marca una palabra nueva como introducida", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.steady);
    const word = [...world.words.values()][0];
    const item = planned(word.meaning.id, "meaning", "recognition");
    const plan = dailyPlan({
      newWordsSelected: [{ wordId: word.wordId, rank: word.rank }],
      allowance: { ...allowance(), newWords: 1, newWordMeaningActivations: 1, totalSkillActivations: 1 },
    });

    const summary = applyCompletedSession(
      world,
      plan,
      [completion(item)],
      simulationContext(NOW, 42, { value: 0 }),
      "session-1",
    );

    expect(word.introducedAt).toBe(NOW.toISOString());
    expect(world.introducedWords).toBe(1);
    expect(summary.newWords).toBe(1);
  });

  it("activa usage con schedule, evento y activatedAt propios", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.advanced);
    const word = [...world.words.values()][0];
    const usage = word.usage[0].item;
    const item = planned(usage.id, "usage", "production");
    const plan = dailyPlan({
      usageSelected: [{ ...item }],
      allowance: { ...allowance(), usageActivations: 1 },
    });

    applyCompletedSession(
      world,
      plan,
      [completion(item)],
      simulationContext(NOW, 42, { value: 0 }),
      "session-1",
    );

    expect(usage.schedule.kind).toBe("none");
    expect(word.usage[0].item.schedule.kind).not.toBe("none");
    expect(word.usage[0].item.payload?.activatedAt).toBe(NOW.toISOString());
    expect(world.srsEvents[0].learningItemId).toBe(usage.id);
    expect(world.attemptLogs[0].observations.map((observation) => observation.skill))
      .toEqual(["usage"]);
  });

  it("conserva seleccionados no completados como deferred sin crear eventos", () => {
    const world = createInitialWorld({ ...options, corpusSize: 2 }, PROFILES.steady);
    const words = [...world.words.values()];
    const first = planned(words[0].meaning.id, "meaning", "recognition", NOW.toISOString());
    const second = planned(words[1].meaning.id, "meaning", "recognition", NOW.toISOString());
    const plan = dailyPlan({ mandatorySelected: [first, second] });

    applyCompletedSession(
      world,
      plan,
      [completion(first)],
      simulationContext(NOW, 42, { value: 0 }),
      "session-1",
    );

    expect(world.attemptLogs).toHaveLength(1);
    expect(world.deferred.has(first.itemId)).toBe(false);
    expect(world.deferred.get(second.itemId)?.lastOfferedSession).toBe(0);
  });

  it("aplica conversiones placement sin fabricar intentos", () => {
    const world = createInitialWorld({ ...options, corpusSize: 30 }, PROFILES.advanced);
    const inferred = [...world.words.values()]
      .map((word) => word.meaning)
      .find((item) => item.placementInference)!;
    const conversion = {
      ...inferred,
      schedule: {
        kind: "provisional" as const,
        dueAt: "2026-09-01T00:00:00.000Z",
        source: "placement-inference" as const,
        evidenceConfidence: inferred.placementInference!.confidence,
      },
    };

    expect(applyInferenceConversions(world, [conversion], NOW.toISOString())).toBe(1);
    expect(world.words.get(inferred.wordId)?.introducedAt).toBe(NOW.toISOString());
    expect(world.attemptLogs).toHaveLength(0);
    expect(world.srsEvents).toHaveLength(0);
  });
});
