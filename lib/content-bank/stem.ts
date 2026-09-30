import { normalizeCoachStem } from "@/lib/ai-practice/coach-seen-items";

export function extractStemFromPayload(payload: Record<string, unknown>): string | null {
  const candidate = [payload.question, payload.sentence, payload.prompt, payload.word]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return candidate ? normalizeCoachStem(candidate) : null;
}
