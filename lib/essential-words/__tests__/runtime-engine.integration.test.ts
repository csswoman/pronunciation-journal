// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { savePracticeAnswer } from "@/lib/practice/queries";
import type { SRSData } from "@/lib/types";
import type { EssentialWord } from "../types";

const USER = "00000000-0000-4000-8000-000000000099";
const NOW = new Date("2026-08-08T10:00:00.000Z");
const words: EssentialWord[] = [{
  word: "hello",
  rank: 1,
  cefr_level: "A1",
  pos: "interjection",
  meaning: "a greeting",
  translation: "hola",
  ipa_strong: "/həˈloʊ/",
  example_sentence: "Hello, my friend.",
  sentence_ipa: "/həˈloʊ maɪ frɛnd/",
}];

vi.mock("../client", () => ({ fetchEssentialWords: vi.fn(async () => words) }));
vi.mock("@/lib/practice/queries", () => ({ savePracticeAnswer: vi.fn(async () => undefined) }));

const legacy: SRSData = {
  userId: USER,
  wordId: "c1k:hello",
  word: "hello",
  ease: 2.5,
  interval: 2,
  repetitions: 2,
  nextReview: "2026-08-08T09:00:00.000Z",
  stability: 2,
  difficulty: 5,
  state: "Review",
};

beforeEach(async () => {
  vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "on");
  vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT", "100");
  db.close();
  await db.delete();
  await db.open();
  await db.srsData.put(legacy);
});

afterEach(() => {
  vi.unstubAllEnvs();
  db.close();
});

describe("runtime skill happy path", () => {
  it("migra, planifica, persiste un intento y reconstruye la siguiente sesión", async () => {
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const first = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    expect(runtime.mode).toBe("on");
    expect(first.source).toBe("skill");
    expect(first.items.length).toBeGreaterThan(0);
    const item = first.items[0];
    expect(item).toHaveProperty("plannedItem");

    await runtime.recordAttempt({
      item,
      quality: 4,
      sessionId: "real-session-1",
      outcome: {
        correct: true,
        hintsUsed: 0,
        rescued: false,
        typo: false,
        firstTryFailed: false,
        latencyMs: 2_000,
      },
    });

    expect(await db.srsData.get("c1k:hello")).toEqual(legacy);
    expect(await db.learningItems.where("userId").equals(USER).count()).toBe(3);
    expect(await db.attemptLogs.where("userId").equals(USER).count()).toBe(1);
    expect(await db.srsReviewEvents.where("userId").equals(USER).count()).toBeGreaterThan(0);
    const skillOutbox = await db.syncOutbox.where("userId").equals(USER).toArray();
    expect(skillOutbox.map((entry) => entry.table)).toEqual(expect.arrayContaining([
      "learning_items", "attempt_logs", "srs_review_events",
    ]));
    expect(savePracticeAnswer).toHaveBeenCalledOnce();

    const reloaded = await createEssentialWordsRuntime(USER);
    const second = await reloaded.buildSession({
      levels: null,
      pos: null,
      now: new Date("2026-08-09T10:00:00.000Z"),
    });
    expect(second.source).toBe("skill");
    expect(await db.learningItems.where("userId").equals(USER).count()).toBe(3);
    expect(second.items.length).toBeGreaterThan(0);
  });

  it("rollback a off conserva skill y vuelve a escribir únicamente legacy", async () => {
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const on = await createEssentialWordsRuntime(USER);
    const session = await on.buildSession({ levels: null, pos: null, now: NOW });
    await on.recordAttempt({
      item: session.items[0], quality: 4, sessionId: "on-session",
      outcome: {
        correct: true, hintsUsed: 0, rescued: false, typo: false,
        firstTryFailed: false, latencyMs: 2_000,
      },
    });
    const skillCount = await db.learningItems.count();

    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const off = await createEssentialWordsRuntime(USER);
    const legacySession = await off.buildSession({ levels: null, pos: null, now: NOW });
    expect(legacySession.source).toBe("legacy");
    await off.recordAttempt({
      item: legacySession.items[0], quality: 4, sessionId: "off-session",
      outcome: {
        correct: true, hintsUsed: 0, rescued: false, typo: false,
        firstTryFailed: false, latencyMs: 2_000,
      },
    });
    expect(await db.learningItems.count()).toBe(skillCount);
    expect((await db.srsData.get("c1k:hello"))?.lastReview).toBeDefined();
  });
});
