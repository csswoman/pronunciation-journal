/**
 * Piezas puras de la inferencia del modelo de fonemas CTC, para el benchmark del
 * plan 038: decodificar audio, normalizar y colapsar los frames CTC.
 *
 * La carga del modelo vive en `scripts/run-phoneme-ctc-benchmark.mjs`, no aquí:
 * `@huggingface/transformers` se quitó del repo tras la pasada del 2026-09-25
 * (443 MB de `node_modules` para un benchmark ya resuelto). Con este límite, los
 * tests de este fichero no necesitan instalar nada. Ver `decision-phoneme-ctc.md`.
 *
 * No se usa `pipeline('automatic-speech-recognition')` como sugiere la ficha del
 * modelo: el repo **no publica `tokenizer.json`** y la carga falla. Decodificar
 * el CTC a mano es además lo que hace falta — el pipeline no expone el tramo
 * temporal ni la probabilidad posterior de cada fonema.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RecognizedPhoneme } from '../phoneme-ctc-evaluator'

export const PHONEME_CTC_MODEL = 'onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX'
/** Variante cuantizada más pequeña: 196,9 MB, bajo el STOP de 400 MB del plan. */
export const PHONEME_CTC_DTYPE = 'q4f16'
export const PHONEME_CTC_EVALUATOR_VERSION = `${PHONEME_CTC_MODEL}@${PHONEME_CTC_DTYPE}/ctc-argmax-v1`

/** wav2vec2 reduce 320 muestras a un frame: 20 ms a 16 kHz. */
const MS_PER_FRAME = 20
const SAMPLE_RATE = 16000

/**
 * FLAC/WAV en bytes → Float32 mono a 16 kHz, vía ffmpeg.
 *
 * Lanza si no sale audio: un decodificador que devuelve silencio en silencio
 * convierte un fallo de formato en "el modelo no reconoció nada".
 */
export function decodeAudio(bytes: Uint8Array): Float32Array {
  const dir = mkdtempSync(join(tmpdir(), 'l2a-'))
  const src = join(dir, 'in.audio')
  try {
    writeFileSync(src, bytes)
    const raw = execFileSync(
      'ffmpeg',
      ['-v', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', String(SAMPLE_RATE), '-'],
      { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
    if (samples.length === 0) throw new Error('ffmpeg no devolvió muestras')
    return samples
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Zero-mean unit-variance: lo que hace el feature extractor de wav2vec2. */
export function normalizeSamples(samples: Float32Array): Float32Array {
  let sum = 0
  for (const s of samples) sum += s
  const mean = sum / samples.length
  let variance = 0
  for (const s of samples) variance += (s - mean) ** 2
  const std = Math.sqrt(variance / samples.length) + 1e-7
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) out[i] = (samples[i] - mean) / std
  return out
}

/**
 * Colapsa los frames CTC en fonemas con tramo y probabilidad posterior media.
 * Se descartan los tokens especiales (`<pad>` es el blank del CTC).
 */
export function decodeCtcFrames(
  logits: Float32Array | number[],
  frames: number,
  vocabSize: number,
  idToToken: readonly (string | undefined)[],
): RecognizedPhoneme[] {
  const segments: { id: number; startFrame: number; probabilities: number[] }[] = []
  let current: { id: number; startFrame: number; probabilities: number[] } | null = null

  for (let f = 0; f < frames; f++) {
    const base = f * vocabSize
    let bestId = 0
    let bestLogit = -Infinity
    for (let v = 0; v < vocabSize; v++) {
      if (logits[base + v] > bestLogit) {
        bestLogit = logits[base + v]
        bestId = v
      }
    }
    // Softmax estable solo para el ganador; el máximo ya es bestLogit.
    let denom = 0
    for (let v = 0; v < vocabSize; v++) denom += Math.exp(logits[base + v] - bestLogit)
    const probability = 1 / denom

    if (current && bestId === current.id) {
      current.probabilities.push(probability)
      continue
    }
    if (current) segments.push(current)
    current = { id: bestId, startFrame: f, probabilities: [probability] }
  }
  if (current) segments.push(current)

  return segments
    .filter((s) => {
      const token = idToToken[s.id]
      return token !== undefined && !token.startsWith('<')
    })
    .map((s) => ({
      ipa: idToToken[s.id] as string,
      startMs: s.startFrame * MS_PER_FRAME,
      endMs: (s.startFrame + s.probabilities.length) * MS_PER_FRAME,
      confidence: s.probabilities.reduce((a, b) => a + b, 0) / s.probabilities.length,
    }))
}

/** Invierte el `vocab.json` del modelo: id de token → símbolo. */
export function buildIdToToken(vocab: Record<string, number>): (string | undefined)[] {
  const idToToken: (string | undefined)[] = []
  for (const [token, id] of Object.entries(vocab)) idToToken[id] = token
  return idToToken
}


