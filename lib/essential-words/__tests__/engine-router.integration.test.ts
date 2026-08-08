// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { SRSData } from "@/lib/types";
import { fixedExecutionContext } from "../execution-context";
import {
  createEssentialWordsEngineRouter,
  type EssentialWordsEngine,
} from "../engine-router";
import { persistAttemptRecord, planAttemptRecord } from "../record-attempt";
import type { AttemptAssessment, LearningItem } from "../verification/types";
import type { SkillEngineMode } from "../../feature-flags";

const USER = "00000000-0000-4000-8000-000000000091";
const NOW = new Date("2026-08-08T10:00:00.000Z");

type Engine = EssentialWordsEngine<string, string, string, string, string>;

const assessment: AttemptAssessment = {
  grade: "Good",
  modality: "recognition",
  correct: true,
  latencyMs: 1_000,
  interactionDurationMs: 4_000,
  usedHints: false,
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
};

const meaning: LearningItem = {
  id: "c1k:on#meaning",
  wordId: "c1k:on",
  skill: "meaning",
  contentOrigin: "authored",
  schedule: { kind: "none" },
  repetitions: 0,
  lapses: 0,
  suspended: false,
};

const skillBundle = () => planAttemptRecord({
  wordId: "c1k:on",
  sessionId: "router-session",
  assessment,
  eventType: "verification",
  currentItems: [meaning],
}, fixedExecutionContext(NOW, ["router-attempt", "router-event"]));

const legacyRow: SRSData = {
  userId: USER,
  wordId: "c1k:on",
  word: "on",
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-08-09T10:00:00.000Z",
};

const engines = (): { legacyEngine: Engine; skillEngine: Engine } => ({
  legacyEngine: {
    buildSession: async () => "legacy-session",
    recordAttempt: async () => { await db.srsData.put(legacyRow); },
    getProgress: async () => "legacy-progress",
  },
  skillEngine: {
    buildSession: async () => "skill-session",
    recordAttempt: async () => { await persistAttemptRecord(USER, skillBundle()); },
    getProgress: async () => "skill-progress",
  },
});

const counts = async () => ({
  legacy: await db.srsData.where("wordId").startsWith("c1k:").count(),
  items: await db.learningItems.count(),
  attempts: await db.attemptLogs.count(),
  events: await db.srsReviewEvents.count(),
  outbox: await db.syncOutbox.count(),
});

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

afterEach(() => db.close());

describe("engine router sin double-write", () => {
  it.each(["off", "shadow"] as const)(
    "%s escribe solo SRSData c1k y cero bundle/outbox skill",
    async (mode) => {
      const router = createEssentialWordsEngineRouter({
        userId: USER,
        rollout: { mode, cohortPercent: 100, cohortSalt: "integration", internalUsers: [] },
        ...engines(),
      });
      expect(await router.buildSession("build")).toBe("legacy-session");
      await router.recordAttempt("attempt");
      expect(await counts()).toEqual({ legacy: 1, items: 0, attempts: 0, events: 0, outbox: 0 });
    },
  );

  it("on escribe solo el bundle skill y nunca SRSData c1k", async () => {
    const router = createEssentialWordsEngineRouter({
      userId: USER,
      rollout: { mode: "on", cohortPercent: 100, cohortSalt: "integration", internalUsers: [] },
      ...engines(),
    });
    expect(await router.buildSession("build")).toBe("skill-session");
    await router.recordAttempt("attempt");
    expect(await counts()).toEqual({ legacy: 0, items: 1, attempts: 1, events: 1, outbox: 3 });
  });

  it("una interacción en cada modo nunca deja ambos modelos escritos", async () => {
    for (const mode of ["off", "shadow", "on"] satisfies SkillEngineMode[]) {
      db.close();
      await db.delete();
      await db.open();
      const router = createEssentialWordsEngineRouter({
        userId: USER,
        rollout: { mode, cohortPercent: 100, cohortSalt: "integration", internalUsers: [] },
        ...engines(),
      });
      await router.recordAttempt("attempt");
      const state = await counts();
      expect(state.legacy > 0 && state.attempts > 0).toBe(false);
    }
  });
});
