export const AI_UNAVAILABLE_MESSAGE =
  "La función de IA no está disponible ahora mismo. Suele ser algo puntual: inténtalo de nuevo en un momento.";

export const AI_COACH_TURN_FAILED_MESSAGE =
  "El coach no pudo preparar tu práctica esta vez. Suele ser algo puntual de la conexión o del servicio: vuelve a intentarlo.";

export const AI_SESSION_REQUIRED_MESSAGE =
  "No pudimos validar tu sesión. Recarga la página e inicia sesión para usar el coach.";

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
  if (status === 401) {
    return AI_SESSION_REQUIRED_MESSAGE;
  }
  if (status === 429 || isQuotaLikeError(message)) {
    return AI_QUOTA_EXHAUSTED_MESSAGE;
  }
  return fallback;
}

export function publicDataErrorMessage(): string {
  return DATA_UNAVAILABLE_MESSAGE;
}
