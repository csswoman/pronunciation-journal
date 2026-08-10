import type { EssentialWordMode } from "./exercise-modes";
import { resolveListeningLadderMode } from "./listening-ladder";
import type { SkillRuntimeQueueItem } from "./runtime-adapter";
import type { EssentialWord } from "./types";

/** Applies the listening-only ladder after the session planner chose its step. */
export function resolveRenderedSkillMode(
  entry: EssentialWord,
  plannerMode: EssentialWordMode,
  item?: SkillRuntimeQueueItem,
): EssentialWordMode {
  if (!item) return plannerMode;
  if (item.plannedItem.skill !== "listening" || !item.listeningLadder) return item.forcedMode;
  return resolveListeningLadderMode(entry, item.listeningLadder.level)?.mode ?? item.forcedMode;
}
