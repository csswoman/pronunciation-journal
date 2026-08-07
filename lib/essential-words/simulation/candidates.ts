import type { ExecutionContext } from "../execution-context";
import { DEFAULT_MATURITY_POLICY } from "../skill-item";
import { DEFAULT_CONVERSIONS_PER_DAY } from "../placement/policy";
import { pickControlSamples } from "../placement/control-sampling";
import type {
  ActivationCandidate,
  NewWordCandidate,
  PlannedItem,
} from "../planning-types";
import { usageEligibility } from "../usage/lifecycle";
import type { LearningItem, Skill } from "../verification/types";
import type { SimulationProfile } from "./profiles";
import type { SimulationWorld, SimulatedWordState } from "./state";

export interface SimulationMandatory {
  learning: PlannedItem[];
  overdue: PlannedItem[];
  dueToday: PlannedItem[];
  provisionalDue: PlannedItem[];
}

export interface SimulationCandidates {
  baseSkillActivations: ActivationCandidate[];
  usageActivations: ActivationCandidate[];
  newWords: NewWordCandidate[];
  /** Inferred meanings awaiting capacity-aware conversion. */
  placementCandidates: LearningItem[];
  /** @deprecated Prefer placementCandidates; kept for adversarial hooks. */
  inferredConversions: LearningItem[];
  conversionLimit: number;
}

function modalityFor(skill: Skill): PlannedItem["modality"] {
  if (skill === "listening") return "listening";
  if (skill === "production" || skill === "usage") return "production";
  return "recognition";
}

function plannedItem(item: LearningItem): PlannedItem {
  return {
    itemId: item.id,
    wordId: item.wordId,
    skill: item.skill,
    modality: modalityFor(item.skill),
    dueAt: item.schedule.kind === "none" ? "" : item.schedule.dueAt,
  };
}

export function itemsInWorld(world: SimulationWorld): LearningItem[] {
  return [...world.words.values()].flatMap((word) => [
    word.meaning,
    word.listening,
    word.production,
    ...word.usage.map(({ item }) => item),
  ]);
}

function isUnavailable(item: LearningItem): boolean {
  return item.suspended || Boolean(item.payload?.retiredAt);
}

export function collectMandatory(
  world: SimulationWorld,
  now: Date,
): SimulationMandatory {
  const result: SimulationMandatory = {
    learning: [],
    overdue: [],
    dueToday: [],
    provisionalDue: [],
  };
  const seen = new Set<string>();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(startOfDay.getTime() + 86_400_000);

  for (const item of itemsInWorld(world)) {
    if (seen.has(item.id) || isUnavailable(item) || item.schedule.kind === "none") continue;

    const due = new Date(item.schedule.dueAt);
    if (due > now && due >= nextDay) continue;

    let bucket: PlannedItem[] | undefined;
    if (item.schedule.kind === "provisional" && due <= now) {
      bucket = result.provisionalDue;
    } else if (
      item.schedule.kind === "fsrs"
      && item.schedule.state !== "Review"
      && due <= now
    ) {
      bucket = result.learning;
    } else if (item.schedule.kind === "fsrs" && due < startOfDay) {
      bucket = result.overdue;
    } else if (item.schedule.kind === "fsrs" && due < nextDay) {
      bucket = result.dueToday;
    }

    if (bucket) {
      bucket.push(plannedItem(item));
      seen.add(item.id);
    }
  }

  for (const bucket of [
    result.learning,
    result.overdue,
    result.dueToday,
    result.provisionalDue,
  ]) {
    bucket.sort((left, right) => left.dueAt.localeCompare(right.dueAt));
  }
  return result;
}

function baseCandidates(word: SimulatedWordState, now?: Date): ActivationCandidate[] {
  if (!word.introducedAt || word.meaning.schedule.kind === "none") return [];

  // Completing listening/production observes meaning and can rewrite an unripe
  // placement-inference provisional before it becomes due (Task 8.9c).
  if (
    word.meaning.schedule.kind === "provisional"
    && word.meaning.schedule.source === "placement-inference"
    && now
    && new Date(word.meaning.schedule.dueAt) > now
  ) {
    return [];
  }

  if (word.listening.schedule.kind === "none" && !word.listening.suspended) {
    return [{
      itemId: word.listening.id,
      wordId: word.wordId,
      skill: "listening",
      modality: "listening",
    }];
  }
  if (word.production.schedule.kind === "none" && !word.production.suspended) {
    return [{
      itemId: word.production.id,
      wordId: word.wordId,
      skill: "production",
      modality: "production",
    }];
  }
  return [];
}

function conversionLimit(items: LearningItem[]): number {
  if (items.length === 0) return 0;
  const averageConfidence = items.reduce(
    (total, item) => total + (item.placementInference?.confidence ?? 0),
    0,
  ) / items.length;
  return Math.min(
    DEFAULT_CONVERSIONS_PER_DAY,
    Math.max(0, Math.ceil(DEFAULT_CONVERSIONS_PER_DAY * averageConfidence)),
  );
}

export function collectCandidates(
  world: SimulationWorld,
  profile: SimulationProfile,
  context: ExecutionContext,
): SimulationCandidates {
  const words = [...world.words.values()].sort((left, right) => left.rank - right.rank);
  const baseSkillActivations = words.flatMap((word) => baseCandidates(word, context.now));
  const usageActivations = words.flatMap((word): ActivationCandidate[] => {
    const eligibility = usageEligibility(
      [word.meaning, word.production],
      world.srsEvents,
      DEFAULT_MATURITY_POLICY,
    );

    return word.usage.flatMap(({ item, readyAt }) => {
      const kind = item.payload?.usageKind;
      if (
        !kind
        || item.payload?.generationStatus !== "ready"
        || item.payload.retiredAt
        || item.suspended
        || item.schedule.kind !== "none"
        || readyAt > context.now.toISOString()
        || !eligibility[kind]
      ) return [];

      return [{
        itemId: item.id,
        wordId: item.wordId,
        skill: "usage" as const,
        modality: "production" as const,
      }];
    });
  });

  const inferred = words
    .map((word) => word.meaning)
    .filter((item) => item.placementInference && item.schedule.kind === "none");
  const controls = pickControlSamples(inferred, world.sessionIndex + 1);
  const controlIds = new Set(controls.map((item) => item.id));
  const placementCandidates = profile.placementConfidence === "high"
    ? [
        ...controls,
        ...inferred.filter((item) => !controlIds.has(item.id)),
      ]
    : [];
  const limit = conversionLimit(placementCandidates);

  const newWords = words
    .filter((word) => (
      !word.introducedAt
      && word.meaning.schedule.kind === "none"
      && !word.meaning.placementInference
      && !word.meaning.suspended
    ))
    .map(({ wordId, rank }) => ({ wordId, rank }));

  return {
    baseSkillActivations,
    usageActivations,
    newWords,
    placementCandidates,
    inferredConversions: placementCandidates,
    conversionLimit: limit,
  };
}
