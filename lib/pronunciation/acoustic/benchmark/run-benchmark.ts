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
import {
  decidePhonemeGate,
  decideVowelContrastVerdict,
  phaseCUnlocked,
  type ContrastVerdict,
  type PhonemeGateVerdict,
  SHIP_AGREEMENT_THRESHOLD,
} from './decision-thresholds'
import type { L2ArcticUtterance } from './l2arctic-loader'
import {
  computePhonemeCtcBenchmark,
  type PhonemeCtcBenchmark,
  type PhonemeTrial,
} from './phoneme-ctc-metrics'
import { buildPhonemeTrials } from './phoneme-ctc-trials'
import type { RecognizedPhoneme } from '../phoneme-ctc-evaluator'

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

// ── Plan 038, fase B: CTC de fonemas sobre L2-ARCTIC ────────────────────────
//
// Evaluador y corpus distintos, mismo arnés. Nada de esto toca el evaluador de
// formantes ni el extractor de speechocean762 de arriba.
//
// Uso (el corpus va fuera del repo y hay que aceptar su licencia):
//   L2ARCTIC_DIR=D:/datasets/l2-arctic pnpm tsx <este fichero> --evaluator=phoneme_ctc
//
// `recognize` se inyecta a propósito: la inferencia real (ONNX, 197 MB) no es
// parte de este módulo, así que el arnés se testea con salida simulada.

export interface PhonemeCtcFlags {
  evaluator: 'formant_dsp' | 'phoneme_ctc'
  /** Raíz del corpus; por defecto `L2ARCTIC_DIR`. */
  corpusDir: string | null
  /** Límite de enunciados, para una pasada rápida. */
  limit: number | null
}

/** Lee las flags del benchmark de argv. Desconocidas: se ignoran en silencio. */
export function parsePhonemeCtcFlags(argv: string[], env: Record<string, string | undefined> = {}): PhonemeCtcFlags {
  const get = (name: string): string | null => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.slice(name.length + 3) : null
  }
  const limit = get('limit')
  return {
    evaluator: get('evaluator') === 'phoneme_ctc' ? 'phoneme_ctc' : 'formant_dsp',
    corpusDir: get('corpus') ?? env.L2ARCTIC_DIR ?? null,
    limit: limit === null || Number.isNaN(Number(limit)) ? null : Number(limit),
  }
}

/** Reconoce los fonemas de un enunciado. La implementación real vive fuera de este módulo. */
export type PhonemeRecognizer = (
  utterance: L2ArcticUtterance,
) => Promise<{ phonemes: RecognizedPhoneme[]; latencyMs: number }>

export interface PhonemeCtcReport extends PhonemeCtcBenchmark {
  verdicts: Record<string, PhonemeGateVerdict>
  phaseCUnlocked: boolean
  utteranceCount: number
}

export async function runPhonemeCtcBenchmark(
  utterances: L2ArcticUtterance[],
  recognize: PhonemeRecognizer,
  evaluatorVersion: string,
): Promise<PhonemeCtcReport> {
  const trials: PhonemeTrial[] = []
  const latencies: number[] = []

  for (const utterance of utterances) {
    const { phonemes, latencyMs } = await recognize(utterance)
    latencies.push(latencyMs)
    trials.push(...buildPhonemeTrials(utterance, phonemes, evaluatorVersion))
  }

  const benchmark = computePhonemeCtcBenchmark(trials, latencies)
  const verdicts: Record<string, PhonemeGateVerdict> = {}
  for (const [phoneme, metrics] of Object.entries(benchmark.byPhoneme)) {
    verdicts[phoneme] = decidePhonemeGate(metrics)
  }

  return {
    ...benchmark,
    verdicts,
    phaseCUnlocked: phaseCUnlocked(verdicts, benchmark.latencyP95Ms),
    utteranceCount: utterances.length,
  }
}
