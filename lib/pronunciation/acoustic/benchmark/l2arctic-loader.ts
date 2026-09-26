/**
 * Cargador del subconjunto anotado a mano de L2-ARCTIC, hablantes con L1
 * español. Node-only, para el benchmark de la fase B del plan 038; no se
 * despliega en la app.
 *
 * El corpus **nunca** entra en el repo: ni audio ni etiquetas. Se descarga
 * aparte (licencia CC BY-NC 4.0, hay que aceptarla) y la ruta se pasa por la
 * variable de entorno `L2ARCTIC_DIR`.
 *
 * Convención de etiquetas del tier "phones" (documentación del PSI Lab):
 * - correcto            → `AH`
 * - sustitución         → `CPL,PPL,s`   (p. ej. `AH,AO*,s`; `*` = desviación)
 * - omisión             → `CPL,sil,d`
 * - adición / epéntesis → `sil,PPL,a`
 * - percibido dudoso    → `CPL,err,s`
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findTier, parseTextGrid } from './textgrid'

/** Los 4 hablantes de L2-ARCTIC con L1 español (2 hombres, 2 mujeres). */
export const SPANISH_L1_SPEAKERS = ['EBVS', 'ERMS', 'MBMPS', 'NJS'] as const

export type PhoneErrorKind = 'substitution' | 'deletion' | 'addition'

export interface AnnotatedPhone {
  /** ARPAbet canónico: lo que debía producirse. Null en una adición. */
  canonical: string | null
  /** ARPAbet percibido: lo que se produjo. Null en una omisión. */
  perceived: string | null
  /** Null cuando el anotador dejó la etiqueta del alineador, es decir correcto. */
  error: PhoneErrorKind | null
  /** El anotador no pudo juzgar el fonema percibido (`err`). */
  perceivedUncertain: boolean
  /** El percibido sonó como una desviación con acento (`*`). */
  deviation: boolean
  startMs: number
  endMs: number
}

export interface L2ArcticUtterance {
  speakerId: string
  /** Nombre base del fichero, p. ej. `arctic_a0018`. */
  utteranceId: string
  /** Ruta absoluta al WAV (44,1 kHz; hay que remuestrear a 16 kHz). */
  wavPath: string
  phones: AnnotatedPhone[]
}

const SILENCE = new Set(['sil', 'sp', 'spn', '', 'sp1'])

/** Una etiqueta del tier "phones" → fonema anotado. Null si es silencio puro. */
export function parsePhoneLabel(
  label: string,
  startMs: number,
  endMs: number,
): AnnotatedPhone | null {
  const parts = label.split(',').map((p) => p.trim())

  if (parts.length < 3) {
    const bare = parts[0] ?? ''
    if (SILENCE.has(bare.toLowerCase())) return null
    const canonical = bare.replace(/\d+$/, '').toUpperCase()
    return {
      canonical,
      perceived: canonical,
      error: null,
      perceivedUncertain: false,
      deviation: false,
      startMs,
      endMs,
    }
  }

  const [rawCanonical, rawPerceived, rawKind] = parts
  const deviation = rawPerceived.includes('*')
  const perceivedClean = rawPerceived.replace(/\*/g, '').trim()
  const perceivedUncertain = perceivedClean.toLowerCase() === 'err'

  const kind: PhoneErrorKind | null =
    rawKind === 's' ? 'substitution' : rawKind === 'd' ? 'deletion' : rawKind === 'a' ? 'addition' : null

  const norm = (value: string) =>
    SILENCE.has(value.toLowerCase()) || value.toLowerCase() === 'err'
      ? null
      : value.replace(/\d+$/, '').toUpperCase()

  return {
    canonical: norm(rawCanonical),
    perceived: norm(perceivedClean),
    error: kind,
    perceivedUncertain,
    deviation,
    startMs,
    endMs,
  }
}

/** Lee un TextGrid de anotación y devuelve sus fonemas, sin los silencios. */
export function parseAnnotationTextGrid(raw: string): AnnotatedPhone[] {
  const tier = findTier(parseTextGrid(raw), 'phones')
  if (!tier) {
    throw new Error('El TextGrid de anotación no tiene un tier "phones"')
  }
  return tier.intervals
    .map((i) => parsePhoneLabel(i.text, i.startMs, i.endMs))
    .filter((p): p is AnnotatedPhone => p !== null)
}

/**
 * Enunciados anotados a mano de un hablante. Solo se devuelven los que tienen
 * anotación **y** WAV: un par incompleto se salta en silencio porque el corpus
 * documenta que a algunos hablantes les faltan grabaciones.
 */
export function loadSpeakerUtterances(rootDir: string, speakerId: string): L2ArcticUtterance[] {
  const annotationDir = join(rootDir, speakerId, 'annotation')
  const wavDir = join(rootDir, speakerId, 'wav')
  if (!existsSync(annotationDir)) return []

  return readdirSync(annotationDir)
    .filter((file) => file.toLowerCase().endsWith('.textgrid'))
    .map((file) => {
      const utteranceId = file.replace(/\.TextGrid$/i, '')
      const wavPath = join(wavDir, `${utteranceId}.wav`)
      if (!existsSync(wavPath)) return null
      return {
        speakerId,
        utteranceId,
        wavPath,
        phones: parseAnnotationTextGrid(readFileSync(join(annotationDir, file), 'utf-8')),
      }
    })
    .filter((u): u is L2ArcticUtterance => u !== null)
}

/**
 * Subconjunto anotado de los 4 hablantes de español. Falla ruidosamente si no
 * encuentra ninguno: un benchmark sobre cero enunciados no es un resultado.
 */
export function loadSpanishL1Utterances(rootDir: string): L2ArcticUtterance[] {
  const utterances = SPANISH_L1_SPEAKERS.flatMap((speaker) =>
    loadSpeakerUtterances(rootDir, speaker),
  )
  if (utterances.length === 0) {
    throw new Error(
      `No se encontró ningún enunciado anotado de ${SPANISH_L1_SPEAKERS.join(', ')} en ${rootDir}. ` +
        'Comprueba L2ARCTIC_DIR y que el corpus incluya las carpetas annotation/ y wav/.',
    )
  }
  return utterances
}
