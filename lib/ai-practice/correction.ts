import type { ToolCall } from "./types";
import type { AnnotateTurnArgs, TurnConcept, TurnCorrection, TurnSaveable } from "./tools/registry";
import type { ErrorPatternId } from "@/lib/exercises/error-patterns";

/**
 * Pulls the correction out of a model turn's annotate_turn call.
 *
 * This is the primary path. `lib/ai-coach/parse-correction.ts` stays as a
 * fallback for turns where the model wrote the correction into its prose
 * instead of calling the tool.
 */
export function extractTurnCorrection(
  toolCalls: Map<string, ToolCall>,
): TurnCorrection | null {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.correction) return args.correction;
  }
  return null;
}

/** Companion to extractTurnCorrection: the items the coach offered to save. */
export function extractTurnSaveables(
  toolCalls: Map<string, ToolCall>,
): TurnSaveable[] {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.saveables?.length) return args.saveables;
  }
  return [];
}

/** Companion to extractTurnConcept: the concept the coach flagged as worth keeping. */
export function extractTurnConcept(
  toolCalls: Map<string, ToolCall>,
): TurnConcept | null {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.concept) return args.concept;
  }
  return null;
}

/**
 * Returns the errorPattern from a correction if it should be registered in the
 * error-recurrence queue. Returns undefined when:
 * - correction is null or kind is not "error"
 * - errorPattern is absent (model didn't tag it)
 * - the pattern was already recorded this session (alreadyRecorded)
 *
 * Callers own the `alreadyRecorded` set and must add the returned id to it.
 */
export function pickCorrectionToRecord(
  correction: TurnCorrection | null,
  alreadyRecorded: Set<ErrorPatternId>,
): ErrorPatternId | undefined {
  if (!correction || correction.kind !== "error") return undefined;
  const { errorPattern } = correction;
  if (!errorPattern || alreadyRecorded.has(errorPattern)) return undefined;
  return errorPattern;
}
