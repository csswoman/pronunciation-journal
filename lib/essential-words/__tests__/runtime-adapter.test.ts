import { describe, expect, it } from "vitest";
import {
  buildRuntimePlanningInput,
  createBaseLearningItems,
  planRuntimeSession,
  toKnownClaimQueueItem,
  toRuntimeQueue,
} from "../runtime-adapter";
import type { EssentialWord } from "../types";
import type { LearningItem } from "../verification/types";

const NOW = new Date("2026-08-08T10:00:00.000Z");
const word: EssentialWord = {
  word: "hello",
  rank: 1,
  cefr_level: "A1",
  pos: "interjection",
  meaning: "a greeting",
  translation: "hola",
  ipa_strong: "/həˈloʊ/",
  example_sentence: "Hello, my friend.",
  sentence_ipa: "/həˈloʊ maɪ frɛnd/",
};

const dueMeaning: LearningItem = {
  ...createBaseLearningItems("c1k:hello")[0],
  schedule: {
    kind: "fsrs",
    dueAt: "2026-08-08T09:00:00.000Z",
    stability: 2,
    difficulty: 5,
    state: "Review",
  },
  repetitions: 2,
};

describe("runtime adapter", () => {
  it("traduce estado real al input existente sin mutar la evidencia", () => {
    const items = [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)];
    const snapshot = { words: [word], items, attempts: [], now: NOW };
    const before = structuredClone(snapshot);
    const input = buildRuntimePlanningInput(snapshot);

    expect(input.mandatory.dueToday).toHaveLength(1);
    expect(input.candidates.baseSkillActivations.map((item) => item.skill))
      .toEqual(["listening", "production"]);
    expect(input.candidates.newWords).toEqual([]);
    expect(snapshot).toEqual(before);
  });

  it("materializa tres habilidades base sin fabricar evidencia FSRS", () => {
    const items = createBaseLearningItems("c1k:new");
    expect(items.map((item) => item.skill)).toEqual(["meaning", "listening", "production"]);
    expect(items.every((item) => item.schedule.kind === "none")).toBe(true);
    expect(items.every((item) => item.repetitions === 0)).toBe(true);
  });

  it("convierte únicamente la cola materializada por el planner en ejercicios", () => {
    const items = [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)];
    const plan = planRuntimeSession({ words: [word], items, attempts: [], now: NOW });
    const queue = toRuntimeQueue(plan, [word], items);

    expect(queue.length).toBeGreaterThan(0);
    expect(queue.map((item) => item.plannedItem.itemId)).toEqual(
      expect.arrayContaining(plan.mandatorySelected.map((item) => item.itemId)),
    );
    expect(queue.every((item) => item.entry.word === "hello")).toBe(true);
  });

  it("Ya la sé reutiliza planKnownClaim y crea una verificación de producción", () => {
    const items = createBaseLearningItems("c1k:hello");
    const plan = planRuntimeSession({ words: [word], items: [], attempts: [], now: NOW });
    const item = toRuntimeQueue(plan, [word], items)[0];
    const verification = toKnownClaimQueueItem(item);

    expect(verification).toMatchObject({
      eventType: "verification",
      forcedMode: "recall_translation",
      plannedItem: { skill: "production", modality: "production" },
    });
  });
});
