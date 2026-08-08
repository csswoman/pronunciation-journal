import { describe, expect, it } from "vitest";
import { DEFAULT_MATURITY_POLICY } from "../../skill-item";
import type { LearningItem, SrsReviewEvent } from "../../verification/types";
import {
  collectCandidates,
  collectMandatory,
} from "../candidates";
import { PROFILES } from "../profiles";
import {
  createInitialWorld,
  simulationContext,
  type SimulationOptions,
} from "../state";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const options: SimulationOptions = {
  days: 180,
  corpusSize: 100,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

function fsrs(
  dueAt: string,
  state: "New" | "Learning" | "Review" | "Relearning" = "Review",
): LearningItem["schedule"] {
  return { kind: "fsrs", dueAt, stability: 30, difficulty: 5, state };
}

function successEvent(itemId: string, index: number): SrsReviewEvent {
  const assessment = {
    grade: "Good" as const,
    modality: "production" as const,
    correct: true,
    latencyMs: 1_000,
    interactionDurationMs: 2_000,
    usedHints: false,
    rescued: false,
    acceptedVariant: false,
    firstTryFailed: false,
    freeAudioReplays: 0,
  };
  return {
    id: `event-${itemId}-${index}`,
    attemptLogId: `attempt-${itemId}-${index}`,
    learningItemId: itemId,
    grade: "Good",
    assessment,
    priorSchedule: { kind: "none" },
    resultingSchedule: fsrs(NOW.toISOString()),
    occurredAt: new Date(NOW.getTime() - index * 86_400_000).toISOString(),
    affectsSchedule: true,
    fsrsAudit: { schedulerVersion: "test", desiredRetention: 0.9 },
  };
}

describe("collectMandatory", () => {
  it("clasifica learning, overdue, dueToday y provisional sin duplicar", () => {
    const world = createInitialWorld({ ...options, corpusSize: 4 }, PROFILES.steady);
    const words = [...world.words.values()];
    words[0].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z", "Learning");
    words[1].meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    words[2].meaning.schedule = fsrs("2026-08-20T20:00:00.000Z");
    words[3].meaning.schedule = {
      kind: "provisional",
      dueAt: "2026-08-20T10:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
    };
    world.deferred.set(words[1].meaning.id, {
      item: {
        itemId: words[1].meaning.id,
        wordId: words[1].wordId,
        skill: "meaning",
        modality: "recognition",
        dueAt: "2026-08-19T10:00:00.000Z",
      },
      firstDeferredSession: 2,
    });

    const mandatory = collectMandatory(world, NOW);

    expect(mandatory.learning.map((item) => item.itemId)).toEqual([words[0].meaning.id]);
    expect(mandatory.overdue.map((item) => item.itemId)).toEqual([words[1].meaning.id]);
    expect(mandatory.dueToday.map((item) => item.itemId)).toEqual([words[2].meaning.id]);
    expect(mandatory.provisionalDue.map((item) => item.itemId)).toEqual([words[3].meaning.id]);
    expect(world.deferred.get(words[1].meaning.id)?.firstDeferredSession).toBe(2);
  });

  it("excluye suspendidos y usage retirado", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.meaning.schedule = fsrs("2026-08-19T10:00:00.000Z");
    word.meaning.suspended = true;
    word.usage[0].item.schedule = fsrs("2026-08-19T10:00:00.000Z");
    word.usage[0].item.payload!.retiredAt = "2026-08-18T00:00:00.000Z";

    expect(collectMandatory(world, NOW)).toEqual({
      learning: [], overdue: [], dueToday: [], provisionalDue: [],
    });
  });
});

describe("collectCandidates", () => {
  it("secuencia listening antes de production y exige meaning introducido", () => {
    const world = createInitialWorld({ ...options, corpusSize: 2 }, PROFILES.steady);
    const [first, second] = [...world.words.values()];
    first.introducedAt = options.startAt;
    first.meaning.schedule = fsrs("2026-09-01T00:00:00.000Z");
    second.meaning.schedule = fsrs("2026-09-01T00:00:00.000Z");

    const firstPass = collectCandidates(
      world,
      PROFILES.steady,
      simulationContext(NOW, 42, { value: 0 }),
    );
    expect(firstPass.baseSkillActivations).toEqual([{
      itemId: first.listening.id,
      wordId: first.wordId,
      skill: "listening",
      modality: "listening",
    }]);

    first.listening.schedule = fsrs("2026-09-01T00:00:00.000Z");
    expect(collectCandidates(
      world,
      PROFILES.steady,
      simulationContext(NOW, 42, { value: 0 }),
    ).baseSkillActivations[0].skill).toBe("production");
  });

  it("limita conversiones placement y una confianza menor reduce el techo", () => {
    const high = createInitialWorld(options, PROFILES.advanced);
    const degraded = createInitialWorld(options, PROFILES.advanced);
    for (const word of degraded.words.values()) {
      if (word.meaning.placementInference) word.meaning.placementInference.confidence = 0.2;
    }
    const context = simulationContext(NOW, 42, { value: 0 });
    const highCandidates = collectCandidates(high, PROFILES.advanced, context);
    const lowCandidates = collectCandidates(degraded, PROFILES.advanced, context);

    expect(highCandidates.placementCandidates.length).toBeGreaterThan(0);
    expect(highCandidates.conversionLimit).toBeLessThanOrEqual(8);
    expect(lowCandidates.conversionLimit).toBeLessThan(highCandidates.conversionLimit);
    expect(highCandidates.placementCandidates.every((item) => (
      item.schedule.kind === "none"
      && item.placementInference !== undefined
    ))).toBe(true);
  });

  it("habilita usage con las políticas reales y respeta readyAt", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.advanced);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = fsrs("2026-09-01T00:00:00.000Z");
    word.production.schedule = fsrs("2026-09-01T00:00:00.000Z");
    const required = DEFAULT_MATURITY_POLICY.minSuccessfulReviews;
    world.srsEvents.push(
      ...Array.from({ length: required }, (_, index) => successEvent(word.meaning.id, index)),
      ...Array.from({ length: required }, (_, index) => successEvent(word.production.id, index)),
    );

    const candidates = collectCandidates(
      world,
      PROFILES.advanced,
      simulationContext(NOW, 42, { value: 0 }),
    );

    expect(new Set(candidates.usageActivations.map((item) => item.itemId)))
      .toEqual(new Set(word.usage.map(({ item }) => item.id)));
  });

  it("ordena palabras nuevas por rank y excluye placement", () => {
    const world = createInitialWorld({ ...options, corpusSize: 30 }, PROFILES.advanced);
    const candidates = collectCandidates(
      world,
      PROFILES.advanced,
      simulationContext(NOW, 42, { value: 0 }),
    );

    expect(candidates.newWords.map((word) => word.rank))
      .toEqual([...candidates.newWords.map((word) => word.rank)].sort((a, b) => a - b));
    expect(candidates.newWords.every(({ wordId }) => (
      !world.words.get(wordId)?.meaning.placementInference
    ))).toBe(true);
  });
});
