/**
 * Pure DSP: estimates vowel formants (F1/F2) from raw PCM samples via LPC
 * (Levinson-Durbin) + polynomial root-finding. No audio I/O, no browser
 * APIs — takes/returns plain arrays so it's testable with synthetic signals
 * and reusable both in-browser and in the benchmark harness (plan 071).
 */

const MIN_CLIP_MS = 30
const MIN_RMS_ENERGY = 0.01
/**
 * LPC order for vowel formant analysis (F1-F4 range). Kept low and fixed
 * rather than scaled with sample rate: this evaluator only needs F1/F2, and
 * the Durand-Kerner root-finder below loses numerical stability at high
 * orders (many closely-spaced spurious roots), so order 10 is a deliberate
 * accuracy/stability tradeoff, not a speech-DSP convention.
 */
function lpcOrderFor(sampleRate: number): number {
  void sampleRate
  return 10
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
    if (mag < 0.5 || mag > 1.001 || im <= 0) continue // near/inside unit circle, upper half-plane only
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
