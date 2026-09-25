/**
 * Anotaciones manuales de L2-ARCTIC tal como las publica una réplica en parquet
 * (subconjunto anotado, 16 kHz), normalizadas a `AnnotatedPhone`.
 *
 * Este módulo es lógica pura a propósito: quien lea el parquet inyecta las filas
 * (ver `scripts/run-phoneme-ctc-benchmark.mjs`). Así el arnés se testea sin
 * instalar el lector de parquet ni la librería de inferencia, que se quitaron
 * del repo tras la pasada del 2026-09-25. Ver `decision-phoneme-ctc.md`.
 *
 * Alternativa al cargador de TextGrid (`l2arctic-loader.ts`), que sirve para la
 * distribución oficial en carpetas. Ambos producen los mismos `AnnotatedPhone`.
 *
 * El corpus **nunca** entra en el repo. CC BY-NC 4.0: uso no comercial con
 * atribución al paper de Zhao et al. (2018).
 */
import type { AnnotatedPhone, PhoneErrorKind } from './l2arctic-loader'

/** Un intervalo del tier de anotación manual, como lo trae el parquet. */
export interface ManualEvent {
  canonical_phoneme: string | null
  perceived_phoneme: string | null
  perceived_raw: string | null
  error_type: string
  /** Segundos desde el inicio del enunciado. */
  start: number
  end: number
}

export interface ManualUtterance {
  speakerId: string
  nativeLanguage: string
  utteranceId: string
  transcript: string
  durationSec: number
  /** Audio en bytes crudos, listo para decodificar. */
  audioBytes: Uint8Array
  phones: AnnotatedPhone[]
}

/** Etiquetas de no-habla: silencio, pausa y ruido. No son fonemas que juzgar. */
const NON_SPEECH = new Set(['SIL', 'SP', 'SPN', ''])

function speechPhoneme(symbol: string | null): string | null {
  if (!symbol) return null
  return NON_SPEECH.has(symbol.toUpperCase()) ? null : symbol
}

function toErrorKind(errorType: string): PhoneErrorKind | null {
  if (errorType === 'substitution') return 'substitution'
  if (errorType === 'deletion') return 'deletion'
  if (errorType === 'addition') return 'addition'
  return null
}

/** Un intervalo anotado → fonema. Null si es no-habla sin error que registrar. */
export function toAnnotatedPhone(event: ManualEvent): AnnotatedPhone | null {
  const error = toErrorKind(event.error_type)
  const canonical = speechPhoneme(event.canonical_phoneme)
  const perceived = speechPhoneme(event.perceived_phoneme)

  if (!canonical && !perceived && error === null) return null

  return {
    canonical,
    perceived,
    error,
    // La réplica ya normaliza: un `err` del anotador deja el percibido en null.
    perceivedUncertain: error !== null && !perceived && error !== 'deletion',
    deviation: (event.perceived_raw ?? '').includes('*'),
    startMs: Math.round(event.start * 1000),
    endMs: Math.round(event.end * 1000),
  }
}

/** Los intervalos de un enunciado → fonemas anotados, sin los de no-habla. */
export function mapManualEvents(events: readonly ManualEvent[]): AnnotatedPhone[] {
  return events.map(toAnnotatedPhone).filter((p): p is AnnotatedPhone => p !== null)
}
