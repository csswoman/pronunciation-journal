/**
 * Generate assessment quizzes for grammar and elective decks that currently lack them.
 *
 * Reads decks from public/grammar-decks/*.json, identifies those without a `quiz` array,
 * and calls Gemini using the shared fallback chain to generate 3 high-quality multiple choice
 * questions matching the canonical deck quiz format.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/generate-deck-quizzes.ts
 *   pnpm tsx --env-file=.env.local scripts/generate-deck-quizzes.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/generate-deck-quizzes.ts --deck tech-ingles-programadores.json
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  GRAMMAR_DECK_QUIZ_SYSTEM_PROMPT,
  buildGrammarDeckQuizPrompt,
} from '../lib/ai-prompts'
import { callWithFallback } from '../lib/gemini/client'

const DECKS_DIR = path.join(process.cwd(), 'public', 'grammar-decks')

interface DeckCardBlockRule {
  key: string
  value: string
  highlights?: string[]
}

interface DeckCardBlock {
  type: string
  rows?: DeckCardBlockRule[]
}

interface DeckCard {
  id: string
  tag?: string
  title?: string
  lede?: string
  blocks?: DeckCardBlock[]
}

interface GrammarDeck {
  meta?: {
    eyebrow?: string
    title?: string
    titleEmphasis?: string
    goal?: string
  }
  cards?: DeckCard[]
  quiz?: Array<{
    q: string
    options: string[]
    answer: number
    explain: string
  }>
  [key: string]: unknown
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const deckArgIndex = args.indexOf('--deck')
const targetDeckFile = deckArgIndex >= 0 ? args[deckArgIndex + 1] : null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function parseQuizResponse(rawText: string): GrammarDeck['quiz'] {
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  const cleaned = (firstBrace >= 0 && lastBrace > firstBrace)
    ? rawText.slice(firstBrace, lastBrace + 1)
    : rawText.trim().replace(/^```json\s*|\s*```$/g, '')

  const parsed = JSON.parse(cleaned) as { quiz?: GrammarDeck['quiz'] }
  if (!parsed.quiz || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
    throw new Error('Gemini did not return a valid quiz array')
  }

  return parsed.quiz.map((item) => ({
    q: String(item.q).trim(),
    options: (item.options ?? []).map((opt) => String(opt).trim()),
    answer: Number(item.answer) === 1 ? 1 : 0,
    explain: String(item.explain).trim(),
  }))
}

async function generateQuizForDeck(apiKey: string, deck: GrammarDeck): Promise<GrammarDeck['quiz']> {
  const cards = (deck.cards ?? []).map((card) => {
    const rules: Array<{ key: string; value: string }> = []
    for (const block of card.blocks ?? []) {
      if (block.rows) {
        for (const row of block.rows) {
          rules.push({ key: row.key, value: row.value })
        }
      }
    }
    return {
      title: card.title,
      lede: card.lede,
      rules,
    }
  })

  const title = `${deck.meta?.title ?? ''} ${deck.meta?.titleEmphasis ?? ''}`.trim()
  const prompt = buildGrammarDeckQuizPrompt({
    title,
    eyebrow: deck.meta?.eyebrow,
    cards,
  })

  return callWithFallback(
    apiKey,
    {
      contents: prompt,
      config: {
        systemInstruction: GRAMMAR_DECK_QUIZ_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    },
    parseQuizResponse,
    { timeoutMs: 25_000 }
  )
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey && !dryRun) {
    console.error('Error: GEMINI_API_KEY is required.')
    process.exit(1)
  }

  const allFiles = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json'))

  const pendingFiles = allFiles.filter((fileName) => {
    if (targetDeckFile && fileName !== targetDeckFile) return false
    const fullPath = path.join(DECKS_DIR, fileName)
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as GrammarDeck
    return !content.quiz || content.quiz.length === 0
  })

  console.log(`Encontrados ${pendingFiles.length} decks sin quiz.`)
  if (pendingFiles.length === 0) {
    console.log('Todos los decks ya tienen quiz.')
    return
  }

  if (dryRun) {
    console.log('Modo dry-run activado. Decks pendientes:', pendingFiles)
    return
  }

  let successCount = 0
  for (let i = 0; i < pendingFiles.length; i++) {
    const fileName = pendingFiles[i]
    const fullPath = path.join(DECKS_DIR, fileName)
    const deck = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as GrammarDeck

    console.log(`[${i + 1}/${pendingFiles.length}] Generando quiz para: ${fileName}...`)

    let attempts = 0
    let generated = false
    while (attempts < 3 && !generated) {
      try {
        attempts++
        const quiz = await generateQuizForDeck(apiKey!, deck)
        deck.quiz = quiz
        fs.writeFileSync(fullPath, JSON.stringify(deck, null, 2) + '\n', 'utf8')
        console.log(`  ✓ Guardadas ${quiz.length} preguntas en ${fileName}`)
        successCount++
        generated = true
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`  Intento ${attempts} fallido: ${errorMsg}`)
        if (attempts < 3) {
          await sleep(3000)
        }
      }
    }

    // Pausa breve entre decks
    await sleep(1500)
  }

  console.log(`\nFinalizado. ${successCount} decks actualizados con quiz con éxito.`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
