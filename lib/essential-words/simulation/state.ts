import type { ExecutionContext } from "../execution-context";
import type {
  CapacityReservation,
  DailyPlan,
  PlannedItem,
} from "../planning-types";
import type {
  AttemptLog,
  LearningItem,
  PlacementInference,
  SrsReviewEvent,
} from "../verification/types";
import {
  baseLearningItem,
  simulationWordId,
  type BaseLearningItem,
  usageContentFixtures,
} from "./fixtures";
import type { SimulationProfile } from "./profiles";
import { seededRandom } from "./random";

export interface SimulatedUsageContent {
  item: LearningItem;
  readyAt: string;
}

export interface SimulatedWordState {
  wordId: string;
  rank: number;
  introducedAt?: string;
  meaning: BaseLearningItem<"meaning">;
  listening: BaseLearningItem<"listening">;
  production: BaseLearningItem<"production">;
  usage: SimulatedUsageContent[];
}

export interface DeferredState {
  item: PlannedItem;
  firstDeferredSession: number;
  lastOfferedSession?: number;
}

export interface SimulationWorld {
  words: Map<string, SimulatedWordState>;
  attemptLogs: AttemptLog[];
  srsEvents: SrsReviewEvent[];
  deferred: Map<string, DeferredState>;
  previousMode: "normal" | "recovery";
  sessionIndex: number;
  introducedWords: number;
  placementConversions: number;
  futureReservations: CapacityReservation[];
}

export interface SimulationOptions {
  days: number;
  corpusSize: number;
  seed: number;
  startAt: string;
  dailyBudgetSeconds: number;
  targetNewWords: number;
}

export interface SimulationWorldCounts {
  introducedWords: number;
  activeMeaning: number;
  activeListening: number;
  activeProduction: number;
  activeUsage: number;
  placementConversions: number;
}

const ADVANCED_INFERENCE_RATE = 0.25;

function placementInference(
  profile: SimulationProfile,
  rank: number,
  inferredAt: string,
): PlacementInference | undefined {
  if (profile.placementConfidence !== "high") return undefined;
  return {
    bandId: `sim-band-${Math.ceil(rank / 100)}`,
    confidence: 0.9,
    inferredAt,
    policyVersion: "simulation-v1",
  };
}

export function createInitialWorld(
  options: SimulationOptions,
  profile: SimulationProfile,
): SimulationWorld {
  if (!Number.isInteger(options.corpusSize) || options.corpusSize < 0) {
    throw new Error("corpusSize must be a non-negative integer");
  }

  const start = new Date(options.startAt);
  if (Number.isNaN(start.getTime())) throw new Error("startAt must be a valid date");

  const inferredAt = start.toISOString();
  const random = seededRandom(options.seed);
  const words = new Map<string, SimulatedWordState>();

  for (let rank = 1; rank <= options.corpusSize; rank += 1) {
    const wordId = simulationWordId(rank);
    let meaning = baseLearningItem(wordId, "meaning");
    if (
      profile.placementConfidence === "high"
      && random.chance(ADVANCED_INFERENCE_RATE)
    ) {
      meaning = {
        ...meaning,
        placementInference: placementInference(profile, rank, inferredAt),
      };
    }

    words.set(wordId, {
      wordId,
      rank,
      meaning,
      listening: baseLearningItem(wordId, "listening"),
      production: baseLearningItem(wordId, "production"),
      usage: usageContentFixtures(wordId, rank, inferredAt),
    });
  }

  return {
    words,
    attemptLogs: [],
    srsEvents: [],
    deferred: new Map(),
    previousMode: "normal",
    sessionIndex: 0,
    introducedWords: 0,
    placementConversions: 0,
    futureReservations: [],
  };
}

export function simulationContext(
  date: Date,
  seed: number,
  counter: { value: number },
): ExecutionContext {
  return {
    now: date,
    newId: () => `sim:${seed}:${counter.value++}`,
  };
}

export function findWordItem(
  word: SimulatedWordState,
  itemId: string,
): LearningItem | undefined {
  return [
    word.meaning,
    word.listening,
    word.production,
    ...word.usage.map(({ item }) => item),
  ].find((item) => item.id === itemId);
}

export function replaceWorldItem(world: SimulationWorld, updated: LearningItem): void {
  const word = world.words.get(updated.wordId);
  if (!word) throw new Error(`missing simulated word: ${updated.wordId}`);

  if (updated.id === word.meaning.id) {
    word.meaning = updated as BaseLearningItem<"meaning">;
  } else if (updated.id === word.listening.id) {
    word.listening = updated as BaseLearningItem<"listening">;
  } else if (updated.id === word.production.id) {
    word.production = updated as BaseLearningItem<"production">;
  } else {
    const usage = word.usage.find((content) => content.item.id === updated.id);
    if (!usage) throw new Error(`missing simulated item: ${updated.id}`);
    usage.item = updated;
  }
}

export function applyInferenceConversions(
  world: SimulationWorld,
  conversions: LearningItem[],
  occurredAt: string,
): number {
  let applied = 0;
  for (const conversion of conversions) {
    const word = world.words.get(conversion.wordId);
    if (!word || conversion.id !== word.meaning.id || word.meaning.schedule.kind !== "none") {
      continue;
    }
    replaceWorldItem(world, conversion);
    if (!word.introducedAt) {
      word.introducedAt = occurredAt;
      world.introducedWords += 1;
    }
    applied += 1;
  }
  world.placementConversions += applied;
  return applied;
}

export function updateSimulationDeferred(
  world: SimulationWorld,
  plan: DailyPlan,
  completedIds: Set<string>,
): void {
  const offeredIds = new Set(plan.mandatorySelected.map((item) => item.itemId));
  const uncompleted = [
    ...plan.mandatorySelected.filter((item) => !completedIds.has(item.itemId)),
    ...plan.deferredMandatory,
  ];
  const currentIds = new Set(uncompleted.map((item) => item.itemId));
  for (const itemId of world.deferred.keys()) {
    if (!currentIds.has(itemId)) world.deferred.delete(itemId);
  }
  for (const item of uncompleted) {
    const previous = world.deferred.get(item.itemId);
    world.deferred.set(item.itemId, {
      item,
      firstDeferredSession: previous?.firstDeferredSession ?? world.sessionIndex,
      ...(offeredIds.has(item.itemId)
        ? { lastOfferedSession: world.sessionIndex }
        : previous?.lastOfferedSession !== undefined
          ? { lastOfferedSession: previous.lastOfferedSession }
          : {}),
    });
  }
}

export function countSimulationWorld(world: SimulationWorld): SimulationWorldCounts {
  const words = [...world.words.values()];
  return {
    introducedWords: world.introducedWords,
    activeMeaning: words.filter((word) => word.meaning.schedule.kind !== "none").length,
    activeListening: words.filter((word) => word.listening.schedule.kind !== "none").length,
    activeProduction: words.filter((word) => word.production.schedule.kind !== "none").length,
    activeUsage: words.flatMap((word) => word.usage)
      .filter(({ item }) => item.schedule.kind !== "none").length,
    placementConversions: world.placementConversions,
  };
}
