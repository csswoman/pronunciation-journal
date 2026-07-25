/**
 * Node-only benchmark harness for plan 071. Not deployed to the app.
 * Loads a local corpus subset (Task 6), runs the formant extraction +
 * classification pipeline on each item, compares predicted vowel vs the
 * item's targetVowel, and computes ship/no-ship verdicts per contrast using
 * the pre-fixed thresholds.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

/** Slices `samples` to `[startMs, endMs)` if both are provided (Task 6b analysis window); returns the full clip unchanged otherwise. */
function sliceToWindow(samples: Float32Array, sampleRate: number, startMs?: number, endMs?: number): Float32Array {
  if (startMs === undefined || endMs === undefined) return samples
  const startSample = Math.max(0, Math.round((startMs / 1000) * sampleRate))
  const endSample = Math.min(samples.length, Math.round((endMs / 1000) * sampleRate))
  return samples.slice(startSample, endSample)
}

export async function runBenchmarkOnItems(items: CorpusItem[], loadAudio: AudioLoader): Promise<BenchmarkReport> {
  const trials: BenchmarkTrial[] = []

  for (const item of items) {
    const audio = loadAudio(item.clipFile)
    if (!audio) {
      trials.push({ targetVowel: item.targetVowel, predictedVowel: null, abstained: true, humanScore: item.humanScore })
      continue
    }

    const windowedSamples = sliceToWindow(audio.samples, audio.sampleRate, item.windowStartMs, item.windowEndMs)
    const formants = extractFormants(windowedSamples, audio.sampleRate)
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
