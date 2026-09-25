// scripts/l2arctic-smoke.mjs
// Un solo enunciado a través del modelo de fonemas, para medir latencia real en
// CPU antes de comprometer horas de cómputo. Uso:
//   node scripts/l2arctic-smoke.mjs D:/datasets/l2-arctic/parquet/test.parquet
// El corpus vive fuera del repo (CC BY-NC 4.0).
//
// No se usa `pipeline('automatic-speech-recognition')` como dice la ficha del
// modelo: el repo no publica `tokenizer.json` y falla al cargar. Se decodifica
// el CTC a mano, que además es lo que hace falta — da el tramo temporal y la
// probabilidad posterior de cada fonema, que el pipeline no expone.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { AutoModelForCTC, Tensor, env } from '@huggingface/transformers'

const MODEL = 'onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX'
/** wav2vec2 reduce 320 muestras a un frame: 20 ms a 16 kHz. */
const MS_PER_FRAME = 20

const parquetPath = process.argv[2]
if (!parquetPath) {
  console.error('Falta la ruta al .parquet')
  process.exit(1)
}

/**
 * FLAC → Float32 mono 16 kHz vía ffmpeg.
 *
 * Los bytes tienen que venir de `parquetReadObjects({ utf8: false })`: por
 * defecto hyparquet los decodifica como texto y pierde datos (85.307 caracteres
 * por 89.842 bytes reales), así que ffmpeg recibe un FLAC corrupto.
 */
function decodeToPcm(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error(`Se esperaban bytes crudos, llegó ${bytes?.constructor?.name}. Usa utf8: false.`)
  }
  const dir = mkdtempSync(join(tmpdir(), 'l2a-'))
  const src = join(dir, 'in.flac')
  try {
    writeFileSync(src, bytes)
    const raw = execFileSync(
      'ffmpeg',
      ['-v', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'],
      { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
    // Un decodificador que devuelve silencio sin quejarse esconde el fallo.
    if (samples.length === 0) throw new Error('ffmpeg no devolvió muestras')
    return samples
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Normalización zero-mean unit-variance, lo que hace el feature extractor de wav2vec2. */
function normalize(samples) {
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

/** Colapsa los frames CTC en fonemas con tramo y probabilidad posterior media. */
function decodeCtc(logits, frames, vocabSize, idToToken) {
  const out = []
  let current = null

  for (let f = 0; f < frames; f++) {
    const base = f * vocabSize
    let bestId = 0
    let bestLogit = -Infinity
    let maxLogit = -Infinity
    for (let v = 0; v < vocabSize; v++) {
      const value = logits[base + v]
      if (value > maxLogit) maxLogit = value
      if (value > bestLogit) {
        bestLogit = value
        bestId = v
      }
    }
    // Softmax solo para el ganador: exp(best - max) / sum(exp(v - max)).
    let denom = 0
    for (let v = 0; v < vocabSize; v++) denom += Math.exp(logits[base + v] - maxLogit)
    const probability = Math.exp(bestLogit - maxLogit) / denom

    if (bestId === current?.id) {
      current.frames.push(probability)
      continue
    }
    if (current) out.push(current)
    current = { id: bestId, startFrame: f, frames: [probability] }
  }
  if (current) out.push(current)

  return out
    .filter((seg) => idToToken[seg.id] && !idToToken[seg.id].startsWith('<'))
    .map((seg) => ({
      ipa: idToToken[seg.id],
      startMs: seg.startFrame * MS_PER_FRAME,
      endMs: (seg.startFrame + seg.frames.length) * MS_PER_FRAME,
      confidence: seg.frames.reduce((a, b) => a + b, 0) / seg.frames.length,
    }))
}

const buffer = readFileSync(parquetPath)
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
// Dos lecturas a propósito: `utf8: false` es obligatorio para el audio pero
// devolvería también los campos de texto en crudo.
const READ = { file: arrayBuffer, compressors, rowStart: 0, rowEnd: 40 }
const rows = await parquetReadObjects(READ)
const index = rows.findIndex((r) => r.speaker_id === 'NJS')
if (index === -1) {
  console.error('No hay filas de NJS en las primeras 40')
  process.exit(1)
}
const row = rows[index]
const audioRows = await parquetReadObjects({ ...READ, columns: ['audio'], utf8: false })
const audioBytes = audioRows[index].audio.bytes

console.log(`hablante ${row.speaker_id} (${row.native_language}) · ${row.utterance_id}`)
console.log(`transcript: ${row.transcript}`)
console.log(`duración: ${Number(row.audio_duration_sec).toFixed(2)} s`)

const audio = normalize(decodeToPcm(audioBytes))
console.log(`pcm: ${audio.length} muestras a 16 kHz`)

env.allowLocalModels = false
const vocab = await fetch(`https://huggingface.co/${MODEL}/raw/main/vocab.json`).then((r) => r.json())
const idToToken = []
for (const [token, id] of Object.entries(vocab)) idToToken[id] = token

console.log(`\ncargando ${MODEL} (q4f16, ~197 MB)…`)
const loadStart = Date.now()
const model = await AutoModelForCTC.from_pretrained(MODEL, { dtype: 'q4f16' })
console.log(`modelo listo en ${((Date.now() - loadStart) / 1000).toFixed(1)} s`)

const inferStart = Date.now()
const { logits } = await model({
  input_values: new Tensor('float32', audio, [1, audio.length]),
})
const latencyMs = Date.now() - inferStart

const [, frames, vocabSize] = logits.dims
const recognized = decodeCtc(logits.data, frames, vocabSize, idToToken)

console.log(`\ninferencia: ${latencyMs} ms para ${Number(row.audio_duration_sec).toFixed(2)} s de audio`)
console.log(`frames: ${frames} · vocabulario: ${vocabSize}`)
console.log(`\nreconocido (${recognized.length}): ${recognized.map((p) => p.ipa).join(' ')}`)
console.log(`canónico   (${row.canonical_phonemes.length}): ${row.canonical_phonemes.map((p) => p.phoneme).join(' ')}`)
console.log(`percibido  (${row.phonemes.length}): ${row.phonemes.map((p) => p.phoneme).join(' ')}`)
console.log(`errores humanos: sub ${row.num_substitutions} del ${row.num_deletions} add ${row.num_additions}`)
console.log(`confianza media: ${(recognized.reduce((a, p) => a + p.confidence, 0) / recognized.length).toFixed(3)}`)
