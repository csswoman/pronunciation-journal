import { fetchEssentialWords } from "./client";
import { createEssentialWordsEngineRouter } from "./engine-router";
import { readSkillEngineRolloutConfig, resolveSkillEngineMode } from "../feature-flags";
import { gradeEssentialWord, type GradeExtras } from "./grade";
import { getAttemptLogs, getLearningItems } from "./queries";
import { persistAttemptRecord, planAttemptRecord } from "./record-attempt";
import { planRuntimeSession, createBaseLearningItems, toEssentialWordsSkillQueue, type SkillRuntimeQueueItem } from "./runtime-adapter";
import { runSkillModelMigration } from "./run-skill-model-migration";
import { loadEssentialWordsQueue, type EssentialWordsStats } from "./session-loader";
import { summarizeSkillDailyPlan } from "./shadow-metrics";
import { systemExecutionContext } from "./execution-context";
import { matchesFilter, type EssentialWordQueueItem } from "./queue";
import { essentialWordId, GUIDED_SESSION_NEW_CARDS, type CefrLevel, type EssentialWord, type EssentialWordPos } from "./types";
import type { AttemptOutcome } from "./attempt-grade";
import type { EssentialWordMode } from "./exercise-modes";
import { attributionForRenderedAttempt } from "./runtime-attribution";
import { estimateInitialListeningLevel, retireInitialListeningLevel } from "./initial-listening-level";
import { deriveListeningLadderLevel, resolveListeningLadderMode } from "./listening-ladder";
import { buildAssessment } from "./verification/assessment";
import type { DailyPlan } from "./planning-types";
import type { AttemptLog } from "./verification/types";
import { savePracticeAnswer } from "@/lib/practice/queries";
import { db } from "@/lib/db";
import { enqueue } from "@/lib/sync/sync-manager";
import { dictationContrastEvidence, weakestEligibleContrast } from "./contrast-profile-writer";
import { SPANISH_COLD_START_CONTRASTS } from "./listening-blanks";
import { getAllContrastProgress, getRetiredEssentialWordBlankKeys } from "../phoneme-practice/queries";
export interface RuntimeBuildInput {
  levels: readonly CefrLevel[] | null;
  pos: readonly EssentialWordPos[] | null;
  now: Date;
  previousMode?: "normal" | "recovery";
  /** Optional per-session ceiling for new words selected by this surface. */
  maxNewWords?: number;
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
  renderedMode?: EssentialWordMode;
  /** False preserves legacy retry behavior while still writing skill evidence. */
  persistLegacySrs?: boolean;
}

const isSkillItem = (
  item: EssentialWordQueueItem | SkillRuntimeQueueItem,
): item is SkillRuntimeQueueItem => "plannedItem" in item;

async function enqueueDictationContrastEvidence(userId: string, attemptId: string, outcome: AttemptOutcome): Promise<void> {
  for (const evidence of dictationContrastEvidence(outcome.palabras ?? [], outcome.listeningTier)) {
    await enqueue(userId, 'attempt_logs', 'rpc', {
      p_attempt_id: attemptId,
      p_contrast_id: evidence.contrastId,
      p_weight: evidence.weight,
      p_is_correct: evidence.correct,
    }, undefined, undefined, 'apply_essential_word_contrast_observation', attemptId)
  }
  for (const blank of outcome.guessBlankKeys ?? []) {
    await enqueue(userId, 'essential_word_blank_quality', 'insert', {
      sentence_id: blank.sentenceId,
      token_index: blank.tokenIndex,
      user_id: userId,
    }, undefined, undefined, undefined, attemptId)
  }
}

function skillStats(
  words: EssentialWord[],
  items: Awaited<ReturnType<typeof getLearningItems>>,
  attempts: AttemptLog[],
  queue: SkillRuntimeQueueItem[],
  now: Date,
  maxNewWords: number,
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
    newQuota: maxNewWords,
    vaulted: 0,
  };
}

