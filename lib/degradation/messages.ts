export const AI_UNAVAILABLE_MESSAGE =
  "La función de IA no está disponible ahora mismo. Suele ser algo puntual: inténtalo de nuevo en un momento.";

export const AI_COACH_TURN_FAILED_MESSAGE =
  "El coach no pudo preparar tu práctica esta vez. Suele ser algo puntual de la conexión o del servicio: vuelve a intentarlo.";

/**
 * The turn hit the output budget before the model produced anything renderable
 * (it can spend the whole allowance on a tool call plus reasoning). Distinct
 * from a connection failure: retrying is worth it, and a shorter question helps.
 */
export const AI_COACH_TURN_TRUNCATED_MESSAGE =
  "La respuesta del coach se cortó antes de completarse. Vuelve a intentarlo; si se repite, prueba con un mensaje más corto.";

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

/**
 * The provider itself is out of capacity for now (RESOURCE_EXHAUSTED after the
 * whole model fallback chain). Distinct from AI_COACH_RATE_LIMITED_MESSAGE,
 * which is our own short per-user throttle.
 */
export const AI_QUOTA_EXHAUSTED_MESSAGE =
  "El coach no está disponible por ahora. Tu conversación está guardada; vuelve a intentarlo más tarde.";

/**
 * Our own layered rate limiter (a short per-user window) rejected the turn.
 * It clears in well under a minute, the conversation is untouched, and the
 * right move is simply to wait a few seconds and retry — never "start over".
 */
export const AI_COACH_RATE_LIMITED_MESSAGE =
  "Enviaste varios mensajes muy seguidos. Espera unos segundos y vuelve a intentarlo — tu conversación sigue aquí.";

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
