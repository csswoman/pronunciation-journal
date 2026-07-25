import type {
  AcousticEvaluationInput,
  AcousticEvaluationResult,
  AcousticEvaluator,
  DimensionScore,
} from '@/lib/pronunciation/acoustic-evaluator'
import { extractFormants } from './formant-extraction'
import { classifyVowel, VOWEL_CENTROIDS } from './vowel-space'

/**
 * Extends the base input with the raw samples/rate this evaluator needs and
 * the target vowel it should score against. Not part of the shared
 * AcousticEvaluator contract — evaluator implementations may extend the
 * input shape they consume.
 */
export interface FormantEvaluationInput extends AcousticEvaluationInput {
  samples: Float32Array
  sampleRate: number
  /** IPA vowel symbol the learner was asked to produce. */
  targetVowel?: string
}

export const FORMANT_EVALUATOR_VERSION = 'formant-dsp-v1'

function abstainedScore(dimension: DimensionScore['dimension'], reason: string): DimensionScore {
  return { dimension, score: 0, confidence: 0, abstained: true, abstainReason: reason, evidenceSpans: [] }
}

/**
 * Free, browser-native acoustic evaluator for the v1 vowel-contrast set
 * (plan 071). Scores ONLY the `segmental` dimension, and only for vowels in
 * `VOWEL_CENTROIDS` — every other dimension/vowel abstains rather than
 * guessing. Not wired to production; see plan 071 gate.
 */
export class FormantVowelEvaluator implements AcousticEvaluator {
  async evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult> {
    const formantInput = input as FormantEvaluationInput
    const dimensionScores: DimensionScore[] = input.dimensions.map((dimension) => {
      if (dimension !== 'segmental') {
        return abstainedScore(dimension, 'dimension_out_of_scope')
      }

      const targetVowel = formantInput.targetVowel
      if (!targetVowel || !(targetVowel in VOWEL_CENTROIDS)) {
        return abstainedScore(dimension, 'vowel_out_of_scope')
      }

      const formants = extractFormants(formantInput.samples, formantInput.sampleRate)
      if (formants.abstained) {
        return abstainedScore(dimension, formants.abstainReason ?? 'low_snr')
      }

      const classification = classifyVowel(formants.f1Hz, formants.f2Hz)
      const matchedTarget = classification.vowel === targetVowel
      const score = matchedTarget
        ? Math.round(60 + classification.confidence * 40)
        : Math.round(classification.confidence * 30)

      return {
        dimension,
        score,
        confidence: classification.confidence,
        abstained: false,
        evidenceSpans: [{ startMs: 0, endMs: input.audio.durationMs, label: `formant:${classification.vowel}` }],
      }
    })

    const allAbstained = dimensionScores.every((d) => d.abstained)
    return {
      evaluatorKind: 'formant_dsp',
      evaluatorVersion: FORMANT_EVALUATOR_VERSION,
      dimensionScores,
      outcome: allAbstained ? 'unscored' : 'scored',
    }
  }
}
