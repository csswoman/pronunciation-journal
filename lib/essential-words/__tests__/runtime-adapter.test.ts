import { describe, expect, it } from "vitest";
import {
  buildRuntimePlanningInput,
  createBaseLearningItems,
  planRuntimeSession,
  toEssentialWordsSkillQueue,
  toKnownClaimQueueItem,
  toRuntimeQueue,
} from "../runtime-adapter";
import type { EssentialWord } from "../types";
import type { ActivationCandidate, DailyPlan } from "../planning-types";
import type { AttemptLog, LearningItem } from "../verification/types";

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

const activation = (skill: "meaning" | "listening" | "production" | "usage"): ActivationCandidate => ({
  itemId: `c1k:hello#${skill}`,
  wordId: "c1k:hello",
  skill,
  modality: skill === "listening" ? "listening" : skill === "meaning" ? "recognition" : "production",
});

function withSelectedActivations(selected: ActivationCandidate[]): DailyPlan {
  const plan = planRuntimeSession({ words: [word], items: [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)], attempts: [], now: NOW });
  return { ...plan, mandatorySelected: [], baseSkillSelected: selected, usageSelected: [], newWordsSelected: [] };
}

describe("runtime adapter", () => {
  it("uses the surface limit without subtracting introductions from earlier today", () => {
    const words = Array.from({ length: 10 }, (_, index) => ({ ...word, word: `word-${index + 1}`, rank: index + 1 }));
    const priorAttempt: AttemptLog = {
      id: "attempt-1",
      wordId: "c1k:earlier-word",
      sessionId: "session-1",
      occurredAt: "2026-08-08T09:00:00.000Z",
      eventType: "learning-step" as const,
      assessment: {
        grade: "Good", modality: "recognition", correct: true, latencyMs: 1000,
        interactionDurationMs: 1000, usedHints: false, rescued: false,
        acceptedVariant: true, firstTryFailed: false, freeAudioReplays: 0,
      },
      observations: [],
    };

    const input = buildRuntimePlanningInput({
      words, items: [], attempts: [priorAttempt], now: NOW, maxNewWords: 5,
    });

    expect(input.configuredNewWordLimit).toBe(5);
    expect(input.consumed.newWords).toBe(0);
    expect(planRuntimeSession({
      words, items: [], attempts: [priorAttempt], now: NOW, maxNewWords: 5,
    }).newWordsSelected).toHaveLength(5);
    expect(planRuntimeSession({
      words, items: [], attempts: [priorAttempt], now: NOW, maxNewWords: 1,
    }).newWordsSelected).toHaveLength(1);
  });

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

  it("conserva la habilidad elegida por el plan", () => {
    const words = Array.from({ length: 3 }, (_, index) => ({ ...word, word: `word-${index + 1}`, rank: index + 1 }));
    const plan = planRuntimeSession({ words, items: [], attempts: [], now: NOW });
    const queue = toEssentialWordsSkillQueue(plan, words, []);

    expect(queue).toHaveLength(3);
    expect(queue.every((item) => item.plannedItem.skill === "meaning")).toBe(true);
  });

  it("mantiene una activación por palabra y deja las demás sin servir", () => {
    const plan = withSelectedActivations([activation("listening"), activation("production")]);
    const queue = toEssentialWordsSkillQueue(plan, [word], [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)]);

    expect(queue).toHaveLength(1);
    expect(queue[0]?.plannedItem.skill).toBe("listening");
    expect(plan.baseSkillSelected.map((item) => item.skill)).toEqual(["listening", "production"]);
  });

  it("materializa listening como dictation_sentence, nunca como habla por caída silenciosa", () => {
    const queue = toEssentialWordsSkillQueue(
      withSelectedActivations([activation("listening")]), [word], [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)],
    );
    expect(queue[0]).toMatchObject({ plannedItem: { skill: "listening" }, forcedMode: "dictation_sentence" });
  });

  it("aplica fallback explícito para meaning sin traducción y usage sin cloze", () => {
    const diagnostics: unknown[] = [];
    const noTranslation = { ...word, translation: undefined };
    const meaning = toEssentialWordsSkillQueue(
      withSelectedActivations([activation("meaning")]), [noTranslation], [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)],
      (diagnostic) => diagnostics.push(diagnostic),
    );
    expect(meaning[0]?.forcedMode).toBe("recognize_meaning");

    const noCloze = { ...word, example_sentence: "Nothing useful here." };
    const usage = toEssentialWordsSkillQueue(
      withSelectedActivations([activation("usage")]), [noCloze], [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)],
      (diagnostic) => diagnostics.push(diagnostic),
    );
    expect(usage[0]?.forcedMode).toBe("speak_sentence");
    expect(diagnostics).toHaveLength(2);
  });

  it("excluye una activación sin modo renderizable y la diagnostica", () => {
    const diagnostics: unknown[] = [];
    const incomplete = { ...word, translation: undefined, example_sentence: "" };
    const queue = toEssentialWordsSkillQueue(
      withSelectedActivations([activation("production")]), [incomplete], [dueMeaning, ...createBaseLearningItems("c1k:hello").slice(1)],
      (diagnostic) => diagnostics.push(diagnostic),
    );
    expect(queue).toEqual([]);
    expect(diagnostics).toEqual([expect.objectContaining({ kind: "unrenderable", skill: "production" })]);
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
