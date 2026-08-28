/**
 * Techo del ajuste. Existe para que un mal día de micrófono no pueda
 * secuestrar la cola de repasos: la señal empuja, nunca decide.
 */
export const MAX_PRIORITY_BOOST = 0.25

/** Interruptor de apagado. Si algo va mal, esto lo desactiva sin tocar el motor. */
export const SPOKEN_SIGNAL_ENABLED = true

interface SpokenEvidence {
  spokenFailures: number
  spokenAttempts: number
}

/**
 * Traduce fallos hablados en un empujón acotado de prioridad de repaso.
 *
 * Deliberadamente NO reescribe el scheduling SM-2: devuelve un número
 * pequeño que el consumidor suma, de modo que desactivarlo restaura el
 * comportamiento anterior exactamente.
 */
export function computePriorityBoost(evidence: SpokenEvidence): number {
  if (!SPOKEN_SIGNAL_ENABLED) return 0
  if (evidence.spokenAttempts <= 0 || evidence.spokenFailures <= 0) return 0

  const failureRate = Math.min(1, evidence.spokenFailures / evidence.spokenAttempts)
  return Math.min(MAX_PRIORITY_BOOST, failureRate * MAX_PRIORITY_BOOST)
}
