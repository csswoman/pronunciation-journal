import type { ToolCall } from "./types";
import type { AnnotateTurnArgs, TurnCorrection } from "./tools/registry";

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
