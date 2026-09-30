// scripts/run-phoneme-ctc-benchmark.mjs
// Benchmark de la fase B del plan 038: modelo CTC de fonemas contra las
// anotaciones humanas de L2-ARCTIC, hablantes con L1 español.
//
//   node --import tsx scripts/run-phoneme-ctc-benchmark.mjs --corpus=D:/datasets/l2-arctic/parquet
//
// Flags: --limit=N (enunciados por hablante) · --corpus=DIR (o L2ARCTIC_DIR)
//
// Requiere `ffmpeg` en el PATH y tres paquetes que se QUITARON del repo tras la
// pasada del 2026-09-25 (443 MB de node_modules para un benchmark ya resuelto):
//
//   pnpm add -D @huggingface/transformers@3.7.6 hyparquet@1.31.1 hyparquet-compressors@1.1.2
//
// El corpus vive fuera del repo. CC BY-NC 4.0: uso no comercial con atribución.
// Ver lib/pronunciation/acoustic/benchmark/decision-phoneme-ctc.md
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mapManualEvents } from '../lib/pronunciation/acoustic/benchmark/l2arctic-manual-events.ts'
import {
  buildIdToToken,
  decodeAudio,
  decodeCtcFrames,
  normalizeSamples,
  PHONEME_CTC_DTYPE,
  PHONEME_CTC_EVALUATOR_VERSION,
  PHONEME_CTC_MODEL,
} from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-inference.ts'
import { buildPhonemeTrials } from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-trials.ts'
import { computePhonemeCtcBenchmark } from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-metrics.ts'
import { decidePhonemeGate, phaseCUnlocked } from '../lib/pronunciation/acoustic/benchmark/decision-thresholds.ts'
import { SPANISH_L1_SPEAKERS } from '../lib/pronunciation/acoustic/benchmark/l2arctic-loader.ts'

const PRIORITY = ['V', 'B', 'SH', 'TH', 'DH', 'Z', 'IH', 'IY', 'AE', 'AH', 'HH', 'JH', 'NG']

const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const corpusDir = flag('corpus') ?? process.env.L2ARCTIC_DIR
const limit = Number(flag('limit') ?? 0) || null

if (!corpusDir) {
  console.error('Falta --corpus=DIR o la variable L2ARCTIC_DIR')
  process.exit(1)
}

const { parquetReadObjects } = await import('hyparquet')
const { compressors } = await import('hyparquet-compressors')

/**
 * Lee un parquet y devuelve los enunciados de los hablantes pedidos.
 *
 * Dos lecturas a propósito: `utf8: false` es obligatorio para el audio (por
 * defecto hyparquet decodifica los BYTE_ARRAY como texto y **pierde datos**:
 * 85.307 caracteres para 89.842 bytes reales), pero devolvería también los
 * campos de texto en crudo.
 */
async function loadUtterances(path, speakerIds) {
  const buffer = readFileSync(path)
  const file = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const meta = await parquetReadObjects({
    file,
    compressors,
    columns: ['speaker_id', 'native_language', 'utterance_id', 'transcript', 'audio_duration_sec', 'manual_events'],
  })

  const wanted = new Set(speakerIds)
  const indices = meta.flatMap((row, i) => (wanted.has(row.speaker_id) ? [i] : []))
  if (indices.length === 0) return []

  const audio = await parquetReadObjects({ file, compressors, columns: ['audio'], utf8: false })

  return indices.map((i) => {
    const bytes = audio[i].audio.bytes
    if (!(bytes instanceof Uint8Array)) {
      throw new Error(`Audio de ${meta[i].utterance_id} no llegó en bytes crudos; falta utf8: false`)
    }
    return {
      speakerId: meta[i].speaker_id,
      nativeLanguage: meta[i].native_language,
      utteranceId: meta[i].utterance_id,
      transcript: meta[i].transcript,
      durationSec: Number(meta[i].audio_duration_sec),
      audioBytes: bytes,
      phones: mapManualEvents(meta[i].manual_events),
    }
  })
}

