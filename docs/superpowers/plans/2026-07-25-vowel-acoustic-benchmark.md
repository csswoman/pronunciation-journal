# Plan 071 — Benchmark de evaluador acústico de vocales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate a free, browser-native (Web Audio API) acoustic evaluator for
English vowel contrasts, benchmarked against the licensed `speechocean762` corpus, producing
an honest ship/partial-ship/no-ship decision — and, only if ship, wiring the approved
contrasts into the plan-067 scoring gate.

**Architecture:** Pure DSP (`formant-extraction.ts`) extracts F1/F2 formants from PCM
samples. A pure `formant-evaluator.ts` implements the existing `AcousticEvaluator` interface,
classifying a target vowel from those formants and abstaining on bad audio. A benchmark
harness (`acoustic/benchmark/`, not deployed) runs the evaluator over a vowel subset of
speechocean762, compares against expert labels, and writes a `decision.md` verdict. Only if
the verdict is ship/partial-ship does a final task touch
`lib/pronunciation/targets/types.ts` and `scoring-guards.ts` to release specific vowel
contrasts from the `acoustic` abstention gate.

**Tech Stack:** TypeScript, Web Audio API (`AudioBuffer`/PCM `Float32Array` processing, no
DOM/browser APIs needed for the pure DSP — testable in Node/Vitest), Vitest, existing
`AcousticEvaluator` contract from `lib/pronunciation/acoustic-evaluator.ts`.

---

## Before you start

This plan touches an existing discriminated union (`AcousticEvaluator['evaluatorKind']`,
currently `'forced_alignment' | 'vendor_api'`). Task 1 extends it with `'formant_dsp'`. If
you're executing this out of order, do Task 1 first — everything else depends on that type
existing.

The corpus (`speechocean762`) is **not in this repo** — the human partner downloaded it to
`D:\proyectos\speechocean762` (Task 6, done). It turned out to be a read-aloud sentence
corpus with no per-word timestamps (only 6 of 5000 utterances are single words), which
invalidated the original Task 6 design of manually clipping vowel segments. Task 6b adds a
proportional phoneme-count word-window heuristic (not a forced aligner) to estimate word
spans inside multi-word utterances instead. Tasks 1-5, 7-9 build and unit-test the
DSP/evaluator/harness against synthetic fixtures so they're fully verifiable without the real
corpus. Task 10 (run benchmark, write decision) can only run for real after Task 6b is
implemented. Task 11 (gate release) is conditional on Task 10's verdict — see its "Decision
branch" note, and note the mandatory segmentation caveat in the `decision.md` template.

---

## Task 1: Extend `AcousticEvaluator` for the formant-DSP evaluator kind

**Files:**
- Modify: `lib/pronunciation/acoustic-evaluator.ts:57-63`

- [ ] **Step 1: Widen the `evaluatorKind` union**

In `lib/pronunciation/acoustic-evaluator.ts`, change:

```ts
export interface AcousticEvaluationResult {
  /** Discriminated union member — mirrors `SpokenAttempt.scoreKind`'s pattern so new evaluator families can be added without breaking switches on this field. */
  evaluatorKind: 'forced_alignment' | 'vendor_api'
  evaluatorVersion: string
  dimensionScores: DimensionScore[]
  /** Overall outcome classification, reusing the same vocabulary as SpokenAttempt. */
  outcome: SpokenAttemptOutcome
}
```

to:

```ts
export interface AcousticEvaluationResult {
  /** Discriminated union member — mirrors `SpokenAttempt.scoreKind`'s pattern so new evaluator families can be added without breaking switches on this field. */
  evaluatorKind: 'forced_alignment' | 'vendor_api' | 'formant_dsp'
  evaluatorVersion: string
  dimensionScores: DimensionScore[]
  /** Overall outcome classification, reusing the same vocabulary as SpokenAttempt. */
  outcome: SpokenAttemptOutcome
}
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `pnpm exec vitest run lib/pronunciation/__tests__/acoustic-evaluator.test.ts`
Expected: PASS (widening a union is backward compatible with the existing fakes).

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/pronunciation/acoustic-evaluator.ts
git commit -m "feat(pronunciation): add formant_dsp evaluator kind to AcousticEvaluator"
```

---

## Task 2: Formant extraction — synthetic-signal test first

**Files:**
- Create: `lib/pronunciation/acoustic/formant-extraction.ts`
- Test: `lib/pronunciation/acoustic/__tests__/formant-extraction.test.ts`

Approach: LPC (linear predictive coding) via Levinson-Durbin recursion on a Hamming-windowed
frame, then polynomial root-finding on the LPC coefficients to get formant frequencies. This
is the standard free/offline formant-estimation method — no external service, pure math.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/__tests__/formant-extraction.test.ts
import { describe, it, expect } from 'vitest'
import { extractFormants } from '../formant-extraction'

/**
 * Synthesizes a test tone as a sum of sinusoids at known "formant" frequencies
 * plus a fundamental, at a fixed sample rate — stands in for a vowel's
 * resonance structure without needing real speech audio.
 */
function synthesizeFormantSignal(
  sampleRate: number,
  durationMs: number,
  formantHz: number[]
): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    let value = 0
    for (const f of formantHz) {
      value += Math.sin(2 * Math.PI * f * t)
    }
    samples[i] = value / formantHz.length
  }
  return samples
}

describe('extractFormants', () => {
  it('recovers approximate F1/F2 from a synthetic two-formant signal', () => {
    const sampleRate = 16000
    // Typical /iː/-ish F1/F2 pair used only as a known-answer synthetic target.
    const signal = synthesizeFormantSignal(sampleRate, 200, [270, 2300])

    const result = extractFormants(signal, sampleRate)

    expect(result.abstained).toBe(false)
    expect(result.f1Hz).toBeGreaterThan(150)
    expect(result.f1Hz).toBeLessThan(450)
    expect(result.f2Hz).toBeGreaterThan(1900)
    expect(result.f2Hz).toBeLessThan(2700)
  })

  it('abstains on a clip shorter than the minimum analysis window', () => {
    const sampleRate = 16000
    const tooShort = new Float32Array(Math.round(sampleRate * 0.01)) // 10ms

    const result = extractFormants(tooShort, sampleRate)

    expect(result.abstained).toBe(true)
    expect(result.abstainReason).toBe('clip_too_short')
  })

  it('abstains on near-silent (low energy) audio', () => {
    const sampleRate = 16000
    const silence = new Float32Array(Math.round(sampleRate * 0.2)) // all zeros

    const result = extractFormants(silence, sampleRate)

    expect(result.abstained).toBe(true)
    expect(result.abstainReason).toBe('low_snr')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/formant-extraction.test.ts`
Expected: FAIL — `Cannot find module '../formant-extraction'`

- [ ] **Step 3: Implement `formant-extraction.ts`**

```ts
// lib/pronunciation/acoustic/formant-extraction.ts
/**
 * Pure DSP: estimates vowel formants (F1/F2) from raw PCM samples via LPC
 * (Levinson-Durbin) + polynomial root-finding. No audio I/O, no browser
 * APIs — takes/returns plain arrays so it's testable with synthetic signals
 * and reusable both in-browser and in the benchmark harness (plan 071).
 */

const MIN_CLIP_MS = 30
const MIN_RMS_ENERGY = 0.01
/** LPC order ~ sampleRate/1000 + 2 is a standard heuristic for speech formant analysis. */
function lpcOrderFor(sampleRate: number): number {
  return Math.round(sampleRate / 1000) + 2
}

export interface FormantResult {
  f1Hz: number
  f2Hz: number
  abstained: boolean
  abstainReason?: 'clip_too_short' | 'low_snr'
}

function hammingWindow(signal: Float32Array): Float32Array {
  const n = signal.length
  const windowed = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1))
    windowed[i] = signal[i] * w
  }
  return windowed
}

function rmsEnergy(signal: Float32Array): number {
  let sumSquares = 0
  for (let i = 0; i < signal.length; i++) sumSquares += signal[i] * signal[i]
  return Math.sqrt(sumSquares / signal.length)
}

function autocorrelate(signal: Float32Array, maxLag: number): Float64Array {
  const result = new Float64Array(maxLag + 1)
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < signal.length - lag; i++) {
      sum += signal[i] * signal[i + lag]
    }
    result[lag] = sum
  }
  return result
}

