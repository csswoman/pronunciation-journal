import type { ExecutionContext } from "../execution-context";
import type { PlannedItem } from "../planning-types";
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
}

export interface SimulationOptions {
  days: number;
  corpusSize: number;
  seed: number;
  startAt: string;
  dailyBudgetSeconds: number;
  targetNewWords: number;
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
