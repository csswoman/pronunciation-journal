import { DEFAULT_ACTIVATION_LIMITS } from "./activation-limits";
import { DEFAULT_SECONDS_BY_MODALITY } from "./cost-estimate";
import { planDailySession } from "./daily-budget";
import { DEFAULT_CONVERSIONS_PER_DAY } from "./placement/policy";
import type {
  ActivationCandidate,
  DailyPlan,
  DailyPlanningInput,
  PlannedItem,
} from "./planning-types";
import type { EssentialWordQueueItem } from "./queue";
import { DEFAULT_RECOVERY_POLICY } from "./recovery-mode";
import { buildSkillQueue } from "./skill-queue";
import { learningItemId } from "./skill-item";
import { essentialWordId, type EssentialWord } from "./types";
import type {
  AttemptEventType,
  AttemptLog,
  AttemptModality,
  BaseSkill,
  LearningItem,
} from "./verification/types";
import type { EssentialWordMode } from "./exercise-modes";
import { planKnownClaim } from "./verification/claim-known";

const BASE_SKILLS: readonly BaseSkill[] = ["meaning", "listening", "production"];
const DAILY_BUDGET_SECONDS = 8 * 60;
const NEW_WORD_LIMIT = 10;

const modalityForSkill = (skill: LearningItem["skill"]): AttemptModality => {
  if (skill === "listening") return "listening";
  if (skill === "production" || skill === "usage") return "production";
  return "recognition";
};

export interface SkillRuntimeQueueItem extends EssentialWordQueueItem {
  plannedItem: PlannedItem;
  currentItems: LearningItem[];
  eventType: AttemptEventType;
  forcedMode: EssentialWordMode;
}

export interface RuntimePlanningSnapshot {
  words: EssentialWord[];
  items: LearningItem[];
  attempts: AttemptLog[];
  now: Date;
  previousMode?: "normal" | "recovery";
}

export function createBaseLearningItems(wordId: string): LearningItem[] {
  return BASE_SKILLS.map((skill) => ({
    id: learningItemId(wordId, skill),
    wordId,
    skill,
    contentOrigin: "authored",
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  }));
}

function completeBaseItems(wordId: string, existing: LearningItem[]): LearningItem[] {
  const bySkill = new Map(existing.map((item) => [item.skill, item]));
  return createBaseLearningItems(wordId).map((item) => bySkill.get(item.skill) ?? item)
    .concat(existing.filter((item) => item.skill === "usage"));
}

function toPlannedItem(item: LearningItem): PlannedItem {
  return {
    itemId: item.id,
    wordId: item.wordId,
    skill: item.skill,
    modality: modalityForSkill(item.skill),
    dueAt: item.schedule.kind === "none" ? "" : item.schedule.dueAt,
  };
}

function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function classifyMandatory(
  items: LearningItem[],
  now: Date,
): DailyPlanningInput["mandatory"] {
  const mandatory: DailyPlanningInput["mandatory"] = {
    learning: [], overdue: [], dueToday: [], provisionalDue: [],
  };
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const item of items) {
    if (item.suspended || item.schedule.kind === "none") continue;
    const dueAt = new Date(item.schedule.dueAt);
    if (dueAt > now) continue;
    const planned = toPlannedItem(item);
    if (item.schedule.kind === "provisional") mandatory.provisionalDue.push(planned);
    else if (item.schedule.state === "Learning" || item.schedule.state === "Relearning") {
      mandatory.learning.push(planned);
    } else if (dueAt < today) mandatory.overdue.push(planned);
    else if (dueAt < tomorrow) mandatory.dueToday.push(planned);
  }
  return mandatory;
}

function attemptsToday(attempts: AttemptLog[], now: Date): AttemptLog[] {
  const from = startOfDay(now).toISOString();
  return attempts.filter((attempt) => attempt.occurredAt >= from);
}

