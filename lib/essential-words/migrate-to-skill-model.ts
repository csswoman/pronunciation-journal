// Migración SRSData -> LearningItem (spec 1.12). Pura e idempotente: devuelve
// solo los ítems que faltan y nunca modifica el origen legacy.

import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import type { SRSData } from "@/lib/types";
import { learningItemId } from "./skill-item";
import type {
  BaseSkill,
  ItemSchedule,
  LearningItem,
} from "./verification/types";

const BASE_SKILLS: readonly BaseSkill[] = ["meaning", "listening", "production"];
const ESSENTIAL_PREFIX = "c1k:";

/** Preserve native FSRS fields; derive only the fields absent from SM-2 rows. */
function scheduleFromSrsData(source: SRSData, now: Date): ItemSchedule {
  if (
    source.stability !== undefined
    && source.difficulty !== undefined
    && source.state !== undefined
  ) {
    return {
      kind: "fsrs",
      dueAt: source.nextReview,
      stability: source.stability,
      difficulty: source.difficulty,
      state: source.state,
    };
  }

  const derived = deriveFsrsState(source, now);
  return {
    kind: "fsrs",
    dueAt: source.nextReview,
    stability: derived.stability,
    difficulty: derived.difficulty,
    state: source.repetitions > 0 ? "Review" : "New",
  };
}

/**
 * Plans only missing rows. Meaning inherits legacy scheduling; listening and
 * production start unseen because the old card contains no evidence for them.
 */
export function planSkillModelMigration(
  srsEntries: SRSData[],
  existing: LearningItem[],
  now: Date,
): LearningItem[] {
  const present = new Set(existing.map((item) => item.id));
  const created: LearningItem[] = [];

  for (const source of srsEntries) {
    if (!source.wordId.startsWith(ESSENTIAL_PREFIX)) continue;

    for (const skill of BASE_SKILLS) {
      const id = learningItemId(source.wordId, skill);
      if (present.has(id)) continue;

      const isMeaning = skill === "meaning";
      created.push({
        id,
        wordId: source.wordId,
        skill,
        contentOrigin: "authored",
        schedule: isMeaning ? scheduleFromSrsData(source, now) : { kind: "none" },
        ...(isMeaning && source.lastReview ? { lastReview: source.lastReview } : {}),
        repetitions: isMeaning ? source.repetitions : 0,
        lapses: 0,
        suspended: false,
      });
      present.add(id);
    }
  }

  return created;
}
