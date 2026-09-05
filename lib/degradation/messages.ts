export const AI_UNAVAILABLE_MESSAGE =
  "AI practice is unavailable right now. You can keep reviewing saved lessons and try again shortly.";

export const DATA_UNAVAILABLE_MESSAGE =
  "Saved progress is temporarily unavailable. Local practice may continue, and sync will retry when the connection recovers.";

export function isQuotaLikeError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("resource exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests")
  );
}

export const AI_QUOTA_EXHAUSTED_MESSAGE =
  "No se puede usar por ahora, por favor vuelve mañana o cuando tengas tokens de nuevo.";

export function publicAiErrorMessage(
  status?: number,
  message = "",
  fallback: string = AI_UNAVAILABLE_MESSAGE,
): string {
  if (status === 429 || isQuotaLikeError(message)) {
    return AI_QUOTA_EXHAUSTED_MESSAGE;
  }
  return fallback;
}

export function publicDataErrorMessage(): string {
  return DATA_UNAVAILABLE_MESSAGE;
}
