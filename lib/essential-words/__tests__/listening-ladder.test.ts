import { describe, expect, it } from "vitest";
import { deriveListeningLadderLevel, resolveListeningLadderMode } from "../listening-ladder";
import type { AttemptLog, LearningItem } from "../verification/types";

const item: LearningItem = { id: "x", wordId: "x", skill: "listening", contentOrigin: "authored", schedule: { kind: "none" }, repetitions: 0, lapses: 0, suspended: false };
const attempt = (outcome: "success" | "failure", index: number): AttemptLog => ({ id: String(index), sessionId: "s", wordId: `word-${index}`, assessment: { grade: outcome === "success" ? "Good" : "Again", modality: "listening", correct: outcome === "success", latencyMs: 1, interactionDurationMs: 1, usedHints: false, rescued: false, acceptedVariant: false, firstTryFailed: false, freeAudioReplays: 0 }, observations: [{ skill: "listening", outcome, source: "direct", basis: { kind: "attempt", modality: "listening" }, evidenceConfidence: 1, observedAt: new Date(index).toISOString() }], eventType: "practice", occurredAt: new Date(index).toISOString() });

describe("global listening ladder", () => {
  it("starts at tier 1 and promotes globally after three clean outcomes", () => {
    expect(deriveListeningLadderLevel(item, [attempt("success", 1), attempt("success", 2), attempt("success", 3)], new Date()).level).toBe(2);
  });
  it("uses cloze for tiers 1–2 and dictation only at tier 3", () => {
    const word = { word: "hear", rank: 1, cefr_level: "A1" as const, pos: "verb" as const, ipa_strong: "/hɪr/", example_sentence: "We can hear the train from our house today." };
    expect(resolveListeningLadderMode(word, 2)?.mode).toBe("listening_cloze_sentence");
    expect(resolveListeningLadderMode(word, 3)?.mode).toBe("dictation_sentence");
  });
});