/** Levinson-Durbin recursion: autocorrelation -> LPC coefficients. */
function levinsonDurbin(autocorr: Float64Array, order: number): Float64Array {
  const a = new Float64Array(order + 1)
  a[0] = 1
  let e = autocorr[0]
  if (e === 0) return a

  for (let i = 1; i <= order; i++) {
    let acc = autocorr[i]
    for (let j = 1; j < i; j++) acc += a[j] * autocorr[i - j]
    const k = -acc / e

    const prev = a.slice(0, i)
    a[i] = k
    for (let j = 1; j < i; j++) {
      a[j] = prev[j] + k * prev[i - j]
    }
    e *= 1 - k * k
    if (e <= 0) break
  }
  return a
}

/**
 * Finds formant frequencies as the angles of complex roots of the LPC
 * polynomial that lie inside the unit circle, converted from radians/sample
 * to Hz. Roots are found via a companion-matrix eigenvalue-free approach:
 * Durand-Kerner iteration, adequate for the low polynomial orders used here.
 */
function lpcRootsToFormants(lpcCoeffs: Float64Array, sampleRate: number): number[] {
  const order = lpcCoeffs.length - 1
  // Durand-Kerner needs coefficients highest-degree-first, monic.
  const poly: number[] = []
  for (let i = 0; i <= order; i++) poly.push(lpcCoeffs[i])

  // Initial root guesses spread around the unit circle.
  let roots: [number, number][] = []
  for (let i = 0; i < order; i++) {
    const angle = (2 * Math.PI * i) / order + 0.1
    roots.push([0.4 * Math.cos(angle), 0.4 * Math.sin(angle)])
  }

  function evalPoly(re: number, im: number): [number, number] {
    let accRe = poly[0]
    let accIm = 0
    for (let i = 1; i < poly.length; i++) {
      const nextRe = accRe * re - accIm * im
      const nextIm = accRe * im + accIm * re
      accRe = nextRe + poly[i]
      accIm = nextIm
    }
    return [accRe, accIm]
  }

  for (let iter = 0; iter < 100; iter++) {
    const next: [number, number][] = []
    for (let i = 0; i < roots.length; i++) {
      const [re, im] = roots[i]
      const [numRe, numIm] = evalPoly(re, im)
      let denRe = 1
      let denIm = 0
      for (let j = 0; j < roots.length; j++) {
        if (j === i) continue
        const dRe = re - roots[j][0]
        const dIm = im - roots[j][1]
        const nRe = denRe * dRe - denIm * dIm
        const nIm = denRe * dIm + denIm * dRe
        denRe = nRe
        denIm = nIm
      }
      const denMagSq = denRe * denRe + denIm * denIm || 1e-12
      const divRe = (numRe * denRe + numIm * denIm) / denMagSq
      const divIm = (numIm * denRe - numRe * denIm) / denMagSq
      next.push([re - divRe, im - divIm])
    }
    roots = next
  }

  const formants: number[] = []
  for (const [re, im] of roots) {
    const mag = Math.sqrt(re * re + im * im)
    if (mag < 0.5 || mag > 0.999 || im <= 0) continue // inside unit circle, upper half-plane only
    const angle = Math.atan2(im, re)
    const freq = (angle * sampleRate) / (2 * Math.PI)
    if (freq > 90 && freq < sampleRate / 2) formants.push(freq)
  }
  return formants.sort((a, b) => a - b)
}

