import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

import { parseGeminiJson } from '@/lib/gemini/json-route'
import { GenerateTranslationsResponseSchema } from '../generate-translations/route'

const simulatedResponse = `\`\`\`json
{
  "exercises": [
    {
      "sourceEs": "Ella trabaja desde casa.",
      "referenceEn": "She works from home.",
      "acceptedAnswers": [
        "She works from home.",
        "She works at home.",
        "She is working from home."
      ]
    }
  ]
}
\`\`\``

describe('GenerateTranslationsResponseSchema', () => {
  it('parses a simulated response and keeps the answer key', () => {
    const parsed = parseGeminiJson(simulatedResponse, (json) =>
      GenerateTranslationsResponseSchema.parse(json),
    )
    expect(parsed.exercises[0].acceptedAnswers).toEqual([
      'She works from home.',
      'She works at home.',
      'She is working from home.',
    ])
  })

  it('rejects an item without a usable answer key', () => {
    const parsed = GenerateTranslationsResponseSchema.safeParse({
      exercises: [{
        sourceEs: 'Ella trabaja desde casa.',
        referenceEn: 'She works from home.',
        acceptedAnswers: ['She works from home.'],
      }],
    })
    expect(parsed.success).toBe(false)
  })

  it('ships the answer-key bounds to Gemini as structured output', () => {
    const jsonSchema = z.toJSONSchema(GenerateTranslationsResponseSchema) as unknown as {
      properties: { exercises: { items: { properties: { acceptedAnswers: Record<string, unknown> } } } }
    }
    expect(jsonSchema.properties.exercises.items.properties.acceptedAnswers)
      .toMatchObject({ minItems: 3, maxItems: 5 })
  })
})