async function buildSkillSession(
  userId: string,
  input: RuntimeBuildInput,
): Promise<EssentialWordsRuntimeSession> {
  const [allWords, items, attempts, progress, retiredBlankKeys] = await Promise.all([
    fetchEssentialWords(),
    getLearningItems(userId),
    getAttemptLogs(userId),
    getAllContrastProgress(userId),
    getRetiredEssentialWordBlankKeys(),
  ]);
  const words = allWords.filter((word) => matchesFilter(word, input.levels, input.pos));
  const focusContrastId = weakestEligibleContrast(progress.map((row) => ({ contrastId: row.contrast_id, score: row.adaptive_score ?? 0, observationCount: row.observation_count ?? 0 })), SPANISH_COLD_START_CONTRASTS);
  const plan = planRuntimeSession({
    words,
    items,
    attempts,
    now: input.now,
    previousMode: input.previousMode,
    maxNewWords: input.maxNewWords,
  });
  const materialized = toEssentialWordsSkillQueue(plan, words, items, (diagnostic) => {
    console.warn("[essential-words] skill mode materialization", diagnostic);
  });
  const queue = materialized.flatMap((item) => {
    if (item.plannedItem.skill !== "listening") return [item];
    const listening = item.currentItems.find((current) => current.skill === "listening");
    if (!listening) return [];
    const listeningLadder = deriveListeningLadderLevel(listening, attempts, input.now);
    if (!resolveListeningLadderMode(item.entry, listeningLadder.level)) {
      console.warn("[essential-words] listening ladder mode unavailable", {
        wordId: item.plannedItem.wordId,
        level: listeningLadder.level,
      });
      return [];
    }
    return [{ ...item, listeningLadder, focusContrastId, retiredBlankKeys }];
  });
  return {
    source: "skill",
    items: queue,
    stats: skillStats(words, items, attempts, queue, input.now, input.maxNewWords ?? GUIDED_SESSION_NEW_CARDS),
    allWords,
    seenIds: new Set(items.map((item) => item.wordId)),
    skillPlan: plan,
  };
}

async function buildLegacySession(
  userId: string,
  input: RuntimeBuildInput,
): Promise<EssentialWordsRuntimeSession> {
  const loaded = await loadEssentialWordsQueue(input.levels, input.pos, userId, {
    maxNewWords: input.maxNewWords,
  });
  return { source: "legacy", ...loaded };
}

async function recordSkillAttempt(userId: string, input: RuntimeAttemptInput): Promise<void> {
  if (!isSkillItem(input.item)) throw new Error("Skill runtime requires a planned item");
  const context = systemExecutionContext();
  const attribution = input.renderedMode
    ? attributionForRenderedAttempt(input.renderedMode, input.outcome, {
      interactionDurationMs: input.outcome.latencyMs,
    }, context.now.toISOString())
    : { assessment: buildAssessment(input.outcome, input.item.plannedItem.modality, {
      interactionDurationMs: input.outcome.latencyMs,
    }) };
  const priorAttempts = await getAttemptLogs(userId, { wordId: input.item.plannedItem.wordId });
  const plan = planAttemptRecord({
    wordId: input.item.plannedItem.wordId,
    sessionId: input.sessionId,
    assessment: attribution.assessment,
    eventType: input.item.eventType,
    currentItems: input.item.currentItems,
    ...(input.renderedMode ? { renderedMode: input.renderedMode } : {}),
    ...(input.outcome.palabras ? { diagnostic: { tier: input.outcome.listeningTier, focusContrastId: input.outcome.focusContrastId, words: input.outcome.palabras.map((word) => ({ expected: word.expected, written: word.written, category: word.categoria, expectedIpa: word.expectedIpa, writtenIpa: word.writtenIpa, contrastId: word.contrastId })) } } : {}),
    ...(attribution.observations ? { observations: attribution.observations } : {}),
    ...(attribution.assessmentsBySkill ? { assessmentsBySkill: attribution.assessmentsBySkill } : {}),
  }, context);
  const listening = input.item.currentItems.find((item) => item.skill === "listening");
  const retiredListening = listening ? retireInitialListeningLevel(listening, [...priorAttempts, plan.attemptLog]) : undefined;
  if (retiredListening && retiredListening !== listening) {
    const updateIndex = plan.updatedItems.findIndex((item) => item.id === retiredListening.id);
    if (updateIndex >= 0) plan.updatedItems[updateIndex] = retiredListening;
    else await persistAttemptRecord(userId, plan, [retiredListening]);
  }
  if (!retiredListening || retiredListening === listening || plan.updatedItems.some((item) => item.id === retiredListening.id)) {
    await persistAttemptRecord(userId, plan);
  }
  await enqueueDictationContrastEvidence(userId, plan.attemptLog.id, input.outcome);
}