/** Carga el modelo. La primera vez baja ~197 MB a la caché de transformers.js. */
async function createSession() {
  const { AutoModelForCTC, Tensor, env } = await import('@huggingface/transformers')
  env.allowLocalModels = false

  const vocab = await fetch(`https://huggingface.co/${PHONEME_CTC_MODEL}/raw/main/vocab.json`).then((r) => r.json())
  const idToToken = buildIdToToken(vocab)
  const model = await AutoModelForCTC.from_pretrained(PHONEME_CTC_MODEL, { dtype: PHONEME_CTC_DTYPE })

  return async (audioBytes) => {
    const audio = normalizeSamples(decodeAudio(audioBytes))
    const start = Date.now()
    const { logits } = await model({ input_values: new Tensor('float32', audio, [1, audio.length]) })
    const latencyMs = Date.now() - start
    const [, frames, vocabSize] = logits.dims
    return { phonemes: decodeCtcFrames(logits.data, frames, vocabSize, idToToken), latencyMs }
  }
}

const files = readdirSync(corpusDir).filter((f) => f.endsWith('.parquet'))
if (files.length === 0) {
  console.error(`No hay .parquet en ${corpusDir}`)
  process.exit(1)
}

let utterances = []
for (const file of files) {
  const found = await loadUtterances(join(corpusDir, file), SPANISH_L1_SPEAKERS)
  utterances.push(...found)
  console.log(`${file}: ${found.length} enunciados de hispanohablantes`)
}

if (limit) {
  const perSpeaker = new Map()
  utterances = utterances.filter((u) => {
    const n = perSpeaker.get(u.speakerId) ?? 0
    if (n >= limit) return false
    perSpeaker.set(u.speakerId, n + 1)
    return true
  })
}

const speakers = [...new Set(utterances.map((u) => u.speakerId))].sort()
console.log(`\n${utterances.length} enunciados · hablantes: ${speakers.join(', ')}`)
console.log(`evaluador: ${PHONEME_CTC_EVALUATOR_VERSION}\n`)

console.log('cargando el modelo…')
const recognize = await createSession()

const trials = []
const latencies = []
let done = 0
for (const utterance of utterances) {
  const { phonemes, latencyMs } = await recognize(utterance.audioBytes)
  latencies.push(latencyMs)
  trials.push(...buildPhonemeTrials(utterance, phonemes, PHONEME_CTC_EVALUATOR_VERSION))
  done += 1
  if (done % 10 === 0) process.stdout.write(`  ${done}/${utterances.length}\r`)
}
console.log(`  ${done}/${utterances.length} listo`)

const report = computePhonemeCtcBenchmark(trials, latencies)
const verdicts = Object.fromEntries(
  Object.entries(report.byPhoneme).map(([p, m]) => [p, decidePhonemeGate(m)]),
)

const pct = (x) => `${(x * 100).toFixed(1)}%`
const o = report.overall
console.log('\n=== TOTAL ===')
console.log(`ensayos ${o.trialCount} · errores humanos ${o.humanErrorCount} · marcados por el modelo ${o.modelFlaggedCount}`)
console.log(`precisión de lo marcado ${pct(o.flaggedPrecision)} · falsa alarma ${pct(o.falseAlarmRate)} · recall ${pct(o.recall)}`)
console.log(`abstención ${pct(o.abstentionRate)} · latencia p50 ${report.latencyP50Ms} ms · p95 ${report.latencyP95Ms} ms`)

console.log('\n=== POR FONEMA (ordenado por errores humanos) ===')
console.log('fonema  errHum  marcados  precisión  falsaAlarma  recall   veredicto')
const rows = Object.entries(report.byPhoneme).sort((a, b) => b[1].humanErrorCount - a[1].humanErrorCount)
for (const [phoneme, m] of rows) {
  const mark = PRIORITY.includes(phoneme) ? '*' : ' '
  console.log(
    `${mark}${phoneme.padEnd(6)} ${String(m.humanErrorCount).padStart(6)} ${String(m.modelFlaggedCount).padStart(9)} ` +
    `${pct(m.flaggedPrecision).padStart(10)} ${pct(m.falseAlarmRate).padStart(12)} ${pct(m.recall).padStart(8)}   ${verdicts[phoneme]}`,
  )
}

const passing = Object.entries(verdicts).filter(([, v]) => v === 'pass').map(([p]) => p)
console.log('\n(* = contraste prioritario de hispanohablantes)')
console.log(`fonemas que pasan la puerta: ${passing.length ? passing.join(', ') : 'ninguno'}`)
console.log(`¿se abre la fase C? ${phaseCUnlocked(verdicts, report.latencyP95Ms) ? 'SÍ' : 'NO'}`)
