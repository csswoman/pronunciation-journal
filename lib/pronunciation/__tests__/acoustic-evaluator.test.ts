import { describe, it, expect } from 'vitest'
import {
  scoreWithEvaluator,
  type AcousticEvaluator,
  type AcousticEvaluationInput,
  type AcousticEvaluationResult,
} from '../acoustic-evaluator'

function makeInput(overrides: Partial<AcousticEvaluationInput> = {}): AcousticEvaluationInput {
  return {
    audio: { uri: 'mem://fake-clip', durationMs: 1200 },
    targetText: 'hello world',
    transcript: 'hello world',
    dimensions: ['segmental', 'wordStress'],
    ...overrides,
  }
}

/** Fake standing in for a forced-alignment based evaluator (ADR 064 Candidate 1). */
class FakeForcedAlignerEvaluator implements AcousticEvaluator {
  async evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult> {
    return {
      evaluatorKind: 'forced_alignment',
      evaluatorVersion: 'fake-aligner-v1',
      outcome: 'scored',
      dimensionScores: input.dimensions.map((dimension) => ({
        dimension,
        score: 82,
        confidence: 0.9,
        abstained: false,
        evidenceSpans: [{ startMs: 0, endMs: input.audio.durationMs, label: dimension }],
      })),
    }
  }
}

/** Fake standing in for a vendor API evaluator (ADR 064 Candidate 2). */
class FakeVendorEvaluator implements AcousticEvaluator {
  async evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult> {
    return {
      evaluatorKind: 'vendor_api',
      evaluatorVersion: 'fake-vendor-v1',
      outcome: 'scored',
      dimensionScores: input.dimensions.map((dimension) => ({
        dimension,
        score: 91,
        confidence: 0.75,
        abstained: false,
        evidenceSpans: [{ startMs: 0, endMs: input.audio.durationMs, label: dimension }],
      })),
    }
  }
}

/** Fake that always abstains, e.g. because SNR is too low (ADR 064 Step 2 abstention rules). */
class FakeAbstainingEvaluator implements AcousticEvaluator {
  async evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult> {
    return {
      evaluatorKind: 'forced_alignment',
      evaluatorVersion: 'fake-aligner-v1',
      outcome: 'failed',
      dimensionScores: input.dimensions.map((dimension) => ({
        dimension,
        score: 0,
        confidence: 0,
        abstained: true,
        abstainReason: 'low_snr',
        evidenceSpans: [],
      })),
    }
  }
}

describe.each([
  ['forced alignment fake', new FakeForcedAlignerEvaluator()],
  ['vendor API fake', new FakeVendorEvaluator()],
])('scoreWithEvaluator swapped across implementations (%s)', (_name, evaluator) => {
  it('returns a dimension score per requested dimension', async () => {
    const result = await scoreWithEvaluator(evaluator, makeInput())

    expect(result.dimensionScores).toHaveLength(2)
    expect(result.dimensionScores.map((d) => d.dimension)).toEqual(['segmental', 'wordStress'])
  })

  it('never returns a single opaque aggregate score — every result is dimension-scoped', async () => {
    const result = await scoreWithEvaluator(evaluator, makeInput())

    expect(result).not.toHaveProperty('score')
    expect(result).not.toHaveProperty('overallScore')
    for (const d of result.dimensionScores) {
      expect(typeof d.score).toBe('number')
      expect(typeof d.confidence).toBe('number')
      expect(Array.isArray(d.evidenceSpans)).toBe(true)
    }
  })

  it('tags the result with an evaluator version', async () => {
    const result = await scoreWithEvaluator(evaluator, makeInput())
    expect(result.evaluatorVersion).toBeTruthy()
  })
})

describe('scoreWithEvaluator abstention handling', () => {
  it('propagates abstained=true with a reason and no evidence, regardless of implementation', async () => {
    const result = await scoreWithEvaluator(new FakeAbstainingEvaluator(), makeInput())

    for (const d of result.dimensionScores) {
      expect(d.abstained).toBe(true)
      expect(d.abstainReason).toBe('low_snr')
      expect(d.evidenceSpans).toHaveLength(0)
    }
  })
})

describe('scoreWithEvaluator transcript is auxiliary, not ground truth', () => {
  it('evaluators are not required to match transcript to target text to score dimensions', async () => {
    const input = makeInput({ transcript: 'completely different words' })
    const result = await scoreWithEvaluator(new FakeForcedAlignerEvaluator(), input)

    expect(result.outcome).toBe('scored')
    expect(result.dimensionScores.every((d) => !d.abstained)).toBe(true)
  })
})
