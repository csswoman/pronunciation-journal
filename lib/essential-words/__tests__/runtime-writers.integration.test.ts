// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { saveCachedDailyPlan } from "@/lib/daily/plan-storage";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { DailyStep, ExerciseResult } from "@/lib/practice/types";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import type { EssentialWord } from "../types";
import type { RuntimeAttemptInput } from "../runtime-engine";
import { buildEssentialWordExerciseResult } from "../session-model";

/**
 * Same chain as useEssentialWordsSession: submitGrade builds the result,
 * runtime.recordAttempt writes it, finishSession records the activity.
 * Word data is fixture-backed; every writer is the production one.
 */
const USER = "00000000-0000-4000-8000-000000000128";
const NOW = new Date("2026-08-08T10:00:00.000Z");
const words: EssentialWord[] = [{
  word: "hello", rank: 1, cefr_level: "A1", pos: "interjection", meaning: "a greeting",
  translation: "hola", ipa_strong: "/həˈloʊ/", example_sentence: "Hello, my friend.",
  sentence_ipa: "/həˈloʊ maɪ frɛnd/",
}];

vi.mock("../client", () => ({ fetchEssentialWords: vi.fn(async () => words) }));
vi.mock("@/lib/phoneme-practice/queries", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/phoneme-practice/queries")>(),
  getAllContrastProgress: vi.fn(async () => []),
  getRetiredEssentialWordBlankKeys: vi.fn(async () => new Set()),
}));
vi.mock("@/lib/sync/sync-manager", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/sync/sync-manager")>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0 }),
}));

function wordStep(id: string, contentId: string): DailyStep {
  return {
    id, kind: "word_review", title: id, subtitle: "EW fixture", icon: "Book", estMinutes: 2,
    exercises: [{ id: `${id}:ex`, slug: "fill_blank", exerciseTypeId: 5, contentId } as DailyStep["exercises"][number]],
  };
}

const outcome = (correct: boolean, production: "acierto" | "fallo" | null): RuntimeAttemptInput["outcome"] => ({
  correct, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false, latencyMs: 1_800,
  resultado: correct ? "correcto" : "incorrecto",
  evidencia: [
    { habilidad: "listening", veredicto: correct ? "acierto" : "fallo" },
    ...(production ? [{ habilidad: "production" as const, veredicto: production }] : []),
  ],
});

async function outbox(table: string) {
  return (await db.syncOutbox.where("userId").equals(USER).toArray()).filter((entry) => entry.table === table);
}

beforeEach(async () => {
  vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "on");
  vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT", "100");
  window.localStorage.clear();
  db.close();
  await db.delete();
  await db.open();
});

afterEach(() => {
  vi.unstubAllEnvs();
  db.close();
});

describe("Essential Words engine with real answer and activity writers", () => {
  it("writes one answer per attempt id and reconciles only the assigned word", async () => {
    saveCachedDailyPlan(USER, {
      steps: [wordStep("word_review", "c1k:hello"), wordStep("word_review:other", "c1k:world")],
      totalExercises: 2, isNewUser: false,
    });
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    const result: ExerciseResult = {
      ...buildEssentialWordExerciseResult({ entry: words[0], kind: "review" }, 4, undefined, "dictation_sentence", 1_800),
      attemptId: "ew-attempt-1",
    };
    const input: RuntimeAttemptInput = {
      item: session.items[0], attemptId: "ew-attempt-1", answer: result, quality: 4,
      sessionId: "ew-session-1", renderedMode: "dictation_sentence", outcome: outcome(true, "acierto"),
    };

    await runtime.recordAttempt(input);
    await runtime.recordAttempt(input);
    await recordActivitySession(USER, { practiceContext: "essential-words", sessionResult: buildSessionResult([result]) });

    expect((await outbox("answer_history")).map((entry) => entry.payload)).toEqual([
      expect.objectContaining({ id: "ew-attempt-1", user_id: USER, context: "essential-words", content_id: "c1k:hello", is_correct: true }),
    ]);
    expect((await outbox("activity_sessions"))[0]?.payload).toMatchObject({
      source: "essential_words", exercises_total: 1, reconciled_step_ids: ["word_review"],
    });
  });

  it("an empty dictation is recorded as a failed answer without production credit", async () => {
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    const result = {
      ...buildEssentialWordExerciseResult({ entry: words[0], kind: "review" }, 1, undefined, "dictation_sentence", 900),
      attemptId: "ew-empty-1",
    };

    await runtime.recordAttempt({
      item: session.items[0], attemptId: "ew-empty-1", answer: result, quality: 1,
      sessionId: "ew-session-2", renderedMode: "dictation_sentence", outcome: outcome(false, null),
    });

    expect((await outbox("answer_history"))[0]?.payload).toMatchObject({ id: "ew-empty-1", is_correct: false });
    const [attempt] = await db.attemptLogs.where("userId").equals(USER).toArray();
    expect(attempt?.observations.map((observation) => observation.skill)).toEqual(["listening"]);
  });
});
