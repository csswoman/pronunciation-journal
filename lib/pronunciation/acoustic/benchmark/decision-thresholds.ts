/**
 * Ship/no-ship thresholds for plan 071, fixed BEFORE running the benchmark
 * against real corpus data (spec section "Umbrales de decisión"). Changing
 * this value after seeing results defeats the point — any change here
 * should be its own reviewable commit with a stated reason, not a drive-by
 * edit alongside a benchmark run.
 */
export const SHIP_AGREEMENT_THRESHOLD = 0.85

export type ContrastVerdict = 'ship' | 'no_ship'

export function decideVowelContrastVerdict(agreementRate: number): ContrastVerdict {
  return agreementRate >= SHIP_AGREEMENT_THRESHOLD ? 'ship' : 'no_ship'
}

// ── Plan 038, fase B: CTC de fonemas en el dispositivo ──────────────────────
//
// Pre-registro. Estos números se fijan ANTES de descargar L2-ARCTIC y de correr
// una sola inferencia. Se priorizan la precisión y la falsa alarma sobre el
// recall a propósito: una corrección falsa le enseña algo incorrecto a quien
// aprende, mientras que un error no detectado solo deja de ayudar.

/** De los fonemas que el modelo marca como mal pronunciados, cuántos marcó también una persona. */
export const PHONEME_CTC_MIN_FLAGGED_PRECISION = 0.8

/** Fonemas bien pronunciados según la anotación que el modelo marca como error. */
export const PHONEME_CTC_MAX_FALSE_ALARM_RATE = 0.05

/** Errores humanos anotados necesarios para que un fonema sea medible. */
export const PHONEME_CTC_MIN_HUMAN_ERRORS = 30

/** Fonemas que deben pasar para que el plan avance a la fase C. */
export const PHONEME_CTC_MIN_PASSING_PHONEMES = 4

/** Latencia p95 admisible para una frase de 5 palabras, en CPU. */
export const PHONEME_CTC_MAX_P95_LATENCY_MS = 3000

export type PhonemeGateVerdict = 'pass' | 'fail' | 'not_measurable'

/**
 * Veredicto de un fonema. `not_measurable` no es un fallo: significa que el
 * subconjunto anotado no trae suficientes errores de ese fonema, y un fonema no
 * medible nunca puede mostrarse en la UI.
 */
export function decidePhonemeGate(metrics: {
  flaggedPrecision: number
  falseAlarmRate: number
  humanErrorCount: number
}): PhonemeGateVerdict {
  if (metrics.humanErrorCount < PHONEME_CTC_MIN_HUMAN_ERRORS) return 'not_measurable'
  const precise = metrics.flaggedPrecision >= PHONEME_CTC_MIN_FLAGGED_PRECISION
  const quiet = metrics.falseAlarmRate <= PHONEME_CTC_MAX_FALSE_ALARM_RATE
  return precise && quiet ? 'pass' : 'fail'
}

/** True si el plan puede abrir la fase C: fonemas suficientes y latencia aceptable. */
export function phaseCUnlocked(
  verdicts: Record<string, PhonemeGateVerdict>,
  latencyP95Ms: number | null,
): boolean {
  const passing = Object.values(verdicts).filter((v) => v === 'pass').length
  if (passing < PHONEME_CTC_MIN_PASSING_PHONEMES) return false
  // Sin medición de latencia no hay permiso: la ausencia de dato no es un pase.
  return latencyP95Ms !== null && latencyP95Ms <= PHONEME_CTC_MAX_P95_LATENCY_MS
}