export function extractFormants(signal: Float32Array, sampleRate: number): FormantResult {
  const durationMs = (signal.length / sampleRate) * 1000
  if (durationMs < MIN_CLIP_MS) {
    return { f1Hz: 0, f2Hz: 0, abstained: true, abstainReason: 'clip_too_short' }
  }

  if (rmsEnergy(signal) < MIN_RMS_ENERGY) {
    return { f1Hz: 0, f2Hz: 0, abstained: true, abstainReason: 'low_snr' }
  }

  const windowed = hammingWindow(signal)
  const order = lpcOrderFor(sampleRate)
  const autocorr = autocorrelate(windowed, order)
  const lpcCoeffs = levinsonDurbin(autocorr, order)
  const formants = lpcRootsToFormants(lpcCoeffs, sampleRate)

  if (formants.length < 2) {
    return { f1Hz: 0, f2Hz: 0, abstained: true, abstainReason: 'low_snr' }
  }

  return { f1Hz: formants[0], f2Hz: formants[1], abstained: false }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/formant-extraction.test.ts`
Expected: PASS — 3/3.

If the F1/F2 recovery test is flaky/out of tolerance, widen the assertion bounds slightly
(the Durand-Kerner root-finder is approximate) rather than tuning the synthetic signal to
match — the point is "roughly recovers known formants," not exact match.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/formant-extraction.ts lib/pronunciation/acoustic/__tests__/formant-extraction.test.ts
git commit -m "feat(pronunciation): add pure LPC formant-extraction DSP for vowel benchmark"
```

---

## Task 3: Vowel classification from F1/F2 (English vowel space reference points)

**Files:**
- Create: `lib/pronunciation/acoustic/vowel-space.ts`
- Test: `lib/pronunciation/acoustic/__tests__/vowel-space.test.ts`

Reference F1/F2 centroids come from published English vowel formant tables (Hillenbrand et
al. 1995 averages) — this file is data + nearest-centroid classification, not a new DSP
algorithm.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/__tests__/vowel-space.test.ts
import { describe, it, expect } from 'vitest'
import { classifyVowel, VOWEL_CENTROIDS } from '../vowel-space'

describe('classifyVowel', () => {
  it('classifies formants near the /iː/ centroid as /iː/', () => {
    const centroid = VOWEL_CENTROIDS['iː']
    const result = classifyVowel(centroid.f1Hz, centroid.f2Hz)
    expect(result.vowel).toBe('iː')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('classifies formants near the /ɪ/ centroid as /ɪ/, distinct from /iː/', () => {
    const centroid = VOWEL_CENTROIDS['ɪ']
    const result = classifyVowel(centroid.f1Hz, centroid.f2Hz)
    expect(result.vowel).toBe('ɪ')
  })

  it('lowers confidence for formants roughly equidistant between two centroids', () => {
    const iCentroid = VOWEL_CENTROIDS['iː']
    const iiCentroid = VOWEL_CENTROIDS['ɪ']
    const midpointF1 = (iCentroid.f1Hz + iiCentroid.f1Hz) / 2
    const midpointF2 = (iCentroid.f2Hz + iiCentroid.f2Hz) / 2

    const result = classifyVowel(midpointF1, midpointF2)
    expect(result.confidence).toBeLessThan(0.6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/vowel-space.test.ts`
Expected: FAIL — `Cannot find module '../vowel-space'`

- [ ] **Step 3: Implement `vowel-space.ts`**

```ts
// lib/pronunciation/acoustic/vowel-space.ts
/**
 * Reference F1/F2 centroids for the English vowel contrasts plan 071 v1
 * targets, averaged from published formant studies (Hillenbrand et al.
 * 1995). Used for nearest-centroid classification — NOT a full acoustic
 * model, intentionally scoped to the small vowel-contrast set this
 * benchmark validates.
 */
export const VOWEL_CENTROIDS: Record<string, { f1Hz: number; f2Hz: number }> = {
  'iː': { f1Hz: 270, f2Hz: 2290 },
  'ɪ': { f1Hz: 400, f2Hz: 1990 },
  'æ': { f1Hz: 660, f2Hz: 1720 },
  'ʌ': { f1Hz: 640, f2Hz: 1190 },
}

export interface VowelClassification {
  vowel: string
  confidence: number
}

function euclideanDistance(f1a: number, f2a: number, f1b: number, f2b: number): number {
  return Math.sqrt((f1a - f1b) ** 2 + (f2a - f2b) ** 2)
}

/**
 * Nearest-centroid classification in F1/F2 space. Confidence is derived
 * from how much closer the nearest centroid is than the second-nearest —
 * a formant point equidistant between two vowels gets low confidence
 * rather than a falsely-certain pick.
 */
export function classifyVowel(f1Hz: number, f2Hz: number): VowelClassification {
  const distances = Object.entries(VOWEL_CENTROIDS)
    .map(([vowel, centroid]) => ({
      vowel,
      distance: euclideanDistance(f1Hz, f2Hz, centroid.f1Hz, centroid.f2Hz),
    }))
    .sort((a, b) => a.distance - b.distance)

  const [nearest, secondNearest] = distances
  const confidence =
    secondNearest.distance === 0
      ? 0
      : Math.max(0, Math.min(1, 1 - nearest.distance / secondNearest.distance))

  return { vowel: nearest.vowel, confidence }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/vowel-space.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/vowel-space.ts lib/pronunciation/acoustic/__tests__/vowel-space.test.ts
git commit -m "feat(pronunciation): add nearest-centroid vowel classifier for formant benchmark"
```

---

## Task 4: `formant-evaluator.ts` — implements `AcousticEvaluator`

**Files:**
- Create: `lib/pronunciation/acoustic/formant-evaluator.ts`
- Test: `lib/pronunciation/acoustic/__tests__/formant-evaluator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/__tests__/formant-evaluator.test.ts
import { describe, it, expect } from 'vitest'
import { FormantVowelEvaluator } from '../formant-evaluator'
import { VOWEL_CENTROIDS } from '../vowel-space'

function synthesizeVowelSignal(sampleRate: number, durationMs: number, f1: number, f2: number): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    samples[i] = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) / 2
  }
  return samples
}

describe('FormantVowelEvaluator', () => {
  it('scores the segmental dimension for a clean synthetic /iː/-like signal', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const centroid = VOWEL_CENTROIDS['iː']
    const samples = synthesizeVowelSignal(sampleRate, 200, centroid.f1Hz, centroid.f2Hz)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental'],
      samples,
      sampleRate,
    })

    expect(result.evaluatorKind).toBe('formant_dsp')
    expect(result.outcome).toBe('scored')
    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(false)
    expect(segmental?.score).toBeGreaterThan(0)
  })

  it('abstains when the requested target vowel is outside the v1 contrast set', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const samples = synthesizeVowelSignal(sampleRate, 200, 500, 1500)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'the',
      transcript: 'the',
      dimensions: ['segmental'],
      samples,
      sampleRate,
      targetVowel: 'ə', // schwa is out of the v1 vowel-contrast scope
    })

    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(true)
    expect(segmental?.abstainReason).toBe('vowel_out_of_scope')
  })

  it('abstains on low-quality audio instead of guessing', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const silence = new Float32Array(Math.round(sampleRate * 0.2))

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental'],
      samples: silence,
      sampleRate,
    })

    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(true)
    expect(segmental?.abstainReason).toBe('low_snr')
  })

  it('abstains on non-segmental dimensions — this evaluator only handles vowel segmentals', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const centroid = VOWEL_CENTROIDS['iː']
    const samples = synthesizeVowelSignal(sampleRate, 200, centroid.f1Hz, centroid.f2Hz)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental', 'wordStress'],
      samples,
      sampleRate,
    })

    const wordStress = result.dimensionScores.find((d) => d.dimension === 'wordStress')
    expect(wordStress?.abstained).toBe(true)
    expect(wordStress?.abstainReason).toBe('dimension_out_of_scope')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/formant-evaluator.test.ts`
Expected: FAIL — `Cannot find module '../formant-evaluator'`

- [ ] **Step 3: Implement `formant-evaluator.ts`**

```ts
// lib/pronunciation/acoustic/formant-evaluator.ts
import type {
  AcousticEvaluationInput,
  AcousticEvaluationResult,
  AcousticEvaluator,
  DimensionScore,
} from '@/lib/pronunciation/acoustic-evaluator'
import { extractFormants } from './formant-extraction'
import { classifyVowel, VOWEL_CENTROIDS } from './vowel-space'

