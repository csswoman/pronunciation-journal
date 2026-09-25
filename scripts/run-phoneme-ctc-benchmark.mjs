// scripts/run-phoneme-ctc-benchmark.mjs
// Benchmark de la fase B del plan 038: modelo CTC de fonemas contra las
// anotaciones humanas de L2-ARCTIC, hablantes con L1 español.
//
//   node --import tsx scripts/run-phoneme-ctc-benchmark.mjs --limit=50
//
// Flags: --limit=N (enunciados por hablante) · --corpus=DIR (o L2ARCTIC_DIR)
// El corpus vive fuera del repo. CC BY-NC 4.0: uso no comercial con atribución.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadParquetUtterances } from '../lib/pronunciation/acoustic/benchmark/parquet-l2arctic-loader.ts'
import { createPhonemeCtcSession, PHONEME_CTC_EVALUATOR_VERSION } from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-inference.ts'
import { buildPhonemeTrials } from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-trials.ts'
import { computePhonemeCtcBenchmark } from '../lib/pronunciation/acoustic/benchmark/phoneme-ctc-metrics.ts'
import { decidePhonemeGate, phaseCUnlocked } from '../lib/pronunciation/acoustic/benchmark/decision-thresholds.ts'
import { SPANISH_L1_SPEAKERS } from '../lib/pronunciation/acoustic/benchmark/l2arctic-loader.ts'

const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const corpusDir = flag('corpus') ?? process.env.L2ARCTIC_DIR
const limit = Number(flag('limit') ?? 0) || null
const PRIORITY = ['V', 'B', 'SH', 'TH', 'DH', 'Z', 'IH', 'IY', 'AE', 'AH', 'HH', 'JH', 'NG']

if (!corpusDir) {
  console.error('Falta --corpus=DIR o la variable L2ARCTIC_DIR')
  process.exit(1)
}

const files = readdirSync(corpusDir).filter((f) => f.endsWith('.parquet'))
if (files.length === 0) {
  console.error(`No hay .parquet en ${corpusDir}`)
  process.exit(1)
}

let utterances = []
for (const file of files) {
  const found = await loadParquetUtterances(join(corpusDir, file), SPANISH_L1_SPEAKERS)
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
const session = await createPhonemeCtcSession()

const trials = []
const latencies = []
let done = 0
for (const utterance of utterances) {
  const { phonemes, latencyMs } = await session.recognize(utterance.audioBytes)
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
console.log('\n=== TOTAL ===')
const o = report.overall
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
console.log(`\n(* = contraste prioritario de hispanohablantes)`)
console.log(`fonemas que pasan la puerta: ${passing.length ? passing.join(', ') : 'ninguno'}`)
console.log(`¿se abre la fase C? ${phaseCUnlocked(verdicts, report.latencyP95Ms) ? 'SÍ' : 'NO'}`)
