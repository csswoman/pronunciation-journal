/**
 * Script CLI: Pre-generación de audio Gemini TTS para las misiones guiadas del catálogo.
 *
 * Las misiones de `SCRIPTED_MISSIONS` no llevan `modelAudio` en el código: el runtime
 * resuelve el audio bajo demanda (`fetchMissionLineAudio` → `/api/gemini/mission-audio`),
 * generándolo la primera vez que un usuario abre la misión. Eso significa que la primera
 * apertura espera la síntesis en vivo o, si esa petición falla, cae a la voz robótica del
 * navegador (`speechSynthesis`).
 *
 * Este script recorre el catálogo y deja el WAV de cada línea (coach y learner)
 * pre-generado en Supabase Storage (`mission-audio/catalog/{lineId}.wav`), usando el
 * mismo esquema de rutas que la ruta API. Es idempotente: salta las líneas que ya
 * tienen archivo salvo que se pase `--force`.
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local scripts/pregenerate-mission-audio.ts
 *   pnpm tsx --env-file=.env.local scripts/pregenerate-mission-audio.ts --mission scripted.cafe.order
 *   pnpm tsx --env-file=.env.local scripts/pregenerate-mission-audio.ts --force --dry-run
 *
 * Flags:
 *   --mission <id>        Procesa solo esa misión (repetible).
 *   --force               Regenera aunque el archivo ya exista en Storage.
 *   --dry-run             No genera ni sube; solo informa qué haría.
 *   --coach-voice <name>  Voz Gemini para líneas del coach (default: Puck).
 *   --learner-voice <name> Voz Gemini para líneas del learner (default: Kore).
 *   --rpm <n>            Peticiones TTS por minuto (default: 3, el límite del free tier).
 *   --max-retries <n>    Reintentos ante 429 antes de rendirse (default: 5).
 *
 * Nota: el free tier de Gemini TTS admite ~3 req/min. Con los 60 diálogos del
 * catálogo la corrida completa tarda ~20 min; es idempotente, así que si se corta
 * basta con volver a lanzarlo y retoma donde quedó.
 */

import { getSupabaseAdminClient } from '@/lib/supabase/service-role'
import { generateMissionSpeech, type GenerateSpeechOptions } from '@/lib/gemini/audio'
import { SCRIPTED_MISSIONS } from '@/lib/ai-practice/missions/scripted/catalog'
import type { ScriptLine, ScriptedMission } from '@/lib/ai-practice/missions/types'

const BUCKET = 'mission-audio'
const CATALOG_FOLDER = 'catalog'

type GeminiVoice = NonNullable<GenerateSpeechOptions['voice']>

interface CliOptions {
  missionIds: string[]
  force: boolean
  dryRun: boolean
  coachVoice: GeminiVoice
  learnerVoice: GeminiVoice
  rpm: number
  maxRetries: number
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    missionIds: [],
    force: false,
    dryRun: false,
    coachVoice: 'Puck',
    learnerVoice: 'Kore',
    rpm: 3,
    maxRetries: 5,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--mission' && argv[i + 1]) {
      opts.missionIds.push(argv[i + 1] as string)
      i += 1
    } else if (arg === '--force') {
      opts.force = true
    } else if (arg === '--dry-run') {
      opts.dryRun = true
    } else if (arg === '--coach-voice' && argv[i + 1]) {
      opts.coachVoice = argv[i + 1] as GeminiVoice
      i += 1
    } else if (arg === '--learner-voice' && argv[i + 1]) {
      opts.learnerVoice = argv[i + 1] as GeminiVoice
      i += 1
    } else if (arg === '--rpm' && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1] as string, 10)
      if (Number.isFinite(parsed) && parsed > 0) opts.rpm = parsed
      i += 1
    } else if (arg === '--max-retries' && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1] as string, 10)
      if (Number.isFinite(parsed) && parsed >= 0) opts.maxRetries = parsed
      i += 1
    }
  }

  return opts
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Detecta un 429 de cuota en el mensaje de error de la librería de Gemini. */
function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('"code":429') || message.includes('RESOURCE_EXHAUSTED') || message.includes(' 429')
}

/** Lee el retryDelay sugerido por la API (segundos) del mensaje de error; fallback 20s. */
function retryDelayMs(err: unknown, fallbackMs: number): number {
  const message = err instanceof Error ? err.message : String(err)
  const match = message.match(/"retryDelay":"(\d+)s"/) ?? message.match(/retry in ([\d.]+)s/)
  if (match?.[1]) {
    const seconds = Number.parseFloat(match[1])
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000) + 1_000
  }
  return fallbackMs
}

/**
 * Genera el WAV reintentando ante 429 con la espera que sugiere la API.
 * El free tier admite ~3 req/min, así que un pico de 429 es esperable y recuperable.
 */