/** Extends the base input with the raw samples/rate this evaluator needs and the target vowel it should score against. Not part of the shared AcousticEvaluator contract — evaluator implementations may extend the input shape they consume. */
export interface FormantEvaluationInput extends AcousticEvaluationInput {
  samples: Float32Array
  sampleRate: number
  /** IPA vowel symbol the learner was asked to produce. Defaults inferred from targetText not attempted — caller must supply it for a real score. */
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
      const score = matchedTarget ? Math.round(60 + classification.confidence * 40) : Math.round(classification.confidence * 30)

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/__tests__/formant-evaluator.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/formant-evaluator.ts lib/pronunciation/acoustic/__tests__/formant-evaluator.test.ts
git commit -m "feat(pronunciation): implement FormantVowelEvaluator against AcousticEvaluator contract"
```

---

## Task 5: Benchmark corpus item type and loader interface

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/corpus-loader.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`

This defines the shape the benchmark harness consumes, and a loader that reads a **local
directory** of pre-extracted vowel clips + a labels JSON (format decided here so Task 6's
manual extraction step has a concrete target). The loader itself is pure Node fs/JSON — not
deployed to the app bundle.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts
import { describe, it, expect } from 'vitest'
import { parseCorpusLabels, type CorpusItem } from '../corpus-loader'

describe('parseCorpusLabels', () => {
  it('parses a valid labels JSON into typed CorpusItem records', () => {
    const raw = JSON.stringify([
      { clipFile: 'utt001.wav', targetVowel: 'iː', humanScore: 92, speakerId: 'spk01' },
      { clipFile: 'utt002.wav', targetVowel: 'ɪ', humanScore: 45, speakerId: 'spk02' },
    ])

    const items = parseCorpusLabels(raw)

    expect(items).toHaveLength(2)
    expect(items[0]).toEqual<CorpusItem>({
      clipFile: 'utt001.wav',
      targetVowel: 'iː',
      humanScore: 92,
      speakerId: 'spk01',
    })
  })

  it('rejects malformed entries rather than silently dropping or coercing them', () => {
    const raw = JSON.stringify([{ clipFile: 'utt003.wav', targetVowel: 'iː' }]) // missing humanScore/speakerId

    expect(() => parseCorpusLabels(raw)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`
Expected: FAIL — `Cannot find module '../corpus-loader'`

- [ ] **Step 3: Implement `corpus-loader.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/corpus-loader.ts
/**
 * Loads a local, pre-extracted vowel subset of speechocean762 for the plan
 * 071 benchmark. NOT deployed to the app — Node-only, used by
 * `run-benchmark.ts`. Expects a directory of WAV clips plus a
 * `labels.json` sibling file matching `CorpusItem[]`. See Task 6 for how
 * that directory gets populated (manual, licensed download).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

export interface CorpusItem {
  clipFile: string
  targetVowel: string
  /** Expert-labeled pronunciation score from speechocean762, 0-100 scale (dataset uses 0-10; caller-side loader multiplies by 10 — see run-benchmark.ts). */
  humanScore: number
  speakerId: string
}

const CorpusItemSchema = z.object({
  clipFile: z.string().min(1),
  targetVowel: z.string().min(1),
  humanScore: z.number(),
  speakerId: z.string().min(1),
})

const CorpusLabelsSchema = z.array(CorpusItemSchema)

export function parseCorpusLabels(raw: string): CorpusItem[] {
  const json: unknown = JSON.parse(raw)
  return CorpusLabelsSchema.parse(json)
}

/** Reads `labels.json` from `corpusDir` and parses it. Throws if missing/malformed — a missing corpus must fail loudly, never silently run on zero items. */
export function loadCorpusLabels(corpusDir: string): CorpusItem[] {
  const raw = readFileSync(join(corpusDir, 'labels.json'), 'utf-8')
  return parseCorpusLabels(raw)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`
Expected: PASS — 2/2.

- [ ] **Step 5: Confirm `zod` is available**

Run: `pnpm exec node -e "require('zod')"` (or check `package.json` dependencies)
Expected: no error — `zod` is already a project dependency (used throughout
`lib/pronunciation/assessment/types.ts`).

- [ ] **Step 6: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/corpus-loader.ts lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts
git commit -m "feat(pronunciation): add speechocean762 corpus label loader for vowel benchmark"
```

---

## Task 6: MANUAL — acquire speechocean762 (human partner) — DONE

**Superseded record, kept for history.** The human partner downloaded speechocean762 (OpenSLR
SLR101) to `D:\proyectos\speechocean762` (outside the repo — 500MB corpus, gitignored by
being outside the project tree entirely, nothing to add to `.gitignore`).

**Discovery that invalidated this task's original Step 2-3 design:** speechocean762 has no
per-word or per-phoneme timestamps, and only 6 of its 5000 utterances are single-word
recordings — it is a read-aloud sentence corpus, not an isolated-word corpus. The original
plan assumed "extract the vowel-bearing audio segment" was a simple manual clip step; it
isn't, because there is no alignment data to clip against. `speechocean-extractor.ts` (built
under the original Task 6 code, still valid) reads the corpus's own index files
(`resource/scores-detail.json`, `<split>/wav.scp`, `<split>/utt2spk`) and confirmed only 2
usable items existed under a "single-word utterance only" filter — not enough for a
benchmark. Task 6b below replaces the segment-extraction approach.

---

## Task 6b: Proportional phoneme-count word segmentation (no forced aligner)

**Design decided in a follow-up brainstorming round (see conversation), since this changes a
core assumption of the original spec** ("empezando por contrastes vocálicos donde la señal
acústica es más robusta" assumed segment isolation was available; it required this new piece
instead).

**What this is:** a pure heuristic that estimates where a target word falls inside a
multi-word speechocean762 utterance, by dividing the utterance's total audio duration among
its words in proportion to each word's phoneme count, then taking the center third of that
word's estimated span as the analysis window.

**What this is NOT:** not a forced aligner. It does not look at the audio to find real word
boundaries (no VAD, no energy/pause detection). It is deliberately the simplest possible
estimate — the benchmark's own agreement/abstention metrics (Task 8) are what determine
whether this estimate is good enough to trust, not an assumption baked in here.

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/word-window.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/word-window.test.ts`
- Modify: `lib/pronunciation/acoustic/benchmark/speechocean-extractor.ts` (drop the
  single-word-utterance filter; compute a window for every monosyllabic target-vowel word
  found anywhere in an utterance)
- Modify: `lib/pronunciation/acoustic/benchmark/corpus-loader.ts` (`CorpusItem` gains optional
  `windowStartMs`/`windowEndMs`)
- Modify: `lib/pronunciation/acoustic/benchmark/run-benchmark.ts` (slice samples to the window
  before calling `extractFormants`, when a window is present)

- [ ] **Step 1: Write the failing test for the pure windowing function**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/word-window.test.ts
import { describe, it, expect } from 'vitest'
import { proportionalWordWindow, centerThird } from '../word-window'

describe('proportionalWordWindow', () => {
  it('splits total duration among words proportional to phoneme count', () => {
    // 3 words: "WE" (2 phones: W IY0), "CALL" (3 phones: K AO0 L), "IT" (2 phones: IH0 T)
    // total phones = 7, total duration = 1400ms -> 200ms/phone
    const phoneCounts = [2, 3, 2]
    const totalDurationMs = 1400

    const windows = proportionalWordWindow(phoneCounts, totalDurationMs)

    expect(windows).toHaveLength(3)
    expect(windows[0]).toEqual({ startMs: 0, endMs: 400 })
    expect(windows[1]).toEqual({ startMs: 400, endMs: 1000 })
    expect(windows[2]).toEqual({ startMs: 1000, endMs: 1400 })
  })

  it('handles a single-word utterance as one full-duration window', () => {
    const windows = proportionalWordWindow([2], 500)
    expect(windows).toEqual([{ startMs: 0, endMs: 500 }])
  })
})

describe('centerThird', () => {
  it('returns the middle 33%-66% of a window', () => {
    const result = centerThird({ startMs: 400, endMs: 1000 })
    // span = 600, third = 200 -> [400+200, 1000-200] = [600, 800]
    expect(result).toEqual({ startMs: 600, endMs: 800 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/word-window.test.ts`
Expected: FAIL — `Cannot find module '../word-window'`

- [ ] **Step 3: Implement `word-window.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/word-window.ts
/**
 * Pure proportional-by-phoneme-count word segmentation for speechocean762
 * utterances that have no real timestamps. NOT a forced aligner — see
 * plan 071 Task 6b design note. Benchmark metrics (Task 8) are the honest
 * check on whether this estimate is usable, not an assumption made here.
 */
export interface TimeWindow {
  startMs: number
  endMs: number
}

/**
 * Splits `totalDurationMs` across words in `phoneCounts` order, each word's
 * share proportional to its phoneme count. Words with zero phones get a
 * zero-width window rather than crashing — callers should skip those.
 */
export function proportionalWordWindow(phoneCounts: number[], totalDurationMs: number): TimeWindow[] {
  const totalPhones = phoneCounts.reduce((sum, n) => sum + n, 0)
  if (totalPhones === 0) return phoneCounts.map(() => ({ startMs: 0, endMs: 0 }))

  const windows: TimeWindow[] = []
  let cursorMs = 0
  for (const count of phoneCounts) {
    const shareMs = (count / totalPhones) * totalDurationMs
    const startMs = cursorMs
    const endMs = cursorMs + shareMs
    windows.push({ startMs, endMs })
    cursorMs = endMs
  }
  return windows
}

/** Center third (33%-66%) of a window — avoids consonant-heavy edges around the vowel nucleus of short CVC words. */
export function centerThird(window: TimeWindow): TimeWindow {
  const span = window.endMs - window.startMs
  const third = span / 3
  return { startMs: window.startMs + third, endMs: window.endMs - third }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/word-window.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/word-window.ts lib/pronunciation/acoustic/benchmark/__tests__/word-window.test.ts
git commit -m "feat(pronunciation): add proportional phoneme-count word windowing (no forced aligner)"
```

- [ ] **Step 6: Write the failing test for extending `CorpusItem` with a window**

Add to `lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`:

```ts
it('accepts optional windowStartMs/windowEndMs on a CorpusItem', () => {
  const raw = JSON.stringify([
    { clipFile: 'utt001.wav', targetVowel: 'iː', humanScore: 92, speakerId: 'spk01', windowStartMs: 600, windowEndMs: 800 },
  ])
  const items = parseCorpusLabels(raw)
  expect(items[0].windowStartMs).toBe(600)
  expect(items[0].windowEndMs).toBe(800)
})
```

- [ ] **Step 7: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`
Expected: FAIL — extra keys rejected or fields undefined (zod schema doesn't know them yet).

- [ ] **Step 8: Widen `CorpusItem` and its zod schema**

In `corpus-loader.ts`, change:

```ts
export interface CorpusItem {
  clipFile: string
  targetVowel: string
  humanScore: number
  speakerId: string
}
```

to:

```ts
export interface CorpusItem {
  clipFile: string
  targetVowel: string
  humanScore: number
  speakerId: string
  /** Proportional-estimate analysis window (Task 6b), ms from clip start. Absent means "use the whole clip" (e.g. synthetic/legacy fixtures). */
  windowStartMs?: number
  windowEndMs?: number
}
```

and the schema:

```ts
const CorpusItemSchema = z.object({
  clipFile: z.string().min(1),
  targetVowel: z.string().min(1),
  humanScore: z.number(),
  speakerId: z.string().min(1),
  windowStartMs: z.number().optional(),
  windowEndMs: z.number().optional(),
})
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/corpus-loader.ts lib/pronunciation/acoustic/benchmark/__tests__/corpus-loader.test.ts
git commit -m "feat(pronunciation): add optional analysis window fields to CorpusItem"
```

- [ ] **Step 11: Write the failing test for the extractor computing windows**

Replace the existing single-word-only assertions in
`lib/pronunciation/acoustic/benchmark/__tests__/speechocean-extractor.test.ts`'s
`extractSpeechoceanVowels` describe block with:

```ts
it('extracts a windowed item for every monosyllabic target-vowel word, including inside multi-word utterances', () => {
  const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })

  // From the 4-word utterance: CALL (AO, not in v1 set) skipped; WE->iː, IT->ɪ, BEAR (EH, not in v1 set) skipped.
  // Plus the 2 single-word utterances (IT->ɪ, WE->iː).
  expect(items.length).toBeGreaterThanOrEqual(4)

  const fromSentence = items.find((i) => i.clipFile.endsWith('000010011.WAV') && i.targetVowel === 'ɪ')
  expect(fromSentence).toBeDefined()
  expect(fromSentence?.windowStartMs).toBeGreaterThanOrEqual(0)
  expect(fromSentence?.windowEndMs).toBeGreaterThan(fromSentence?.windowStartMs ?? 0)
})

it('does not compute a window for single-word utterances — the whole clip already is the word', () => {
  const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })
  const singleWordItem = items.find((i) => i.clipFile.endsWith('000020001.WAV'))
  expect(singleWordItem?.windowStartMs).toBeUndefined()
  expect(singleWordItem?.windowEndMs).toBeUndefined()
})
```

This requires the fixture's `beforeAll` to also provide real WAV durations (the windowing
needs `totalDurationMs`). Add a helper to the test file to write a minimal silent WAV of a
known duration (reuse the `buildTestWav`-style approach from `wav-decoder.test.ts`, or write
a smaller duration-only WAV header helper) and point `wav.scp` at those files so
`extractSpeechoceanVowels` can read actual durations via `decodeWavPcm16`.

- [ ] **Step 12: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/speechocean-extractor.test.ts`
Expected: FAIL (extractor still filters to single-word utterances only).

- [ ] **Step 13: Update `speechocean-extractor.ts`**

Remove the `scored.words.length !== 1` filter. Instead, for each utterance, iterate every
word; for words with a monosyllabic target vowel, compute the window:

```ts
import { decodeWavPcm16 } from './wav-decoder'
import { proportionalWordWindow, centerThird } from './word-window'

// inside extractSpeechoceanVowels, replace the "if (!scored || scored.words.length !== 1) continue"
// single-word-only branch with:

if (!scored) continue

const phoneCounts = scored.words.map((w) => w['ref-phones'].trim().split(/\s+/).length)
const wavBuffer = readFileSync(join(corpusRoot, relativeWavPath))
const { sampleRate, samples } = decodeWavPcm16(wavBuffer)
const totalDurationMs = (samples.length / sampleRate) * 1000
const wordWindows = scored.words.length > 1 ? proportionalWordWindow(phoneCounts, totalDurationMs) : null

scored.words.forEach((word, wordIndex) => {
  const targetVowel = monosyllabicTargetVowel(word['ref-phones'])
  if (!targetVowel) return

  const window = wordWindows ? centerThird(wordWindows[wordIndex]) : null

  items.push({
    clipFile: relativeWavPath,
    targetVowel,
    humanScore: averageWordScore(word),
    speakerId: utt2spk.get(uttId) ?? 'unknown',
    ...(window ? { windowStartMs: window.startMs, windowEndMs: window.endMs } : {}),
  })
})
```

Note: this now reads and decodes every WAV during extraction (needed for real duration) —
acceptable since extraction is a one-time offline step, not a hot path.

- [ ] **Step 14: Run tests to verify they pass**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/speechocean-extractor.test.ts`
Expected: PASS.

- [ ] **Step 15: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 16: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/speechocean-extractor.ts lib/pronunciation/acoustic/benchmark/__tests__/speechocean-extractor.test.ts
git commit -m "feat(pronunciation): extract windowed vowel items from multi-word speechocean762 utterances"
```

- [ ] **Step 17: Update `run-benchmark.ts` to slice samples to the window before formant extraction**

Add a pure helper and use it before calling `extractFormants`:

```ts
// in run-benchmark.ts, add:
function sliceToWindow(samples: Float32Array, sampleRate: number, startMs?: number, endMs?: number): Float32Array {
  if (startMs === undefined || endMs === undefined) return samples
  const startSample = Math.max(0, Math.round((startMs / 1000) * sampleRate))
  const endSample = Math.min(samples.length, Math.round((endMs / 1000) * sampleRate))
  return samples.slice(startSample, endSample)
}

// inside the trials loop, replace:
//   const formants = extractFormants(audio.samples, audio.sampleRate)
// with:
//   const windowedSamples = sliceToWindow(audio.samples, audio.sampleRate, item.windowStartMs, item.windowEndMs)
//   const formants = extractFormants(windowedSamples, audio.sampleRate)
```

Add a focused test to `run-benchmark.test.ts` confirming a windowed item only analyzes the
sliced region (construct a signal where the full clip has noise but the windowed region has a
clean synthetic vowel, assert it still scores — proves the slice is actually applied, not
ignored).

- [ ] **Step 18: Run full benchmark test suite**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark`
Expected: all pass.

- [ ] **Step 19: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/run-benchmark.ts lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts
git commit -m "feat(pronunciation): slice benchmark audio to proportional word window before formant extraction"
```

---

## Task 7: WAV decoding helper (Node-side, for benchmark only)

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/wav-decoder.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/wav-decoder.test.ts`

The benchmark runs in Node (not a browser), so it needs a plain WAV-to-Float32Array decoder
— the production in-browser path would use `AudioContext.decodeAudioData` instead, which is
out of scope here (no DOM in the benchmark harness).

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/wav-decoder.test.ts
import { describe, it, expect } from 'vitest'
import { decodeWavPcm16 } from '../wav-decoder'

/** Builds a minimal valid 16-bit PCM mono WAV buffer for round-trip testing. */
function buildTestWav(sampleRate: number, samples: number[]): Buffer {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  samples.forEach((s, i) => buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2))
  return buffer
}

describe('decodeWavPcm16', () => {
  it('decodes sample rate and normalized Float32 samples from a 16-bit PCM WAV', () => {
    const original = [0, 0.5, -0.5, 1, -1]
    const wav = buildTestWav(16000, original)

    const result = decodeWavPcm16(wav)

    expect(result.sampleRate).toBe(16000)
    expect(result.samples).toHaveLength(5)
    expect(result.samples[1]).toBeCloseTo(0.5, 1)
    expect(result.samples[2]).toBeCloseTo(-0.5, 1)
  })

  it('throws on a non-WAV buffer instead of returning garbage', () => {
    const notWav = Buffer.from('not a wav file')
    expect(() => decodeWavPcm16(notWav)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/wav-decoder.test.ts`
Expected: FAIL — `Cannot find module '../wav-decoder'`

- [ ] **Step 3: Implement `wav-decoder.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/wav-decoder.ts
/**
 * Minimal 16-bit PCM mono/stereo WAV decoder for the Node-side benchmark
 * harness. The in-browser production path uses AudioContext.decodeAudioData
 * instead — this exists only because the benchmark has no DOM.
 */
export interface DecodedWav {
  sampleRate: number
  samples: Float32Array
}

export function decodeWavPcm16(buffer: Buffer): DecodedWav {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a valid WAV file')
  }

  let offset = 12
  let sampleRate = 0
  let numChannels = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    if (chunkId === 'fmt ') {
      numChannels = buffer.readUInt16LE(offset + 10)
      sampleRate = buffer.readUInt32LE(offset + 12)
      bitsPerSample = buffer.readUInt16LE(offset + 22)
    } else if (chunkId === 'data') {
      dataOffset = offset + 8
      dataSize = chunkSize
    }
    offset += 8 + chunkSize + (chunkSize % 2)
  }

  if (dataOffset < 0 || bitsPerSample !== 16) {
    throw new Error('Unsupported or malformed WAV data chunk')
  }

  const sampleCount = dataSize / 2 / numChannels
  const samples = new Float32Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    const int16 = buffer.readInt16LE(dataOffset + i * 2 * numChannels)
    samples[i] = int16 / 32768
  }

  return { sampleRate, samples }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/wav-decoder.test.ts`
Expected: PASS — 2/2.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/wav-decoder.ts lib/pronunciation/acoustic/benchmark/__tests__/wav-decoder.test.ts
git commit -m "feat(pronunciation): add Node-side WAV decoder for benchmark harness"
```

---

## Task 8: Benchmark metrics — agreement, confusion matrix, abstention rate

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/metrics.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/metrics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/metrics.test.ts
import { describe, it, expect } from 'vitest'
import { computeBenchmarkMetrics, type BenchmarkTrial } from '../metrics'

describe('computeBenchmarkMetrics', () => {
  const trials: BenchmarkTrial[] = [
    { targetVowel: 'iː', predictedVowel: 'iː', abstained: false, humanScore: 90 },
    { targetVowel: 'iː', predictedVowel: 'ɪ', abstained: false, humanScore: 40 },
    { targetVowel: 'ɪ', predictedVowel: 'ɪ', abstained: false, humanScore: 85 },
    { targetVowel: 'ɪ', predictedVowel: null, abstained: true, humanScore: 20 },
  ]

  it('computes overall agreement rate across non-abstained trials', () => {
    const metrics = computeBenchmarkMetrics(trials)
    // 2 correct out of 3 non-abstained trials
    expect(metrics.agreementRate).toBeCloseTo(2 / 3, 5)
  })

  it('computes per-contrast agreement rate', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.perVowelAgreement['iː']).toBeCloseTo(0.5, 5)
    expect(metrics.perVowelAgreement['ɪ']).toBeCloseTo(1, 5)
  })

  it('computes abstention rate across all trials', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.abstentionRate).toBeCloseTo(0.25, 5)
  })

  it('builds a confusion matrix of target vowel vs predicted vowel', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.confusionMatrix['iː']['ɪ']).toBe(1)
    expect(metrics.confusionMatrix['ɪ']['ɪ']).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/metrics.test.ts`
Expected: FAIL — `Cannot find module '../metrics'`

- [ ] **Step 3: Implement `metrics.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/metrics.ts
export interface BenchmarkTrial {
  targetVowel: string
  predictedVowel: string | null
  abstained: boolean
  humanScore: number
}

export interface BenchmarkMetrics {
  agreementRate: number
  perVowelAgreement: Record<string, number>
  abstentionRate: number
  confusionMatrix: Record<string, Record<string, number>>
  trialCount: number
}

export function computeBenchmarkMetrics(trials: BenchmarkTrial[]): BenchmarkMetrics {
  const scored = trials.filter((t) => !t.abstained)
  const correct = scored.filter((t) => t.predictedVowel === t.targetVowel)

  const perVowelAgreement: Record<string, number> = {}
  const vowels = Array.from(new Set(trials.map((t) => t.targetVowel)))
  for (const vowel of vowels) {
    const vowelTrials = scored.filter((t) => t.targetVowel === vowel)
    const vowelCorrect = vowelTrials.filter((t) => t.predictedVowel === vowel)
    perVowelAgreement[vowel] = vowelTrials.length === 0 ? 0 : vowelCorrect.length / vowelTrials.length
  }

  const confusionMatrix: Record<string, Record<string, number>> = {}
  for (const vowel of vowels) confusionMatrix[vowel] = {}
  for (const trial of scored) {
    const predicted = trial.predictedVowel as string
    confusionMatrix[trial.targetVowel][predicted] = (confusionMatrix[trial.targetVowel][predicted] ?? 0) + 1
  }

  return {
    agreementRate: scored.length === 0 ? 0 : correct.length / scored.length,
    perVowelAgreement,
    abstentionRate: trials.length === 0 ? 0 : trials.filter((t) => t.abstained).length / trials.length,
    confusionMatrix,
    trialCount: trials.length,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/metrics.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/metrics.ts lib/pronunciation/acoustic/benchmark/__tests__/metrics.test.ts
git commit -m "feat(pronunciation): add benchmark agreement/confusion/abstention metrics"
```

---

## Task 9: Decision thresholds (fixed before running, per spec)

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/decision-thresholds.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/decision-thresholds.test.ts`

Fixing these as code (not inline in the runner) makes the "thresholds set before running, not
tuned after seeing results" honesty rule auditable via git history/diff.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/decision-thresholds.test.ts
import { describe, it, expect } from 'vitest'
import { decideVowelContrastVerdict, SHIP_AGREEMENT_THRESHOLD } from '../decision-thresholds'

describe('decideVowelContrastVerdict', () => {
  it('ships a contrast at or above the agreement threshold', () => {
    expect(decideVowelContrastVerdict(SHIP_AGREEMENT_THRESHOLD)).toBe('ship')
    expect(decideVowelContrastVerdict(0.95)).toBe('ship')
  })

  it('does not ship a contrast below the agreement threshold', () => {
    expect(decideVowelContrastVerdict(SHIP_AGREEMENT_THRESHOLD - 0.01)).toBe('no_ship')
    expect(decideVowelContrastVerdict(0.5)).toBe('no_ship')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/decision-thresholds.test.ts`
Expected: FAIL — `Cannot find module '../decision-thresholds'`

- [ ] **Step 3: Implement `decision-thresholds.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/decision-thresholds.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/decision-thresholds.test.ts`
Expected: PASS — 2/2.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/decision-thresholds.ts lib/pronunciation/acoustic/benchmark/__tests__/decision-thresholds.test.ts
git commit -m "feat(pronunciation): fix ship/no-ship agreement threshold before benchmark run"
```

---

## Task 10: Benchmark runner + decision document

**Files:**
- Create: `lib/pronunciation/acoustic/benchmark/run-benchmark.ts`
- Test: `lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts`
- Create (output, not code): `lib/pronunciation/acoustic/benchmark/decision.md`

**This task has two parts: build+test the runner against synthetic fixtures (always
possible), then run it for real against the corpus from Task 6 (only possible once that
manual step is done).**

- [ ] **Step 1: Write the failing test (runner logic, synthetic corpus)**

```ts
// lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts
import { describe, it, expect } from 'vitest'
import { runBenchmarkOnItems } from '../run-benchmark'
import type { CorpusItem } from '../corpus-loader'

function synthesizeVowelSignal(sampleRate: number, durationMs: number, f1: number, f2: number): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    samples[i] = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) / 2
  }
  return samples
}

