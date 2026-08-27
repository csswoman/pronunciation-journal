import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { GeneratedScriptSchema } from '../generate-script/route'

describe('GeneratedScriptSchema', () => {
  it('acepta un guión bien formado', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [
        { speaker: 'coach', text: 'Hello there.' },
        { speaker: 'learner', text: 'Hi, nice to meet you.' },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rechaza un hablante desconocido', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [{ speaker: 'narrator', text: 'Once upon a time.' }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rechaza un guión vacío', () => {
    expect(GeneratedScriptSchema.safeParse({ script: [] }).success).toBe(false)
  })

  it('rechaza texto vacío', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [{ speaker: 'coach', text: '' }],
    })
    expect(parsed.success).toBe(false)
  })
})
