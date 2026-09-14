/**
 * Una vocal de apoyo añade una sílaba y suele alargar la emisión. Esta señal
 * sólo sirve para sugerir articulación: nunca convierte un acierto en fallo.
 */
export const EPENTHESIS_DURATION_RATIO = 1.4

export function detectSuspectedEpenthesis(
  userDurationMs: number,
  modelDurationMs: number,
): boolean {
  if (!Number.isFinite(userDurationMs) || !Number.isFinite(modelDurationMs)) return false
  if (userDurationMs <= 0 || modelDurationMs <= 0) return false
  return userDurationMs > modelDurationMs * EPENTHESIS_DURATION_RATIO
}
