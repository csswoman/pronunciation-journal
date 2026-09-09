import { describe, expect, it } from 'vitest'
import { buildScriptGenerationPrompt } from '@/lib/ai-prompts'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'

describe('buildScriptGenerationPrompt', () => {
  it('incluye el tema pedido y el nivel del estudiante', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'backend interview',
      context: { ...emptyLearnerContext(), cefr: 'B1' },
    })
    expect(prompt).toContain('backend interview')
    expect(prompt).toContain('B1')
  })

  it('siembra el guión con vocabulario en repaso', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'cafe',
      context: { ...emptyLearnerContext(), srsDueWords: ['although', 'receipt'] },
    })
    expect(prompt).toContain('although')
    expect(prompt).toContain('receipt')
  })

  it('ancla el guión en el área de vocabulario que se le resiste', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'daily standup',
      context: { ...emptyLearnerContext(), weakDomains: ['Backend e infraestructura'] },
    })
    expect(prompt).toContain('Backend e infraestructura')
  })

  it('menciona los dominios donde estudia cuando no hay área débil', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'daily standup',
      context: { ...emptyLearnerContext(), domains: ['Ingeniería'] },
    })
    expect(prompt).toContain('Ingeniería')
  })

  it('funciona sin datos de personalización', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'cafe',
      context: emptyLearnerContext(),
    })
    expect(prompt).toContain('cafe')
    expect(prompt.length).toBeGreaterThan(0)
  })
})
