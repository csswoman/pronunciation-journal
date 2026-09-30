import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { GrammarDrillSchema } from '../drill-schema'
import { DRILL_PROFILES, type DrillLevel } from '@/lib/exercises/grammar-drill/profiles'
import { tokenize } from '@/lib/exercises/utils'

const DECKS_DIR = path.join(process.cwd(), 'public', 'grammar-decks')

describe('Drills content validation across all authored decks', () => {
  const allFiles = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json'))
  const decksWithDrill: Array<{ file: string; slug: string; deck: { drill: import('../drill-schema').GrammarDrill } }> = []

  for (const file of allFiles) {
    const fullPath = path.join(DECKS_DIR, file)
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    if (content.drill) {
      decksWithDrill.push({ file, slug: file.replace(/\.json$/, ''), deck: content })
    }
  }

  it('finds at least the 5 gold-standard reviewed pilots (A1–C1)', () => {
    expect(decksWithDrill.length).toBeGreaterThanOrEqual(5)
    const reviewedPilots = decksWithDrill.filter((d) => d.deck.drill.reviewed === true)
    expect(reviewedPilots.length).toBeGreaterThanOrEqual(5)

    const expectedPilots = [
      'a1-verbo-to-be',
      'a2-pasado-to-be',
      'b1-segundo-condicional',
      'b2-tercer-condicional',
      'c1-enfasis-inversion-avanzada',
    ]

    for (const slug of expectedPilots) {
      const found = decksWithDrill.find((d) => d.slug === slug)
      expect(found, `Pilot deck ${slug} must exist and contain a drill`).toBeDefined()
      expect(found?.deck.drill.reviewed).toBe(true)
    }
  })

  it.each(decksWithDrill)('$slug passes schema and superRefine validation', ({ slug, deck }) => {
    const result = GrammarDrillSchema.safeParse(deck.drill)
    expect(result.success, `Drill in ${slug} failed validation: ${JSON.stringify(result.error?.issues)}`).toBe(true)
  })

  it.each(decksWithDrill)('$slug respects profile sentence word limits in build exercises', ({ slug, deck }) => {
    const drill = deck.drill
    const profile = DRILL_PROFILES[drill.level as DrillLevel]
    expect(profile, `Profile not found for ${slug} level ${drill.level}`).toBeDefined()

    if (drill.build) {
      for (const item of drill.build) {
        if (item.kind === 'reorder') {
          for (const pattern of item.accept) {
            // For simple sentences without chunks, token count should align with profile
            if (!item.chunks) {
              const wordCount = tokenize(pattern.replace(/[{|}]/g, ' ')).length
              // Allow margin of ±2 tokens for natural variety
              expect(wordCount).toBeGreaterThanOrEqual(profile.sentenceWords[0] - 2)
              expect(wordCount).toBeLessThanOrEqual(profile.sentenceWords[1] + 3)
            }
          }
        }
      }
    }
  })
})
