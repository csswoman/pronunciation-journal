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