async function generateWithRetry(
  apiKey: string,
  text: string,
  voice: GeminiVoice,
  maxRetries: number,
): Promise<Buffer> {
  let attempt = 0
  for (;;) {
    try {
      return await generateMissionSpeech(apiKey, text, { voice })
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= maxRetries) throw err
      attempt += 1
      const waitMs = retryDelayMs(err, 20_000)
      console.log(`    · 429, esperando ${Math.round(waitMs / 1000)}s (reintento ${attempt}/${maxRetries})`)
      await sleep(waitMs)
    }
  }
}

/** Mismo saneado de id que `app/api/gemini/mission-audio/route.ts`. */
function safeLineId(lineId: string): string {
  return lineId.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function storagePathFor(lineId: string): string {
  return `${CATALOG_FOLDER}/${safeLineId(lineId)}.wav`
}

async function fileExists(
  client: ReturnType<typeof getSupabaseAdminClient>,
  lineId: string,
): Promise<boolean> {
  const fileName = `${safeLineId(lineId)}.wav`
  const { data, error } = await client.storage
    .from(BUCKET)
    .list(CATALOG_FOLDER, { search: fileName, limit: 5 })

  if (error) {
    // Si no podemos comprobar, tratamos como inexistente y dejamos que el upsert decida.
    return false
  }
  return Boolean(data?.some((f) => f.name === fileName))
}

interface LineJob {
  mission: ScriptedMission
  line: ScriptLine
  voice: GeminiVoice
}

interface RunSummary {
  generated: number
  skipped: number
  errors: number
}

type LineOutcome = 'generated' | 'skipped' | 'error'

async function processLine(
  client: ReturnType<typeof getSupabaseAdminClient>,
  apiKey: string,
  job: LineJob,
  opts: CliOptions,
  summary: RunSummary,
): Promise<LineOutcome> {
  const { line, mission, voice } = job
  const label = `${mission.id} · ${line.id} (${line.speaker}/${voice})`

  if (!opts.force && (await fileExists(client, line.id))) {
    console.log(`  ↷ existe   ${label}`)
    summary.skipped += 1
    return 'skipped'
  }

  if (opts.dryRun) {
    console.log(`  ○ dry-run  ${label} — "${line.text}"`)
    summary.generated += 1
    return 'generated'
  }

  try {
    const wavBuffer = await generateWithRetry(apiKey, line.text, voice, opts.maxRetries)
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(storagePathFor(line.id), wavBuffer, {
        contentType: 'audio/wav',
        upsert: true,
      })

    if (uploadError) {
      console.error(`  ✗ subida   ${label} — ${uploadError.message}`)
      summary.errors += 1
      return 'error'
    }

    console.log(`  ✓ generado ${label}`)
    summary.generated += 1
    return 'generated'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ error    ${label} — ${message}`)
    summary.errors += 1
    return 'error'
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('Falta GEMINI_API_KEY. Ejecuta con: pnpm tsx --env-file=.env.local scripts/pregenerate-mission-audio.ts')
    process.exit(1)
  }

  let client: ReturnType<typeof getSupabaseAdminClient>
  try {
    client = getSupabaseAdminClient()
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  const missions = opts.missionIds.length
    ? SCRIPTED_MISSIONS.filter((m) => opts.missionIds.includes(m.id))
    : SCRIPTED_MISSIONS

  if (missions.length === 0) {
    console.error(`Ninguna misión coincide con: ${opts.missionIds.join(', ')}`)
    process.exit(1)
  }

  const jobs: LineJob[] = missions.flatMap((mission) =>
    mission.script.map((line) => ({
      mission,
      line,
      voice: line.speaker === 'coach' ? opts.coachVoice : opts.learnerVoice,
    })),
  )

  console.log(
    `Pre-generando audio de misiones${opts.dryRun ? ' (DRY RUN)' : ''}: ` +
      `${missions.length} misiones, ${jobs.length} líneas` +
      `${opts.force ? ', --force' : ''}` +
      `${opts.dryRun ? '' : `, ${opts.rpm} req/min`}\n`,
  )

  const summary: RunSummary = { generated: 0, skipped: 0, errors: 0 }
  const minGapMs = opts.dryRun ? 0 : Math.ceil(60_000 / opts.rpm)
  let currentMission = ''

  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i] as LineJob
    if (job.mission.id !== currentMission) {
      currentMission = job.mission.id
      console.log(`${job.mission.id}`)
    }
    // Secuencial a propósito: mantiene el ritmo por debajo del límite de la API TTS.
    const startedAt = Date.now()
    const outcome = await processLine(client, apiKey, job, opts, summary)

    // Throttle solo tras una llamada real a la API; 'existe' no consume cuota.
    if (outcome === 'generated' && !opts.dryRun && i < jobs.length - 1) {
      const elapsed = Date.now() - startedAt
      const wait = minGapMs - elapsed
      if (wait > 0) await sleep(wait)
    }
  }

  console.log(
    `\nHecho. Generadas: ${summary.generated}  Saltadas: ${summary.skipped}  Errores: ${summary.errors}`,
  )
  process.exit(summary.errors > 0 ? 1 : 0)
}

void main()
