import { fetchEssentialWords } from "./client";
import { createEssentialWordsEngineRouter } from "./engine-router";
import { readSkillEngineRolloutConfig } from "../feature-flags";
import { gradeEssentialWord, type GradeExtras } from "./grade";
import { getAttemptLogs, getLearningItems } from "./queries";
import { persistAttemptRecord, planAttemptRecord } from "./record-attempt";
import {
  planRuntimeSession,
  toRuntimeQueue,
  type SkillRuntimeQueueItem,
} from "./runtime-adapter";
import { runSkillModelMigration } from "./run-skill-model-migration";
import { loadEssentialWordsQueue, type EssentialWordsStats } from "./session-loader";
import { summarizeSkillDailyPlan } from "./shadow-metrics";
import { systemExecutionContext } from "./execution-context";
import { matchesFilter, type EssentialWordQueueItem } from "./queue";
import { NEW_CARDS_PER_DAY, type CefrLevel, type EssentialWord, type EssentialWordPos } from "./types";
import type { AttemptOutcome } from "./attempt-grade";
import { buildAssessment } from "./verification/assessment";
import type { DailyPlan } from "./planning-types";
import type { AttemptLog } from "./verification/types";
import { savePracticeAnswer } from "@/lib/practice/queries";

export interface RuntimeBuildInput {
  levels: readonly CefrLevel[] | null;
  pos: readonly EssentialWordPos[] | null;
  now: Date;
  previousMode?: "normal" | "recovery";
}

export interface EssentialWordsRuntimeSession {
  source: "legacy" | "skill";
  items: Array<EssentialWordQueueItem | SkillRuntimeQueueItem>;
  stats: EssentialWordsStats;
  allWords: EssentialWord[];
  seenIds: Set<string>;
  skillPlan?: DailyPlan;
}

export interface RuntimeAttemptInput {
  item: EssentialWordQueueItem | SkillRuntimeQueueItem;
  outcome: AttemptOutcome;
  quality: number;
  extras?: GradeExtras;
  sessionId: string;
}

const isSkillItem = (
  item: EssentialWordQueueItem | SkillRuntimeQueueItem,
): item is SkillRuntimeQueueItem => "plannedItem" in item;

function skillStats(
  words: EssentialWord[],
  items: Awaited<ReturnType<typeof getLearningItems>>,
  attempts: AttemptLog[],
  queue: SkillRuntimeQueueItem[],
  now: Date,
): EssentialWordsStats {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const learnedWords = new Set(items.filter((item) =>
    item.skill === "meaning" && item.schedule.kind !== "none").map((item) => item.wordId));
  const dueTomorrow = items.filter((item) =>
    item.schedule.kind !== "none"
    && new Date(item.schedule.dueAt) >= tomorrowStart
    && new Date(item.schedule.dueAt) < dayAfter).length;
  const newToday = new Set(attempts.filter((attempt) =>
    attempt.eventType === "learning-step"
    && new Date(attempt.occurredAt) >= todayStart
    && new Date(attempt.occurredAt) < tomorrowStart).map((attempt) => attempt.wordId)).size;
  return {
    totalWords: words.length,
    learned: learnedWords.size,
    dueCount: queue.filter((item) => item.eventType !== "learning-step").length,
    dueTomorrow,
    newToday,
    newQuota: NEW_CARDS_PER_DAY,
    vaulted: 0,
  };
}

async function buildSkillSession(
  userId: string,
  input: RuntimeBuildInput,
): Promise<EssentialWordsRuntimeSession> {
  const [allWords, items, attempts] = await Promise.all([
    fetchEssentialWords(),
    getLearningItems(userId),
    getAttemptLogs(userId),
  ]);
  const words = allWords.filter((word) => matchesFilter(word, input.levels, input.pos));
  const plan = planRuntimeSession({
    words,
    items,
    attempts,
    now: input.now,
    previousMode: input.previousMode,
  });
  const queue = toRuntimeQueue(plan, words, items);
  return {
    source: "skill",
    items: queue,
    stats: skillStats(words, items, attempts, queue, input.now),
    allWords,
    seenIds: new Set(items.map((item) => item.wordId)),
    skillPlan: plan,
  };
}

async function buildLegacySession(
  userId: string,
  input: RuntimeBuildInput,
): Promise<EssentialWordsRuntimeSession> {
  const loaded = await loadEssentialWordsQueue(input.levels, input.pos, userId);
  return { source: "legacy", ...loaded };
}

async function recordSkillAttempt(userId: string, input: RuntimeAttemptInput): Promise<void> {
  if (!isSkillItem(input.item)) throw new Error("Skill runtime requires a planned item");
  const assessment = buildAssessment(input.outcome, input.item.plannedItem.modality, {
    interactionDurationMs: input.outcome.latencyMs,
  });
  const plan = planAttemptRecord({
    wordId: input.item.plannedItem.wordId,
    sessionId: input.sessionId,
    assessment,
    eventType: input.item.eventType,
    currentItems: input.item.currentItems,
  }, systemExecutionContext());
  await persistAttemptRecord(userId, plan);
}

export async function createEssentialWordsRuntime(
  userId: string,
) {
  const router = createEssentialWordsEngineRouter({
    userId,
    rollout: readSkillEngineRolloutConfig(),
    legacyEngine: {
      buildSession: (input: RuntimeBuildInput) => buildLegacySession(userId, input),
      recordAttempt: async (input: RuntimeAttemptInput) => {
        await gradeEssentialWord(input.item.entry.word, input.quality, input.extras, userId);
      },
      getProgress: async () => getLearningItems(userId),
    },
    skillEngine: {
      buildSession: (input: RuntimeBuildInput) => buildSkillSession(userId, input),
      recordAttempt: (input: RuntimeAttemptInput) => recordSkillAttempt(userId, input),
      getProgress: async () => getLearningItems(userId),
    },
    shadow: {
      summarizeLegacy: (session) => ({
        queueSize: session.items.length,
        estimatedSeconds: session.items.length * 12,
        dueCount: session.stats.dueCount,
      }),
      summarizeSkill: (session) => session.skillPlan
        ? summarizeSkillDailyPlan(session.skillPlan)
        : {
          queueSize: session.items.length,
          estimatedSeconds: session.items.length * 12,
          dueCount: session.stats.dueCount,
          mandatorySelected: session.stats.dueCount,
          deferredMandatory: 0,
          baseSkillActivations: 0,
          usageActivations: 0,
          mode: "normal",
        },
    },
  });

  // The migration is an idempotent prerequisite of the live skill engine. It
  // is deliberately excluded from off and shadow so those modes remain
  // read-only with respect to the skill bundle.
  if (router.mode === "on") await runSkillModelMigration(userId, new Date());

  return {
    mode: router.mode,
    buildSession: (input: RuntimeBuildInput) => router.buildSession(input),
    async recordAttempt(input: RuntimeAttemptInput): Promise<void> {
      await router.recordAttempt(input);
      if (router.mode !== "on") return;
      const plannedItem = isSkillItem(input.item) ? input.item.plannedItem : undefined;
      await savePracticeAnswer(userId, {
        exerciseId: plannedItem?.itemId ?? input.item.entry.word,
        exerciseTypeId: input.extras?.accuracy !== undefined ? 10 : 5,
        slug: input.extras?.accuracy !== undefined ? "speak_word" : "fill_blank",
        isCorrect: input.quality >= 3,
        userAnswer: input.extras?.transcript,
        contentId: plannedItem?.wordId ?? input.item.entry.word,
        context: "essential-words",
        timeMs: input.outcome.latencyMs,
      }).catch(() => undefined);
    },
  };
}
