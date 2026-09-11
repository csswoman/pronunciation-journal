"use client";

/**
 * Tipos y utilidades del reconocedor nativo del navegador (Web Speech).
 *
 * Separado del hook para que éste orqueste captura, grabación y reserva sin
 * cargar además la superficie de la API del navegador.
 */

interface SpeechRecognitionResultLike {
  transcript: string
  confidence: number
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance
}

/**
 * Errores que significan "este navegador nunca podrá usar Web Speech": Brave,
 * Edge, Arc y Opera reportan UA de Chrome pero no traen la clave del servidor
 * de voz de Google, así que todo intento muere con 'network' aunque haya red.
 * Ante ellos transcribimos el audio ya grabado con Gemini en lugar de dejar al
 * usuario con un fallo sin salida.
 */
/**
 * Errores que significan "este navegador nunca podrá usar Web Speech": Brave,
 * Edge, Arc y Opera reportan UA de Chrome pero no traen la clave del servidor
 * de voz de Google, así que todo intento muere con 'network' aunque haya red.
 * Ante ellos transcribimos el audio ya grabado con Gemini en lugar de dejar al
 * usuario con un fallo sin salida.
 */
export const WEB_SPEECH_UNUSABLE_ERRORS = new Set(['network', 'service-not-allowed'])

export type { SpeechRecognitionInstance, SpeechRecognitionEventLike }

/** Constructor del reconocedor nativo, si el navegador lo expone. */
export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/** Alternativa con mayor confianza de un resultado de reconocimiento. */
export function bestAlternative(
  event: SpeechRecognitionEventLike
): SpeechRecognitionResultLike {
  let best = event.results[0][0]
  for (let i = 1; i < event.results[0].length; i++) {
    const candidate = event.results[0][i]
    if (candidate.confidence > best.confidence) best = candidate
  }
  return best
}
