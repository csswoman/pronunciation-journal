import { describe, expect, it } from "vitest";
import { estimateInitialListeningLevel, retireInitialListeningLevel } from "../initial-listening-level";
import type { AttemptLog, LearningItem } from "../verification/types";

const strong = { wordId: "c1k:know", word: "know", ease: 2.5, interval: 90, repetitions: 14, nextReview: "2026-12-01T00:00:00.000Z", stability: 120, difficulty: 4, state: "Review" as const };
const listening: LearningItem = { id: "c1k:know#listening", wordId: "c1k:know", skill: "listening", contentOrigin: "authored", schedule: { kind: "none" }, repetitions: 0, lapses: 0, suspended: false, initialListeningLevel: estimateInitialListeningLevel(strong) };
const attempt = (id: string): AttemptLog => ({ id, sessionId: "s", wordId: "c1k:know", assessment: { grade: "Good", modality: "listening", correct: true, latencyMs: 1, interactionDurationMs: 1, usedHints: false, rescued: false, acceptedVariant: false, firstTryFailed: false, freeAudioReplays: 0 }, observations: [{ skill: "listening", outcome: "success", source: "direct", basis: { kind: "attempt", modality: "listening" }, evidenceConfidence: 1, observedAt: "2026-08-09T00:00:00.000Z" }], eventType: "practice", occurredAt: "2026-08-09T00:00:00.000Z" });

describe("initial listening level", () => {
  it("deriva una entrada alta solo de historial legacy fuerte y mantiene una nueva en nivel 1", () => {
    expect(estimateInitialListeningLevel(strong)).toMatchObject({ level: 5, provisional: true });
    expect(estimateInitialListeningLevel(undefined)).toMatchObject({ level: 1, provisional: true });
  });

  it("elimina la marca después de dos intentos reales de listening y no vuelve a leer legacy", () => {
    expect(retireInitialListeningLevel(listening, [attempt("a")]).initialListeningLevel).toBeDefined();
    expect(retireInitialListeningLevel(listening, [attempt("a"), attempt("b")]).initialListeningLevel).toBeUndefined();
  });
});
