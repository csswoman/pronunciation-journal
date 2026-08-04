import { describe, expect, it } from 'vitest'
import {
  buildJournalNudgePrompt,
  JOURNAL_NUDGE_SYSTEM_PROMPT,
} from '@/lib/ai-prompts'
import { journalNudgeRequestSchema, journalNudgeResponseSchema } from '@/lib/journal/nudge'

describe('journal nudge contract', () => {
  it('requires the bounded context fields', () => {
    expect(
      journalNudgeRequestSchema.safeParse({
        prompt: 'Write about a place.',
        partial_text: 'My room is quiet.',
        cefr_level: 'A1',
        unused_seed_words: ['cozy'],
        target_length: 60,
      }).success,
    ).toBe(true)
    expect(journalNudgeRequestSchema.safeParse({ prompt: 'Write about a place.' }).success).toBe(false)
  })

  it('accepts exactly three nudges and rejects a different count', () => {
    const nudge = { en: 'What do you do there?', es: '¿Qué haces allí?' }
    expect(journalNudgeResponseSchema.safeParse({ nudges: [nudge, nudge, nudge] }).success).toBe(true)
    expect(journalNudgeResponseSchema.safeParse({ nudges: [nudge, nudge] }).success).toBe(false)
  })

  it('keeps the model focused on existing text and unused seeds', () => {
    const prompt = buildJournalNudgePrompt({
      prompt: 'Write about a place.',
      partialText: 'My room is quiet.',
      cefrLevel: 'A1',
      unusedSeedWords: ['cozy'],
      targetLength: 60,
    })
    expect(prompt).toContain('My room is quiet.')
    expect(prompt).toContain('cozy')
    expect(JOURNAL_NUDGE_SYSTEM_PROMPT).toContain('Never correct')
    expect(JOURNAL_NUDGE_SYSTEM_PROMPT).toContain('exactly three nudges')
  })
})
