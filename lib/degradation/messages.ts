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

export function publicAiErrorMessage(status?: number, message = ""): string {
  if (status === 429 || isQuotaLikeError(message)) {
    return "AI usage is temporarily limited. Try again after a short break.";
  }
  return AI_UNAVAILABLE_MESSAGE;
}
