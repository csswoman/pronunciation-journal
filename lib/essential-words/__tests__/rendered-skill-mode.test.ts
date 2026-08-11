import { describe, expect, it } from "vitest";
import { resolveRenderedSkillMode } from "../rendered-skill-mode";
import { attributionForRenderedAttempt } from "../runtime-attribution";
import type { SkillRuntimeQueueItem } from "../runtime-adapter";
import type { EssentialWord } from "../types";

const word: EssentialWord = {
  word: "hear", rank: 1, cefr_level: "A1", pos: "verb", meaning: "listen", translation: "oír",
  ipa_strong: "/hɪr/", example_sentence: "We can hear the train from our house today.",
};

const item = (skill: SkillRuntimeQueueItem["plannedItem"]["skill"], forcedMode: SkillRuntimeQueueItem["forcedMode"], level?: 1 | 2 | 3): SkillRuntimeQueueItem => ({
  entry: word, kind: "review", repetitions: 1,
  plannedItem: { itemId: `c1k:hear#${skill}`, wordId: "c1k:hear", skill, modality: skill === "listening" ? "listening" : "production", dueAt: "" },
  currentItems: [], eventType: "learning-step", forcedMode,
  ...(level ? { listeningLadder: { level, source: "evidence", reason: "consecutive-successes" } } : {}),
});

describe("resolveRenderedSkillMode", () => {
  it("solo sustituye listening por la variante de escalera", () => {
    expect(resolveRenderedSkillMode(word, "cloze_sentence", item("listening", "dictation_sentence", 3))).toBe("dictation_sentence");
    expect(resolveRenderedSkillMode(word, "cloze_sentence", item("meaning", "recognize_translation"))).toBe("recognize_translation");
    expect(resolveRenderedSkillMode(word, "cloze_sentence", item("production", "speak_sentence"))).toBe("speak_sentence");
    expect(resolveRenderedSkillMode(word, "cloze_sentence", item("usage", "cloze_sentence"))).toBe("cloze_sentence");
  });

  it("resuelve práctica guiada en 2 y dictado en 3", () => {
    expect(resolveRenderedSkillMode(word, "cloze_sentence", item("listening", "dictation_sentence", 2))).toBe("listening_cloze_sentence");
    expect(resolveRenderedSkillMode(word, "recognize_audio", item("listening", "dictation_sentence", 3))).toBe("dictation_sentence");
  });

  it("mantiene el modo legacy sin un ítem skill", () => {
    const plannerModes = ["recognize_translation", "cloze_sentence", "speak_sentence"] as const;
    expect(plannerModes.map((mode) => resolveRenderedSkillMode(word, mode))).toEqual(plannerModes);
  });

  it("respeta la escalera dentro de un bloque de tres tarjetas", () => {
    const cards = [
      { plannerMode: "cloze_sentence" as const, planned: item("listening", "dictation_sentence", 3) },
      { plannerMode: "cloze_sentence" as const, planned: item("meaning", "recognize_translation") },
      { plannerMode: "recognize_audio" as const, planned: item("production", "speak_sentence") },
    ];
    expect(cards.map(({ plannerMode, planned }) => resolveRenderedSkillMode(word, plannerMode, planned)))
      .toEqual(["dictation_sentence", "recognize_translation", "speak_sentence"]);
  });

  it("la variante renderizada alimenta la atribución posterior, no el modo base", () => {
    const rendered = resolveRenderedSkillMode(word, "cloze_sentence", item("listening", "dictation_sentence", 2));
    expect(rendered).toBe("listening_cloze_sentence");
    expect(attributionForRenderedAttempt(rendered, {
      correct: true, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false, latencyMs: 1,
    }).assessment.modality).toBe("listening");
  });
});