export function buildRuntimePlanningInput(
  snapshot: RuntimePlanningSnapshot,
): DailyPlanningInput {
  const wordIds = new Set(snapshot.words.map((word) => essentialWordId(word.word)));
  const items = snapshot.items.filter((item) => wordIds.has(item.wordId));
  const byWord = new Map<string, LearningItem[]>();
  for (const item of items) {
    const current = byWord.get(item.wordId) ?? [];
    current.push(item);
    byWord.set(item.wordId, current);
  }

  const baseSkillActivations: ActivationCandidate[] = [];
  for (const [wordId, existing] of byWord) {
    const meaning = existing.find((item) => item.skill === "meaning");
    if (!meaning || meaning.schedule.kind === "none") continue;
    for (const item of completeBaseItems(wordId, existing)) {
      if ((item.skill === "listening" || item.skill === "production")
        && item.schedule.kind === "none") {
        baseSkillActivations.push({
          itemId: item.id,
          wordId,
          skill: item.skill,
          modality: modalityForSkill(item.skill),
          source: "pending-base",
        });
      }
    }
  }

  const today = attemptsToday(snapshot.attempts, snapshot.now);
  const consumed = {
    newWords: today.filter((attempt) =>
      attempt.eventType === "learning-step" && attempt.assessment.modality === "recognition").length,
    baseSkillActivations: today.filter((attempt) =>
      attempt.eventType === "learning-step"
      && (attempt.assessment.modality === "listening"
        || attempt.assessment.modality === "production")).length,
    usageActivations: 0,
  };
  const existingMeaning = new Set(items.filter((item) => item.skill === "meaning")
    .map((item) => item.wordId));
  const placementCandidates = items.filter((item) =>
    item.placementInference && item.schedule.kind === "none");

  return {
    dailyBudgetSeconds: DAILY_BUDGET_SECONDS,
    configuredNewWordLimit: NEW_WORD_LIMIT,
    mandatory: classifyMandatory(items, snapshot.now),
    candidates: {
      baseSkillActivations,
      usageActivations: items.filter((item) =>
        item.skill === "usage" && item.schedule.kind === "none").map((item) => ({
        itemId: item.id,
        wordId: item.wordId,
        skill: item.skill,
        modality: "production",
        source: "usage",
      })),
      newWords: snapshot.words.filter((word) => !existingMeaning.has(essentialWordId(word.word)))
        .map((word) => ({ wordId: essentialWordId(word.word), rank: word.rank })),
      placementCandidates,
    },
    estimatedSeconds: {
      byModality: { ...DEFAULT_SECONDS_BY_MODALITY },
      newWordIntroduction: 4,
    },
    consumed,
    previousMode: snapshot.previousMode ?? "normal",
    pendingBaseObligationCount: baseSkillActivations.length,
    recentBaseService: [],
    recentUsageActivations: [],
    capacityForecast: { sessions: [], mandatory: [], dueReservations: [], futureReservations: [] },
    placementContext: {
      now: snapshot.now,
      maxConversionsPerSession: DEFAULT_CONVERSIONS_PER_DAY,
      activeSessionDates: snapshot.attempts.map((attempt) => new Date(attempt.occurredAt)),
    },
  };
}

export function planRuntimeSession(snapshot: RuntimePlanningSnapshot): DailyPlan {
  return planDailySession(
    buildRuntimePlanningInput(snapshot),
    DEFAULT_ACTIVATION_LIMITS,
    DEFAULT_RECOVERY_POLICY,
  );
}

const modeForSkill = (skill: LearningItem["skill"]): EssentialWordMode => {
  if (skill === "listening") return "dictation_word";
  if (skill === "production") return "speak_sentence";
  if (skill === "usage") return "cloze_sentence";
  return "recognize_translation";
};

export function toRuntimeQueue(
  plan: DailyPlan,
  words: EssentialWord[],
  existingItems: LearningItem[],
): SkillRuntimeQueueItem[] {
  const wordsById = new Map(words.map((word) => [essentialWordId(word.word), word]));
  const itemsByWord = new Map<string, LearningItem[]>();
  for (const item of existingItems) {
    const current = itemsByWord.get(item.wordId) ?? [];
    current.push(item);
    itemsByWord.set(item.wordId, current);
  }
  const newWordIds = new Set(plan.newWordsSelected.map((item) => item.wordId));

  return buildSkillQueue({ plan }).flatMap((plannedItem) => {
    const entry = wordsById.get(plannedItem.wordId);
    if (!entry) return [];
    const currentItems = completeBaseItems(
      plannedItem.wordId,
      itemsByWord.get(plannedItem.wordId) ?? [],
    );
    const current = currentItems.find((item) => item.id === plannedItem.itemId);
    const eventType: AttemptEventType = current?.schedule.kind === "provisional"
      ? "verification"
      : current?.schedule.kind === "fsrs"
        ? "scheduled-review"
        : "learning-step";
    return [{
      entry,
      kind: newWordIds.has(plannedItem.wordId) ? "new" as const : "review" as const,
      repetitions: current?.repetitions,
      plannedItem,
      currentItems,
      eventType,
      forcedMode: modeForSkill(plannedItem.skill),
    }];
  });
}

export function toKnownClaimQueueItem(
  item: SkillRuntimeQueueItem,
): SkillRuntimeQueueItem | null {
  const claim = planKnownClaim(item.entry, item.currentItems);
  if (claim.kind === "nothing-to-verify") return null;
  const production = item.currentItems.find((current) => current.skill === "production")
    ?? createBaseLearningItems(item.plannedItem.wordId)
      .find((current) => current.skill === "production")!;
  return {
    ...item,
    kind: "review",
    plannedItem: {
      itemId: production.id,
      wordId: production.wordId,
      skill: "production",
      modality: claim.step.modality,
      dueAt: production.schedule.kind === "none" ? "" : production.schedule.dueAt,
    },
    eventType: "verification",
    forcedMode: "recall_translation",
  };
}
