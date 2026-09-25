/**
 * Métricas por fonema de la puerta de decisión del plan 038, fase B.
 *
 * La métrica que manda es la **precisión de los errores marcados**: de lo que el
 * modelo señala como mal pronunciado, cuánto señaló también una persona. Es la
 * que protege a quien aprende de correcciones falsas, y por eso pesa más que el
 * recall. Node-only, para el benchmark; no se despliega en la app.
 */

/** Un fonema esperado, con el veredicto del modelo y el de la anotación humana. */
export interface PhonemeTrial {
  /** ARPAbet esperado, sin dígito de acento. */
  expected: string
  /** El modelo lo marcó como mal pronunciado (sustitución u omisión). */
  modelFlagged: boolean
  /** La anotación humana lo marcó como error. */
  humanFlagged: boolean
  /** El evaluador se abstuvo: no cuenta en ninguna métrica. */
  abstained: boolean
}

export interface PhonemeMetrics {
  /** De los marcados por el modelo, cuántos marcó también una persona. */
  flaggedPrecision: number
  /** De los bien pronunciados según la anotación, cuántos marcó el modelo. */
  falseAlarmRate: number
  /** De los errores humanos, cuántos detectó el modelo. */
  recall: number
  /** Errores humanos disponibles para medir; la puerta exige ≥ 30. */
  humanErrorCount: number
  /** Fonemas bien pronunciados según la anotación. */
  humanCorrectCount: number
  modelFlaggedCount: number
  abstentionRate: number
  trialCount: number
}

export interface PhonemeCtcBenchmark {
  overall: PhonemeMetrics
  byPhoneme: Record<string, PhonemeMetrics>
  /** Latencia de inferencia en CPU, ms. */
  latencyP50Ms: number | null
  latencyP95Ms: number | null
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

export function computePhonemeMetrics(trials: PhonemeTrial[]): PhonemeMetrics {
  const scored = trials.filter((t) => !t.abstained)
  const modelFlagged = scored.filter((t) => t.modelFlagged)
  const humanErrors = scored.filter((t) => t.humanFlagged)
  const humanCorrect = scored.filter((t) => !t.humanFlagged)

  return {
    flaggedPrecision: ratio(modelFlagged.filter((t) => t.humanFlagged).length, modelFlagged.length),
    falseAlarmRate: ratio(humanCorrect.filter((t) => t.modelFlagged).length, humanCorrect.length),
    recall: ratio(humanErrors.filter((t) => t.modelFlagged).length, humanErrors.length),
    humanErrorCount: humanErrors.length,
    humanCorrectCount: humanCorrect.length,
    modelFlaggedCount: modelFlagged.length,
    abstentionRate: ratio(trials.filter((t) => t.abstained).length, trials.length),
    trialCount: trials.length,
  }
}

/** Percentil por interpolación del más cercano, sobre una copia ordenada. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

export function computePhonemeCtcBenchmark(
  trials: PhonemeTrial[],
  latenciesMs: number[] = [],
): PhonemeCtcBenchmark {
  const byPhoneme: Record<string, PhonemeMetrics> = {}
  for (const phoneme of Array.from(new Set(trials.map((t) => t.expected))).sort()) {
    byPhoneme[phoneme] = computePhonemeMetrics(trials.filter((t) => t.expected === phoneme))
  }

  return {
    overall: computePhonemeMetrics(trials),
    byPhoneme,
    latencyP50Ms: percentile(latenciesMs, 50),
    latencyP95Ms: percentile(latenciesMs, 95),
  }
}