describe('runBenchmarkOnItems', () => {
  it('runs the evaluator over provided items and returns metrics + verdicts', async () => {
    const sampleRate = 16000
    const items: CorpusItem[] = [
      { clipFile: 'a.wav', targetVowel: 'iː', humanScore: 90, speakerId: 's1' },
      { clipFile: 'b.wav', targetVowel: 'ɪ', humanScore: 85, speakerId: 's2' },
    ]
    // Injects pre-decoded audio directly, bypassing file I/O — keeps this
    // test hermetic and independent of any real corpus being present.
    const audioByFile: Record<string, { sampleRate: number; samples: Float32Array }> = {
      'a.wav': { sampleRate, samples: synthesizeVowelSignal(sampleRate, 200, 270, 2290) },
      'b.wav': { sampleRate, samples: synthesizeVowelSignal(sampleRate, 200, 400, 1990) },
    }

    const report = await runBenchmarkOnItems(items, (clipFile) => audioByFile[clipFile])

    expect(report.metrics.trialCount).toBe(2)
    expect(report.verdictsByVowel['iː']).toBeDefined()
    expect(report.verdictsByVowel['ɪ']).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts`
Expected: FAIL — `Cannot find module '../run-benchmark'`

- [ ] **Step 3: Implement `run-benchmark.ts`**

```ts
// lib/pronunciation/acoustic/benchmark/run-benchmark.ts
/**
 * Node-only benchmark harness for plan 071. Not deployed to the app.
 * Loads a local corpus subset (Task 6), runs FormantVowelEvaluator on each
 * item, compares predicted vowel vs the item's targetVowel, and computes
 * ship/no-ship verdicts per contrast using the pre-fixed thresholds.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FormantVowelEvaluator } from '../formant-evaluator'
import { classifyVowel } from '../vowel-space'
import { extractFormants } from '../formant-extraction'
import { loadCorpusLabels, type CorpusItem } from './corpus-loader'
import { decodeWavPcm16 } from './wav-decoder'
import { computeBenchmarkMetrics, type BenchmarkTrial, type BenchmarkMetrics } from './metrics'
import { decideVowelContrastVerdict, type ContrastVerdict, SHIP_AGREEMENT_THRESHOLD } from './decision-thresholds'

export interface BenchmarkReport {
  metrics: BenchmarkMetrics
  verdictsByVowel: Record<string, ContrastVerdict>
}

type AudioLoader = (clipFile: string) => { sampleRate: number; samples: Float32Array } | undefined

export async function runBenchmarkOnItems(items: CorpusItem[], loadAudio: AudioLoader): Promise<BenchmarkReport> {
  const evaluator = new FormantVowelEvaluator()
  const trials: BenchmarkTrial[] = []

  for (const item of items) {
    const audio = loadAudio(item.clipFile)
    if (!audio) {
      trials.push({ targetVowel: item.targetVowel, predictedVowel: null, abstained: true, humanScore: item.humanScore })
      continue
    }

    const formants = extractFormants(audio.samples, audio.sampleRate)
    if (formants.abstained) {
      trials.push({ targetVowel: item.targetVowel, predictedVowel: null, abstained: true, humanScore: item.humanScore })
      continue
    }

    const classification = classifyVowel(formants.f1Hz, formants.f2Hz)
    trials.push({
      targetVowel: item.targetVowel,
      predictedVowel: classification.vowel,
      abstained: false,
      humanScore: item.humanScore,
    })
  }

  const metrics = computeBenchmarkMetrics(trials)
  const verdictsByVowel: Record<string, ContrastVerdict> = {}
  for (const [vowel, agreement] of Object.entries(metrics.perVowelAgreement)) {
    verdictsByVowel[vowel] = decideVowelContrastVerdict(agreement)
  }

  // evaluator constructed above to keep this function's shape aligned with
  // the production AcousticEvaluator contract even though this benchmark
  // path calls the DSP functions directly for per-trial detail.
  void evaluator

  return { metrics, verdictsByVowel }
}

/** Entry point for running against a real local corpus directory (Task 6). Not covered by unit tests — exercises real file I/O. Run manually: `pnpm exec tsx lib/pronunciation/acoustic/benchmark/run-benchmark.ts <corpusDir>`. */
export async function runBenchmarkFromDir(corpusDir: string): Promise<BenchmarkReport> {
  const items = loadCorpusLabels(corpusDir)
  return runBenchmarkOnItems(items, (clipFile) => {
    const wavBuffer = readFileSync(join(corpusDir, clipFile))
    return decodeWavPcm16(wavBuffer)
  })
}

export { SHIP_AGREEMENT_THRESHOLD }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts`
Expected: PASS — 1/1.

- [ ] **Step 5: Run the real benchmark (only if Task 6 is complete)**

If the human partner has provided the corpus directory path, run it manually (not via
vitest):

```bash
pnpm exec tsx -e "
import { runBenchmarkFromDir } from './lib/pronunciation/acoustic/benchmark/run-benchmark'
runBenchmarkFromDir('<corpus-dir-path>').then((report) => {
  console.log(JSON.stringify(report, null, 2))
})
"
```

If `tsx` isn't installed, check `package.json` — use whatever TS-runner the project already
has, or `pnpm exec ts-node`.

- [ ] **Step 6: Write `decision.md` from the real report**

Create `lib/pronunciation/acoustic/benchmark/decision.md` with the actual numbers from Step
5's output:

```markdown
# Plan 071 — Vowel Acoustic Benchmark Decision

**Date:** <run date>
**Threshold:** agreement ≥ 0.85 to ship a contrast (fixed in `decision-thresholds.ts` before
this run — see git history for that commit's date, which predates this run).

**⚠️ Segmentation caveat (mandatory context for interpreting every number below):**
speechocean762 has no per-word timestamps. Word-level analysis windows come from
`word-window.ts`'s proportional phoneme-count estimate (Task 6b) — a heuristic, NOT a forced
aligner. A `no_ship` or low-agreement verdict below may reflect segmentation noise rather than
a genuine evaluator weakness, and this document must not attribute it to one over the other
without evidence (e.g. spot-checking a sample of windowed clips by ear). Items drawn from
single-word utterances (no estimation needed, ~6 in the whole corpus) vs. items drawn from
multi-word utterances (estimated window) should be reported and reasoned about separately if
the sample size allows it — do not silently pool them into one number that hides this.

## Results

| Vowel | Trials | Agreement | Verdict |
|-------|--------|-----------|---------|
| iː    | <n>    | <rate>    | <ship/no_ship> |
| ɪ     | <n>    | <rate>    | <ship/no_ship> |
| æ     | <n>    | <rate>    | <ship/no_ship> |
| ʌ     | <n>    | <rate>    | <ship/no_ship> |

**Overall abstention rate:** <rate>

## Verdict

<One of: SHIP (all contrasts) / PARTIAL-SHIP (list which contrasts) / NO-SHIP (none)>

<Short paragraph interpreting the confusion matrix — which contrasts got confused with which,
and whether that matches known L1-Spanish confusability (/iː/-/ɪ/ is the expected hard
pair). Must also state whether the verdict is credited to the evaluator or flagged as
possibly confounded by proportional-window segmentation noise, per the caveat above.>
```

This file's content depends entirely on real corpus results and cannot be pre-written — if
you're executing this plan without the corpus yet, stop here and mark Task 10 blocked, do not
fabricate placeholder numbers in `decision.md`.

- [ ] **Step 7: Commit**

```bash
git add lib/pronunciation/acoustic/benchmark/run-benchmark.ts lib/pronunciation/acoustic/benchmark/__tests__/run-benchmark.test.ts
# only add decision.md in this commit if Step 6 was actually completed with real numbers
git commit -m "feat(pronunciation): add benchmark runner for vowel-contrast evaluator"
```

---

## Task 11: CONDITIONAL — gate release (only if Task 10's verdict is ship/partial-ship)

**Decision branch:** Do not execute this task if `decision.md` says NO-SHIP for every
contrast. In that case, plan 071 is done — the honest outcome is "no change to production,"
per the spec's explicit success criterion. Skip straight to Finishing.

**Files (only if at least one contrast shipped):**
- Modify: `lib/pronunciation/targets/types.ts` (the `UNAVAILABLE_EVIDENCE_CAPABILITIES`
  comment/mechanism)
- Modify: `lib/pronunciation/assessment/scoring-guards.ts`
- Test: add to `lib/pronunciation/assessment/__tests__/scoring.test.ts` (or a new
  `scoring-guards.test.ts` if one doesn't exist)

Because the exact shipped contrast set is only known after Task 10 runs, this task's steps
describe the **pattern** to follow rather than a fixed diff — fill in `<SHIPPED_VOWELS>` from
`decision.md`'s actual verdict.

- [ ] **Step 1: Write the failing test for a shipped contrast**

Add to `lib/pronunciation/assessment/__tests__/scoring.test.ts` (adjust target id to match
whatever the vowel-contrast target is actually called in
`lib/pronunciation/targets/registry.ts` — check that file for the exact id, e.g.
`segmental.vowel-contrast./iː-ɪ/`):

```ts
it('does not abstain a shipped vowel contrast purely because production capability is acoustic-only (plan 071 gate)', () => {
  // Use the real target id for a contrast decision.md marked "ship".
  const lookup = getTarget('segmental.vowel-contrast./iː-ɪ/' as PronunciationTargetId)
  expect(lookup.ok).toBe(true)
  if (lookup.ok) {
    expect(mustAbstainFromProductionScore(lookup.target)).toBe(false)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/scoring.test.ts`
Expected: FAIL (still abstains — gate not yet updated).

- [ ] **Step 3: Update the capability gate for shipped contrasts only**

In `lib/pronunciation/targets/types.ts`, change the single global gate to a per-target
allowlist. Replace:

```ts
export const UNAVAILABLE_EVIDENCE_CAPABILITIES: readonly EvidenceCapability[] = ['acoustic']
```

with a targeted exception list populated from `decision.md`'s shipped contrasts:

```ts
/**
 * `acoustic` capability is unavailable EXCEPT for the specific vowel
 * contrasts plan 071's benchmark validated (`decision.md`, ship verdict).
 * Do not add a target id here without a corresponding ship verdict in that
 * file — this list is the production trust boundary for acoustic scores.
 */
export const ACOUSTIC_SHIPPED_TARGET_IDS: readonly string[] = [
  // e.g. 'segmental.vowel-contrast./iː-ɪ/' — fill in from decision.md
]

export const UNAVAILABLE_EVIDENCE_CAPABILITIES: readonly EvidenceCapability[] = ['acoustic']
```

In `lib/pronunciation/assessment/scoring-guards.ts`, update `mustAbstainFromProductionScore`
to check the allowlist before falling back to the global gate:

```ts
import { ACOUSTIC_SHIPPED_TARGET_IDS, isProsodyOnlyTargetId } from './types'
// ... existing imports

export function mustAbstainFromProductionScore(target: PronunciationTarget): boolean {
  if (isProsodyOnlyTargetId(target.id)) return true

  const productionCapabilities = target.evidenceCapabilities.filter(
    (c) => c === 'controlled_production' || c === 'contextual_production' || c === 'acoustic' || c === 'stt_intelligibility'
  )
  const hasSttCapability = productionCapabilities.includes('stt_intelligibility')
  const acousticShipped = ACOUSTIC_SHIPPED_TARGET_IDS.includes(target.id)
  const onlyAcousticCapable =
    !hasSttCapability &&
    !acousticShipped &&
    productionCapabilities.some((c) => c === 'acoustic' && UNAVAILABLE_EVIDENCE_CAPABILITIES.includes(c))

  return onlyAcousticCapable || !hasSttCapability
}
```

Note: this only removes the abstention gate — it does NOT wire `FormantVowelEvaluator` into
`scoreProductionPrompt`'s actual scoring path (that requires capturing raw audio samples in
the production flow, a separate, larger change outside plan 071's scope per the spec's
"Out of scope" list: "Wire del evaluador a producción sin veredicto ship" is now permitted,
but actually wiring it is its own follow-up plan). Confirm this scoping with the human
partner before adding more here — do not silently expand scope.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check and full focused suite**

Run: `pnpm type-check`
Run: `pnpm exec vitest run lib/pronunciation`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/pronunciation/targets/types.ts lib/pronunciation/assessment/scoring-guards.ts lib/pronunciation/assessment/__tests__/scoring.test.ts
git commit -m "feat(pronunciation): release shipped vowel contrasts from acoustic abstention gate (plan 071)"
```

---

## Task 12: Full verification pass

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 2: Run all pronunciation tests**

Run: `pnpm exec vitest run lib/pronunciation components/pronunciation-assessment`
Expected: all pass except the already-documented pre-existing failure in
`PronunciationAssessmentClient.test.tsx` (plan 072's README note) — no new failures.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 4: Update `plans/README.md`**

Mark row 071 as DONE (or PARTIAL if some contrasts didn't ship, or DONE-NO-SHIP if none
did), with a caveat note matching whatever `decision.md` actually says — do not write a
generic "done" without the real verdict summary.

- [ ] **Step 5: Commit**

```bash
git add plans/README.md
git commit -m "docs: mark plan 071 status in README with benchmark verdict"
```

---

## Finishing

Once all applicable tasks are complete (Task 11 skipped if no-ship), invoke
`superpowers:finishing-a-development-branch` to close out the branch per the user's usual
preference (this repo has been working directly on `dev` — confirm with the human partner
whether that's still the intent, per the plan-072 precedent set 2026-07-25).
