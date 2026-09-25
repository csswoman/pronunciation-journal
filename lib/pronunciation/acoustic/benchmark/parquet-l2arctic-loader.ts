/**
 * Cargador de una réplica en parquet de L2-ARCTIC (subconjunto anotado, 16 kHz).
 * Node-only, para el benchmark del plan 038; no se despliega en la app.
 *
 * El corpus **nunca** entra en el repo. Se descarga aparte y la ruta se pasa por
 * `L2ARCTIC_DIR`. Licencia CC BY-NC 4.0: uso no comercial con atribución al
 * paper de Zhao et al. (2018). Ver `decision-phoneme-ctc.md`.
 *
 * Alternativa al cargador de TextGrid (`l2arctic-loader.ts`), que sirve para la
 * distribución oficial en carpetas. Ambos producen los mismos `AnnotatedPhone`.
 */
import { readFileSync } from 'node:fs'
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import type { AnnotatedPhone, PhoneErrorKind } from './l2arctic-loader'

export interface ParquetUtterance {
  speakerId: string
  nativeLanguage: string
  utteranceId: string
  transcript: string
  durationSec: number
  /** Audio FLAC en bytes crudos, listo para decodificar. */
  audioBytes: Uint8Array
  phones: AnnotatedPhone[]
}

interface RawEvent {
  canonical_phoneme: string | null
  perceived_phoneme: string | null
  perceived_raw: string | null
  error_type: string
  start: number
  end: number
}

/** Etiquetas de no-habla: silencio, pausa y ruido. No son fonemas que juzgar. */
const NON_SPEECH = new Set(['SIL', 'SP', 'SPN', ''])

function speechPhoneme(symbol: string | null): string | null {
  if (!symbol) return null
  return NON_SPEECH.has(symbol.toUpperCase()) ? null : symbol
}

function toAnnotatedPhone(event: RawEvent): AnnotatedPhone | null {
  const error: PhoneErrorKind | null =
    event.error_type === 'substitution'
      ? 'substitution'
      : event.error_type === 'deletion'
        ? 'deletion'
        : event.error_type === 'addition'
          ? 'addition'
          : null

  const canonical = speechPhoneme(event.canonical_phoneme)
  const perceived = speechPhoneme(event.perceived_phoneme)

  // Intervalos de no-habla sin fonema a ninguno de los dos lados: nada que medir.
  if (!canonical && !perceived && error === null) return null

  return {
    canonical,
    perceived,
    error,
    // La réplica ya normaliza: un `err` del anotador deja el percibido en null.
    perceivedUncertain: error !== null && !perceived && error !== 'deletion',
    deviation: (event.perceived_raw ?? '').includes('*'),
    startMs: Math.round(event.start * 1000),
    endMs: Math.round(event.end * 1000),
  }
}

/**
 * Lee un fichero parquet y devuelve los enunciados de los hablantes pedidos.
 *
 * Se leen dos veces a propósito: `utf8: false` es obligatorio para el audio
 * (por defecto hyparquet decodifica los bytes como texto y **pierde datos**),
 * pero devolvería también los campos de texto en crudo.
 */
export async function loadParquetUtterances(
  path: string,
  speakerIds: readonly string[],
): Promise<ParquetUtterance[]> {
  const buffer = readFileSync(path)
  const file = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const meta = await parquetReadObjects({
    file,
    compressors,
    columns: [
      'speaker_id',
      'native_language',
      'utterance_id',
      'transcript',
      'audio_duration_sec',
      'manual_events',
    ],
  })

  const wanted = new Set(speakerIds)
  const indices = meta.flatMap((row, i) => (wanted.has(row.speaker_id as string) ? [i] : []))
  if (indices.length === 0) return []

  const audio = await parquetReadObjects({ file, compressors, columns: ['audio'], utf8: false })

  return indices.map((i) => {
    const row = meta[i]
    const bytes = (audio[i].audio as { bytes: Uint8Array }).bytes
    if (!(bytes instanceof Uint8Array)) {
      throw new Error(`Audio de ${row.utterance_id} no llegó en bytes crudos; falta utf8: false`)
    }
    return {
      speakerId: row.speaker_id as string,
      nativeLanguage: row.native_language as string,
      utteranceId: row.utterance_id as string,
      transcript: row.transcript as string,
      durationSec: Number(row.audio_duration_sec),
      audioBytes: bytes,
      phones: (row.manual_events as RawEvent[])
        .map(toAnnotatedPhone)
        .filter((p): p is AnnotatedPhone => p !== null),
    }
  })
}
