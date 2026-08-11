// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { savePracticeAnswer } from "@/lib/practice/queries";
import type { SRSData } from "@/lib/types";
import type { EssentialWord } from "../types";
import type { RuntimeAttemptInput } from "../runtime-engine";
import { planSkillModelMigration } from "../migrate-to-skill-model";

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
  const dictationOutcome = (overrides: Partial<RuntimeAttemptInput["outcome"]> = {}) => ({
    correct: false,
    hintsUsed: 0,
    rescued: false,
    typo: false,
    firstTryFailed: false,
    latencyMs: 2_000,
    resultado: "incorrecto" as const,
    evidencia: [
      { habilidad: "listening" as const, veredicto: "acierto" as const },
      { habilidad: "production" as const, veredicto: "fallo" as const },
    ],
    ...overrides,
  });

  it("migra, planifica, persiste un intento y reconstruye la siguiente sesión", async () => {
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const first = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    expect(runtime.mode).toBe("on");
    expect(first.source).toBe("skill");
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.stats.dueCount).toBe(first.items.filter((planned) =>
      "eventType" in planned && planned.eventType !== "learning-step",
    ).length);
    const item = first.items[0];
    expect(item).toHaveProperty("plannedItem");

    await runtime.recordAttempt({
      item,
      quality: 4,
      sessionId: "real-session-1",
      renderedMode: "dictation_sentence",
      outcome: {
        correct: true,
        hintsUsed: 0,
        rescued: false,
        typo: false,
        firstTryFailed: false,
        latencyMs: 2_000,
        resultado: "casi",
        evidencia: [
          { habilidad: "listening", veredicto: "acierto" },
          { habilidad: "production", veredicto: "fallo" },
        ],
      },
    });

    expect(await db.srsData.get("c1k:hello")).toEqual(legacy);
    expect(await db.learningItems.where("userId").equals(USER).count()).toBe(3);
    expect(await db.attemptLogs.where("userId").equals(USER).count()).toBe(1);
    expect(await db.srsReviewEvents.where("userId").equals(USER).count()).toBeGreaterThan(0);
    const [attempt] = await db.attemptLogs.where("userId").equals(USER).toArray();
    expect(attempt).toEqual(expect.objectContaining({
      renderedMode: "dictation_sentence",
      assessment: expect.objectContaining({ modality: "listening" }),
      observations: expect.arrayContaining([
        expect.objectContaining({ skill: "listening", outcome: "success" }),
        expect.objectContaining({ skill: "production", outcome: "failure" }),
      ]),
    }));
    const dictationEvents = await db.srsReviewEvents.where("userId").equals(USER).toArray();
    expect(new Set(dictationEvents.map((event) => event.learningItemId))).toEqual(new Set([
      "c1k:hello#listening",
      "c1k:hello#production",
    ]));
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
    expect(await db.attemptLogs.where("userId").equals(USER).count()).toBe(2);
  });

  it("off conserva exactamente el SRS legacy y añade evidencia skill", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });

    await runtime.recordAttempt({
      item: session.items[0], quality: 4, sessionId: "off-evidence",
      renderedMode: "dictation_sentence",
      outcome: dictationOutcome(),
    });

    expect((await db.srsData.get("c1k:hello"))?.repetitions).toBe(legacy.repetitions + 1);
    expect(await db.learningItems.where("userId").equals(USER).count()).toBe(3);
    const [attempt] = await db.attemptLogs.where("userId").equals(USER).toArray();
    expect(attempt).toMatchObject({
      renderedMode: "dictation_sentence",
      observations: [
        expect.objectContaining({ skill: "listening", outcome: "success" }),
        expect.objectContaining({ skill: "production", outcome: "failure" }),
      ],
    });
  });

  it("siembra en off la misma entrada provisional que la migración", async () => {
    const strongLegacy = { ...legacy, repetitions: 14, stability: 120, state: "Review" as const };
    await db.srsData.put(strongLegacy);
    const migratedListening = planSkillModelMigration([strongLegacy], [], NOW)
      .find((item) => item.skill === "listening");

    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    await runtime.recordAttempt({
      item: session.items[0], quality: 2, sessionId: "off-initial-level",
      renderedMode: "dictation_sentence", persistLegacySrs: false,
      outcome: dictationOutcome(),
    });

    const seededListening = await db.learningItems.get("c1k:hello#listening");
    expect(seededListening?.initialListeningLevel).toEqual(migratedListening?.initialListeningLevel);
    const listeningOutbox = (await db.syncOutbox.where("userId").equals(USER).toArray())
      .find((entry) => entry.table === "learning_items" && entry.payload.id === "c1k:hello#listening");
    expect(listeningOutbox?.payload.initial_listening_level).toEqual(migratedListening?.initialListeningLevel);
  });

  it("retira la entrada tras dos intentos reales y no la vuelve a derivar del SRS", async () => {
    const strongLegacy = { ...legacy, repetitions: 14, stability: 120, state: "Review" as const };
    await db.srsData.put(strongLegacy);
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    const input = (sessionId: string): RuntimeAttemptInput => ({
      item: session.items[0], quality: 2, sessionId, renderedMode: "dictation_sentence",
      persistLegacySrs: false, outcome: dictationOutcome(),
    });

    await runtime.recordAttempt(input("seeded-listening-1"));
    expect((await db.learningItems.get("c1k:hello#listening"))?.initialListeningLevel)
      .toMatchObject({ level: 5, provisional: true });

    await db.srsData.put({ ...legacy, repetitions: 0, stability: 0, state: "New" });
    await runtime.recordAttempt(input("seeded-listening-2"));
    expect((await db.learningItems.get("c1k:hello#listening"))?.initialListeningLevel).toBeUndefined();

    await db.srsData.put(strongLegacy);
    await runtime.recordAttempt(input("seeded-listening-3"));
    expect((await db.learningItems.get("c1k:hello#listening"))?.initialListeningLevel).toBeUndefined();
  });

  it("un fallo de escritura skill no revierte ni bloquea srsData", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    const failure = () => { throw new Error("skill write failed"); };
    db.learningItems.hook("creating").subscribe(failure);

    try {
      await expect(runtime.recordAttempt({
        item: session.items[0], quality: 4, sessionId: "off-best-effort",
        renderedMode: "dictation_sentence",
        outcome: dictationOutcome(),
      })).resolves.toBeUndefined();
    } finally {
      db.learningItems.hook("creating").unsubscribe(failure);
    }

    expect((await db.srsData.get("c1k:hello"))?.repetitions).toBe(legacy.repetitions + 1);
    expect(await db.attemptLogs.where("userId").equals(USER).count()).toBe(0);
  });

  it("off y on conservan la misma evidencia por habilidad", async () => {
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const off = await createEssentialWordsRuntime(USER);
    const offSession = await off.buildSession({ levels: null, pos: null, now: NOW });
    await off.recordAttempt({
      item: offSession.items[0], quality: 2, sessionId: "off-same-evidence",
      renderedMode: "dictation_sentence", persistLegacySrs: false,
      outcome: dictationOutcome(),
    });
    const [offAttempt] = await db.attemptLogs.where("userId").equals(USER).toArray();

    await db.attemptLogs.clear();
    await db.learningItems.clear();
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "on");
    const on = await createEssentialWordsRuntime(USER);
    const onSession = await on.buildSession({ levels: null, pos: null, now: NOW });
    await on.recordAttempt({
      item: onSession.items[0], quality: 2, sessionId: "on-same-evidence",
      renderedMode: "dictation_sentence",
      outcome: dictationOutcome(),
    });
    const [onAttempt] = await db.attemptLogs.where("userId").equals(USER).toArray();

    expect(offAttempt.observations.map(({ observedAt, ...observation }) => observation))
      .toEqual(onAttempt.observations.map(({ observedAt, ...observation }) => observation));
  });

  it("un dictado vacío no acredita production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "off");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    await runtime.recordAttempt({
      item: session.items[0], quality: 2, sessionId: "off-empty-dictation",
      renderedMode: "dictation_sentence", persistLegacySrs: false,
      outcome: dictationOutcome({
        evidencia: [{ habilidad: "listening", veredicto: "fallo" }],
      }),
    });

    const [attempt] = await db.attemptLogs.where("userId").equals(USER).toArray();
    expect(attempt.observations).toEqual([
      expect.objectContaining({ skill: "listening", outcome: "failure" }),
    ]);
  });

  it("shadow conserva la cola legacy sin escribir el bundle skill", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKILL_MODEL_MODE", "shadow");
    const { createEssentialWordsRuntime } = await import("../runtime-engine");
    const runtime = await createEssentialWordsRuntime(USER);
    const session = await runtime.buildSession({ levels: null, pos: null, now: NOW });
    expect(runtime.mode).toBe("shadow");
    expect(session.source).toBe("legacy");

    await runtime.recordAttempt({
      item: session.items[0], quality: 2, sessionId: "shadow-evidence",
      renderedMode: "dictation_sentence", persistLegacySrs: false,
      outcome: dictationOutcome(),
    });

    expect(await db.attemptLogs.where("userId").equals(USER).count()).toBe(0);
    expect(await db.learningItems.where("userId").equals(USER).count()).toBe(0);
  });
});