async function recordLegacySkillAttempt(userId: string, input: RuntimeAttemptInput): Promise<void> {
  const wordId = essentialWordId(input.item.entry.word.toLowerCase());
  const [existingItems, priorAttempts] = await Promise.all([
    getLearningItems(userId, [wordId]),
    getAttemptLogs(userId, { wordId }),
  ]);
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  // Legacy SRS is consulted only while the listening item is first seeded.
  // Once the item exists, its provisional estimate is self-contained.
  const hasListeningItem = existingById.has(`${wordId}#listening`);
  const source = hasListeningItem ? undefined : await db.srsData.get(wordId);
  const baseItems = createBaseLearningItems(wordId, estimateInitialListeningLevel(source))
    .map((item) => existingById.get(item.id) ?? item);
  const seedItems = baseItems.filter((item) => !existingById.has(item.id));
  const context = systemExecutionContext();
  const attribution = input.renderedMode
    ? attributionForRenderedAttempt(input.renderedMode, input.outcome, {
      interactionDurationMs: input.outcome.latencyMs,
    }, context.now.toISOString())
    : { assessment: buildAssessment(input.outcome, "recognition", {
      interactionDurationMs: input.outcome.latencyMs,
    }) };
  const plan = planAttemptRecord({
    wordId,
    sessionId: input.sessionId,
    assessment: attribution.assessment,
    eventType: "practice",
    currentItems: baseItems,
    ...(input.renderedMode ? { renderedMode: input.renderedMode } : {}),
    ...(input.outcome.palabras ? { diagnostic: { tier: input.outcome.listeningTier, focusContrastId: input.outcome.focusContrastId, words: input.outcome.palabras.map((word) => ({ expected: word.expected, written: word.written, category: word.categoria, expectedIpa: word.expectedIpa, writtenIpa: word.writtenIpa, contrastId: word.contrastId })) } } : {}),
    ...(attribution.observations ? { observations: attribution.observations } : {}),
    ...(attribution.assessmentsBySkill ? { assessmentsBySkill: attribution.assessmentsBySkill } : {}),
  }, context);
  const listening = baseItems.find((item) => item.skill === "listening");
  const retiredListening = listening ? retireInitialListeningLevel(listening, [...priorAttempts, plan.attemptLog]) : undefined;
  await persistAttemptRecord(userId, plan,
    retiredListening && retiredListening !== listening ? [retiredListening] : seedItems);
  await enqueueDictationContrastEvidence(userId, plan.attemptLog.id, input.outcome);
}

export async function createEssentialWordsRuntime(
  userId: string,
) {
  const rollout = readSkillEngineRolloutConfig();
  const resolvedMode = resolveSkillEngineMode(userId, rollout);
  const router = createEssentialWordsEngineRouter({
    userId,
    rollout,
    legacyEngine: {
      buildSession: (input: RuntimeBuildInput) => buildLegacySession(userId, input),
      recordAttempt: async (input: RuntimeAttemptInput) => {
        if (input.persistLegacySrs !== false) {
          await gradeEssentialWord(input.item.entry.word, input.quality, input.extras, userId);
        }
        if (resolvedMode !== "shadow") {
          try {
            await recordLegacySkillAttempt(userId, input);
          } catch (error) {
            console.error("[essential-words] legacy skill evidence failed", error);
          }
        }
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
