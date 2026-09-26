import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

import { parseGeminiJson } from '@/lib/gemini/json-route'
import { GenerateTransformationsResponseSchema } from '../generate-transformations/route'

const simulatedResponse = `\`\`\`json
{
  "exercises": [
    {
      "sourceSentence": "She is too tired to work.",
      "instruction": "Rewrite using enough.",
      "referenceAnswer": "She is not well enough to work.",
      "acceptedAnswers": [
        "She is not well enough to work.",
        "She is not rested enough to work.",
        "She is not energetic enough to work."
      ]
    }
  ]
}
\`\`\``

describe('GenerateTransformationsResponseSchema', () => {
  it('parses a simulated response and keeps the answer key', () => {
    const parsed = parseGeminiJson(simulatedResponse, (json) =>
      GenerateTransformationsResponseSchema.parse(json),
    )
    expect(parsed.exercises[0].acceptedAnswers).toHaveLength(3)
    expect(parsed.exercises[0].acceptedAnswers[0]).toBe(parsed.exercises[0].referenceAnswer)
  })

  it('rejects an item without a usable answer key', () => {
    const parsed = GenerateTransformationsResponseSchema.safeParse({
      exercises: [{
        sourceSentence: 'She is too tired to work.',
        instruction: 'Rewrite using enough.',
        referenceAnswer: 'She is not well enough to work.',
        acceptedAnswers: ['She is not well enough to work.', 'She is not rested enough to work.'],
      }],
    })
    expect(parsed.success).toBe(false)
  })

  it('ships the answer-key bounds to Gemini as structured output', () => {
    const jsonSchema = z.toJSONSchema(GenerateTransformationsResponseSchema) as unknown as {
      properties: { exercises: { items: { properties: { acceptedAnswers: Record<string, unknown> } } } }
    }
    expect(jsonSchema.properties.exercises.items.properties.acceptedAnswers)
      .toMatchObject({ minItems: 3, maxItems: 5 })
  })
})
