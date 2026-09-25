/**
 * Alineación de los fonemas que reconoce un modelo CTC contra los esperados.
 *
 * NO ESTÁ CONECTADO A PRODUCCIÓN. Es el andamiaje de la fase B del plan 038: la
 * puerta de decisión (precisión ≥ 0,80 y falsa alarma ≤ 5% por fonema) no se ha
 * medido porque L2-ARCTIC exige que la dueña acepte la licencia. Hasta entonces
 * ninguna superficie puede mostrar un veredicto por sonido; ver
 * `docs/architecture/adr-064-acoustic-pronunciation-assessment.md`.
 *
 * La inferencia se inyecta (`RecognizedPhoneme[]`): este módulo es aritmética
 * pura y se testea con salida simulada, sin descargar 197 MB de modelo.
 */
import { arpabetCandidates, bareArpabet, satisfies } from './phoneme-arpabet-folding'

/** Un fonema reconocido por el modelo, con su tramo temporal. */
export interface RecognizedPhoneme {
  /** Símbolo tal como lo emite el modelo (espeak/IPA). */
  ipa: string
  startMs: number
  endMs: number
  /** Probabilidad posterior media del tramo, 0-1. */
  confidence: number
}

export type PhonemeVerdict = 'match' | 'substitution' | 'deletion'

export interface PhonemeAssessment {
  /** ARPAbet esperado, sin dígito de acento. */
  expected: string
  verdict: PhonemeVerdict
  /** Token reconocido en esa posición; null en una omisión. */
  gotIpa: string | null
  /** Confianza del tramo, o null si no hubo tramo. */
  confidence: number | null
  startMs: number | null
  endMs: number | null
  /**
   * True cuando el evaluador se abstiene: el token cae fuera del inventario del
   * inglés, así que no se sabe si es un error o ruido del modelo multilingüe.
   * Un fonema con `abstained` no cuenta ni como acierto ni como error.
   */
  abstained: boolean
}

export interface PhonemeCtcAssessment {
  evaluatorKind: 'phoneme_ctc'
  evaluatorVersion: string
  phonemes: PhonemeAssessment[]
  /** Reconocidos que no corresponden a ningún esperado (epéntesis, "e-school"). */
  additions: RecognizedPhoneme[]
}

type Op = 'match' | 'sub' | 'del' | 'ins'

/** Coste de edición: un match no cuesta nada, todo lo demás cuesta 1. */
function buildCostTable(expected: string[], recognized: RecognizedPhoneme[]): number[][] {
  const dp: number[][] = Array.from({ length: expected.length + 1 }, () =>
    Array<number>(recognized.length + 1).fill(0),
  )
  for (let i = 0; i <= expected.length; i++) dp[i][0] = i
  for (let j = 0; j <= recognized.length; j++) dp[0][j] = j

  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= recognized.length; j++) {
      const hit = satisfies(recognized[j - 1].ipa, expected[i - 1])
      dp[i][j] = hit
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp
}

interface Step {
  op: Op
  expectedIndex: number
  recognizedIndex: number
}

/** Reconstruye la alineación desde la tabla de costes, de atrás hacia delante. */
function backtrack(
  dp: number[][],
  expected: string[],
  recognized: RecognizedPhoneme[],
): Step[] {
  const steps: Step[] = []
  let i = expected.length
  let j = recognized.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && satisfies(recognized[j - 1].ipa, expected[i - 1])) {
      steps.unshift({ op: 'match', expectedIndex: i - 1, recognizedIndex: j - 1 })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      steps.unshift({ op: 'sub', expectedIndex: i - 1, recognizedIndex: j - 1 })
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      steps.unshift({ op: 'del', expectedIndex: i - 1, recognizedIndex: -1 })
      i--
    } else {
      steps.unshift({ op: 'ins', expectedIndex: -1, recognizedIndex: j - 1 })
      j--
    }
  }
  return steps
}

/**
 * Alinea los fonemas reconocidos con los esperados y clasifica cada esperado.
 *
 * @param expectedArpabet Secuencia esperada en ARPAbet (CMUdict en producción;
 *   las etiquetas canónicas de la anotación en el benchmark). Los dígitos de
 *   acento se ignoran.
 */
export function assessRecognizedPhonemes(
  expectedArpabet: string[],
  recognized: RecognizedPhoneme[],
  evaluatorVersion: string,
): PhonemeCtcAssessment {
  const expected = expectedArpabet.map(bareArpabet).filter(Boolean)
  const dp = buildCostTable(expected, recognized)
  const steps = backtrack(dp, expected, recognized)

  const phonemes: PhonemeAssessment[] = []
  const additions: RecognizedPhoneme[] = []

  for (const step of steps) {
    if (step.op === 'ins') {
      additions.push(recognized[step.recognizedIndex])
      continue
    }

    if (step.op === 'del') {
      phonemes.push({
        expected: expected[step.expectedIndex],
        verdict: 'deletion',
        gotIpa: null,
        confidence: null,
        startMs: null,
        endMs: null,
        abstained: false,
      })
      continue
    }

    const got = recognized[step.recognizedIndex]
    // Token de otra lengua del modelo multilingüe: no se sabe qué pasó.
    const outOfInventory = arpabetCandidates(got.ipa).length === 0
    phonemes.push({
      expected: expected[step.expectedIndex],
      verdict: step.op === 'match' ? 'match' : 'substitution',
      gotIpa: got.ipa,
      confidence: got.confidence,
      startMs: got.startMs,
      endMs: got.endMs,
      abstained: step.op === 'sub' && outOfInventory,
    })
  }

  return { evaluatorKind: 'phoneme_ctc', evaluatorVersion, phonemes, additions }
}
