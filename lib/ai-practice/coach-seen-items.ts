import { db, type CoachSeenItemRecord } from "@/lib/db";
import type { ToolCall } from "./types";
import { isExerciseTool } from "./tools/registry";

const MAX_RECENT_STEMS = 20;
const MAX_STEM_LENGTH = 80;

export function normalizeCoachStem(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase().slice(0, MAX_STEM_LENGTH);
}

export function stemFromToolCall(call: ToolCall): string | null {
  if (!isExerciseTool(call.name as never) || call.name === "render_session_summary") return null;
  const args = call.args as Record<string, unknown>;
  const candidate = [args.question, args.sentence, args.prompt, args.word]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return candidate ? normalizeCoachStem(candidate) : null;
}

export async function saveCoachSeenItems(userId: string, calls: Iterable<ToolCall>): Promise<void> {
  const seenAt = new Date().toISOString();
  const rows: CoachSeenItemRecord[] = [];
  for (const call of calls) {
    const stem = stemFromToolCall(call);
    if (!stem) continue;
    const args = call.args as Record<string, unknown>;
    rows.push({
      id: `${userId}:${stem}`,
      userId,
      topic: typeof args.topic === "string" ? args.topic : "unknown",
      stem,
      seenAt,
    });
  }
  if (rows.length > 0) await db.coachSeenItems.bulkPut(rows);
}

export async function getRecentCoachStems(userId: string): Promise<string[]> {
  const rows = await db.coachSeenItems.where("userId").equals(userId).reverse().sortBy("seenAt");
  return rows.slice(0, MAX_RECENT_STEMS).map((row) => row.stem.slice(0, MAX_STEM_LENGTH));
}
