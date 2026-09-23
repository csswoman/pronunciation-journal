import { describe, expect, it, vi } from 'vitest'
import { wordBankSource } from '../study-source'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { recordActivitySession } from '@/lib/progress/activity-hub'

vi.mock('@/lib/supabase/client', () => ({ getSupabaseBrowserClient: vi.fn() }))
vi.mock('@/lib/practice/queries', () => ({ savePracticeAnswer: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/progress/activity-hub', () => ({ recordActivitySession: vi.fn().mockResolvedValue({ reconciledStepIds: [] }) }))

describe('wordBankSource', () => {
  it('persists a rated personal-deck card as word-bank evidence and its completed session', async () => {
    const source = wordBankSource({ userId: 'user-1', deckId: 'deck-1', deckLabel: 'Travel' })

    await source.saveProgress('11111111-1111-4111-8111-111111111111', 3, null)
    await source.recordSession?.({
      results: [],
      accuracy: 0,
      totalTimeMs: 1000,
      bySlug: {} as import('@/lib/practice/types').SessionResult['bySlug'],
    })

    expect(savePracticeAnswer).toHaveBeenCalledWith('user-1', expect.objectContaining({
      slug: 'identify',
      exerciseTypeId: 11,
      isCorrect: true,
      context: 'practice',
      sourceRef: { source: 'word_bank', id: '11111111-1111-4111-8111-111111111111' },
    }))
    expect(recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      practiceContext: 'practice',
      metadata: { deckId: 'deck-1' },
    }))
  })
})
