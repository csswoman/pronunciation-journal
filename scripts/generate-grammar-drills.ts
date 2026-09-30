/**
 * Generate grammar drills with tolerant local grading specifications for CEFR decks.
 *
 * Reads decks from public/grammar-decks/*.json, identifies eligible CEFR decks (A1–C1)
 * lacking drills, and calls Gemini to generate structured drills matching GrammarDrillSchema.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/generate-grammar-drills.ts --level a1 --limit 3 --dry-run
 *   pnpm tsx --env-file=.env.local scripts/generate-grammar-drills.ts --deck a1-verbo-to-be --dry-run
 *   pnpm tsx --env-file=.env.local scripts/generate-grammar-drills.ts --level b1 --limit 10
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  GRAMMAR_DRILL_SYSTEM_PROMPT,
  buildGrammarDrillPrompt,
} from '../lib/ai-prompts'
import { callWithFallback } from '../lib/gemini/client'
import { GrammarDrillSchema, type GrammarDrill } from '../lib/courses/grammar-deck/drill-schema'
import { DRILL_PROFILES, type DrillLevel } from '../lib/exercises/grammar-drill/profiles'

const DECKS_DIR = path.join(process.cwd(), 'public', 'grammar-decks')
const REPORT_FILE = path.join(process.cwd(), 'scripts', 'content', 'grammar-drills-report.json')

const PILOT_SLUGS: Record<DrillLevel, string> = {
  A1: 'a1-verbo-to-be',
  A2: 'a2-pasado-to-be',
  B1: 'b1-segundo-condicional',
  B2: 'b2-tercer-condicional',
  C1: 'c1-enfasis-inversion-avanzada',
}

interface GrammarDeckData {
  meta?: { title?: string; eyebrow?: string; goal?: string }
  cards?: Array<{
    title?: string
    lede?: string
    blocks?: Array<{ type: string; rows?: unknown[]; columns?: unknown[]; lines?: unknown[] }>
  }>
  drill?: GrammarDrill
  [key: string]: unknown
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const overwrite = args.includes('--overwrite')

const deckArgIndex = args.indexOf('--deck')
const targetDeckSlug = deckArgIndex >= 0 ? args[deckArgIndex + 1]?.replace(/\.json$/, '') : null

const levelArgIndex = args.indexOf('--level')
const targetLevel = levelArgIndex >= 0 ? args[levelArgIndex + 1]?.toUpperCase() as DrillLevel : null

const limitArgIndex = args.indexOf('--limit')
const limit = limitArgIndex >= 0 ? Number.parseInt(args[limitArgIndex + 1], 10) : 25

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const EXCLUDED_PATTERNS = ['sonido', 'vocales', 'pronunciacion', 'audio', 'alfabeto']

function isEligibleDeck(slug: string, content: GrammarDeckData): boolean {
  const prefix = slug.slice(0, 3).toUpperCase()
  if (!['A1-', 'A2-', 'B1-', 'B2-', 'C1-'].includes(prefix)) return false

  for (const pat of EXCLUDED_PATTERNS) {
    if (slug.includes(pat)) return false
  }

  // Al menos una tarjeta con rules, conjugation, contrast o pairs
  const hasGrammarBlock = (content.cards ?? []).some((card) =>
    (card.blocks ?? []).some((block) =>
      ['rules', 'conjugation', 'contrast', 'pairs'].includes(block.type)
    )
  )

  return hasGrammarBlock
}

function parseDrillResponse(rawText: string): GrammarDrill {
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  const cleaned = (firstBrace >= 0 && lastBrace > firstBrace)
    ? rawText.slice(firstBrace, lastBrace + 1)
    : rawText.trim().replace(/^```json\s*|\s*```$/g, '')

  const parsed = JSON.parse(cleaned)
  const validated = GrammarDrillSchema.parse({
    ...parsed,
    reviewed: false,
  })

  return validated
}

async function generateDrillForDeck(apiKey: string, deck: GrammarDeckData, level: DrillLevel): Promise<GrammarDrill> {
  const profile = DRILL_PROFILES[level]

  let pilot: unknown = null
  const pilotSlug = PILOT_SLUGS[level]
  if (pilotSlug) {
    const pilotPath = path.join(DECKS_DIR, `${pilotSlug}.json`)
    if (fs.existsSync(pilotPath)) {
      const pRaw = JSON.parse(fs.readFileSync(pilotPath, 'utf8')) as GrammarDeckData
      pilot = pRaw.drill
    }
  }

  const prompt = buildGrammarDrillPrompt({ deck, profile, pilot })

  return callWithFallback(
    apiKey,
    {
      contents: prompt,
      config: {
        systemInstruction: GRAMMAR_DRILL_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    },
    parseDrillResponse,
    { timeoutMs: 35_000 }
  )
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey && !dryRun) {
    console.error('Error: GEMINI_API_KEY is required for generation.')
    process.exit(1)
  }

  const allFiles = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json'))
  const candidateSlugs: string[] = []
  const excludedSlugs: string[] = []

  for (const file of allFiles) {
    const slug = file.replace(/\.json$/, '')
    const fullPath = path.join(DECKS_DIR, file)
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as GrammarDeckData

    if (!isEligibleDeck(slug, content)) {
      excludedSlugs.push(slug)
      continue
    }

    if (targetLevel && !slug.toUpperCase().startsWith(`${targetLevel}-`)) {
      continue
    }

    if (targetDeckSlug && slug !== targetDeckSlug) {
      continue
    }

    if (!overwrite && content.drill) {
      continue
    }

    candidateSlugs.push(slug)
  }

  const selectedSlugs = candidateSlugs.slice(0, limit)

  console.log(`Decks elegibles candidatos: ${candidateSlugs.length}`)
  console.log(`Decks seleccionados para procesar (límite ${limit}): ${selectedSlugs.length}`)

  if (dryRun) {
    console.log('[DRY-RUN] Decks a procesar:', selectedSlugs)
    for (const slug of selectedSlugs) {
      const fullPath = path.join(DECKS_DIR, `${slug}.json`)
      const deck = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as GrammarDeckData
      const level = slug.slice(0, 2).toUpperCase() as DrillLevel
      console.log(`  - ${slug} (${level}): ${deck.meta?.title ?? ''}`)
    }
    return
  }

  let successCount = 0
  const reportErrors: Array<{ slug: string; error: string }> = []

  for (let i = 0; i < selectedSlugs.length; i++) {
    const slug = selectedSlugs[i]
    const fullPath = path.join(DECKS_DIR, `${slug}.json`)
    const deck = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as GrammarDeckData
    const level = slug.slice(0, 2).toUpperCase() as DrillLevel

    console.log(`[${i + 1}/${selectedSlugs.length}] Generando drill para: ${slug} (${level})...`)

    let attempts = 0
    let generated = false

    while (attempts < 2 && !generated) {
      attempts++
      try {
        const drill = await generateDrillForDeck(apiKey!, deck, level)
        deck.drill = drill
        fs.writeFileSync(fullPath, JSON.stringify(deck, null, 2) + '\n', 'utf8')
        console.log(`  ✓ Drill generado y validado con éxito para ${slug}`)
        successCount++
        generated = true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`  Intento ${attempts} fallido: ${errorMsg}`)
        if (attempts < 2) {
          await sleep(3000)
        } else {
          reportErrors.push({ slug, error: errorMsg })
        }
      }
    }

    await sleep(1500)
  }

  if (reportErrors.length > 0) {
    fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true })
    fs.writeFileSync(REPORT_FILE, JSON.stringify({ errors: reportErrors, excluded: excludedSlugs }, null, 2), 'utf8')
    console.log(`Se guardó el reporte de errores en ${REPORT_FILE}`)
  }

  console.log(`\nFinalizado. ${successCount}/${selectedSlugs.length} drills generados y guardados con reviewed: false.`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
