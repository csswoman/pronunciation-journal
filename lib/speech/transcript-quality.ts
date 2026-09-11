/**
 * Compuerta de honestidad para transcripciones.
 *
 * El reconocedor devuelve un valor de confianza que hasta ahora se capturaba y
 * se descartaba: una transcripción adivinada con 0.2 de confianza producía la
 * misma nota que una reconocida con 0.95. Cuando el reconocedor se equivoca,
 * el alumno recibe un fallo de pronunciación que no cometió.
 *
 * Misma disciplina que `scoring-guards.ts`: ante evidencia insuficiente se
 * abstiene, nunca inventa un 0 % ni un 100 %.
 */

import type { SpeechInputResult } from './types'

/**
 * Por debajo de esta confianza el reconocedor está adivinando más que
 * reconociendo, así que su texto no es evidencia de cómo pronunció el alumno.
 */
export const MIN_SCORABLE_CONFIDENCE = 0.5

export type TranscriptAbstentionReason = 'empty_transcript' | 'low_confidence'

/** Fuente de la transcripción; determina qué garantías ofrece. */
export type TranscriptSource = SpeechInputResult['source']

export interface TranscriptAttempt {
  transcript: string
  /** Ausente en Gemini, que devuelve sólo texto. */
  confidence?: number
  source: TranscriptSource
}

/**
 * Gemini transcribe sin reportar confianza. Tratar esa ausencia como cero
 * haría abstenerse a todos los navegadores que usan la reserva, así que sólo
 * aplicamos el umbral cuando hay un valor real que comparar.
 */
export function transcriptAbstentionReason(
  attempt: TranscriptAttempt
): TranscriptAbstentionReason | null {
  if (!attempt.transcript.trim()) return 'empty_transcript'

  if (typeof attempt.confidence === 'number' && attempt.confidence < MIN_SCORABLE_CONFIDENCE) {
    return 'low_confidence'
  }

  return null
}

/** True cuando la transcripción es evidencia suficiente para puntuar. */
export function isTranscriptScorable(attempt: TranscriptAttempt): boolean {
  return transcriptAbstentionReason(attempt) === null
}
