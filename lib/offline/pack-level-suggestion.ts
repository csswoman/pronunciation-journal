/**
 * Which CEFR pack the offline hub should suggest (Plan 057, Step 5). Pure so
 * the three product rules are testable without React:
 *  - canonical level known → suggest that level's pack;
 *  - level `unknown` or the read failed → ask the learner to pick, never
 *    silently fall back to A1;
 *  - C2 → suggest C1, labelled as the highest pack available (no C2 pack).
 */

import type { LearnerLevelResolution } from "@/lib/learner-level/core";
import type { CefrLevel } from "@/lib/essential-words/types";
import { OFFLINE_PACK_LEVELS } from "./pack-types";

export type PackLevelSuggestion =
  | { kind: "loading" }
  | { kind: "unknown" }
  | { kind: "suggested"; level: CefrLevel; note: string | null };

export const C2_PACK_NOTE = "Tu nivel es C2; el paquete más alto disponible es C1";

export function suggestPackLevel(
  resolution: LearnerLevelResolution | null,
  loading: boolean,
): PackLevelSuggestion {
  if (loading) return { kind: "loading" };
  if (!resolution || resolution.source === "unknown") return { kind: "unknown" };
  if (resolution.level === "C2") return { kind: "suggested", level: "C1", note: C2_PACK_NOTE };
  const level = resolution.level as CefrLevel;
  if (!OFFLINE_PACK_LEVELS.includes(level)) return { kind: "unknown" };
  return { kind: "suggested", level, note: null };
}

/** "3,2 MB" — sizes shown before downloading. */
export function formatPackBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
}
