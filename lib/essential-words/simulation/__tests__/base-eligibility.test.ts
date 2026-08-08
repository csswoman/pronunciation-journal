import { describe, expect, it } from "vitest";
import type { LearningItem } from "../../verification/types";
import {
  isEligibleForBaseActivation,
} from "../base-eligibility";
import { collectCandidates } from "../candidates";
import { PROFILES } from "../profiles";
import {
  createInitialWorld,
  simulationContext,
  type SimulationOptions,
} from "../state";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const options: SimulationOptions = {
  days: 30,
  corpusSize: 12,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

function fsrs(): LearningItem["schedule"] {
  return {
    kind: "fsrs",
    dueAt: "2026-09-01T00:00:00.000Z",
    stability: 30,
    difficulty: 5,
    state: "Review",
  };
}

describe("elegibilidad pedagógica canónica de activación base", () => {
  it("placement provisional transiciona de ineligible a eligible al llegar dueAt", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.advanced);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "provisional",
      dueAt: NOW.toISOString(),
      source: "placement-inference",
      evidenceConfidence: 0.9,
    };

    const beforeUnlock = new Date(NOW.getTime() - 1);
    expect(isEligibleForBaseActivation(word, "listening", beforeUnlock)).toBe(false);
    expect(collectCandidates(
      world,
      PROFILES.advanced,
      simulationContext(beforeUnlock, 42, { value: 0 }),
    ).baseSkillActivations).toEqual([]);

    expect(isEligibleForBaseActivation(word, "listening", NOW)).toBe(true);
    expect(collectCandidates(
      world,
      PROFILES.advanced,
      simulationContext(NOW, 42, { value: 0 }),
    ).baseSkillActivations.map((item) => item.itemId)).toEqual([word.listening.id]);
  });

  it("new-word y placement desbloqueado usan el mismo predicado", () => {
    const world = createInitialWorld({ ...options, corpusSize: 2 }, PROFILES.advanced);
    const [newWord, placementWord] = [...world.words.values()];
    for (const word of [newWord, placementWord]) {
      word.introducedAt = options.startAt;
      word.meaning.schedule = fsrs();
    }
    placementWord.meaning.placementInference = {
      bandId: "band-1",
      confidence: 0.9,
      inferredAt: options.startAt,
      policyVersion: "band-v1",
    };

    expect(isEligibleForBaseActivation(newWord, "listening", NOW)).toBe(true);
    expect(isEligibleForBaseActivation(placementWord, "listening", NOW)).toBe(true);
  });

  it("budget, backlog y trabajo de menor prioridad no forman parte del gate", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = fsrs();
    for (const other of [...world.words.values()].slice(1)) {
      other.introducedAt = options.startAt;
      other.meaning.schedule = fsrs();
    }

    expect(isEligibleForBaseActivation(word, "listening", NOW)).toBe(true);
    expect(collectCandidates(
      world,
      PROFILES.steady,
      simulationContext(NOW, 42, { value: 0 }),
    ).baseSkillActivations.map((item) => item.itemId)).toContain(word.listening.id);
  });

  it("production conserva la secuencia pedagógica después de listening", () => {
    const world = createInitialWorld({ ...options, corpusSize: 1 }, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = fsrs();

    expect(isEligibleForBaseActivation(word, "production", NOW)).toBe(false);
    word.listening.schedule = fsrs();
    expect(isEligibleForBaseActivation(word, "production", NOW)).toBe(true);
  });
});
