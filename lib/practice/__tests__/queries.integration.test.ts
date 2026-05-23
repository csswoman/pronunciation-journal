/**
 * Integration tests for savePracticeAnswer + word_bank SRS.
 *
 * Requires real Supabase credentials in env (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY). The service-role key bypasses RLS so the test
 * can insert/delete fixtures without a real auth session.
 *
 * Run with:
 *   vitest run lib/practice/__tests__/queries.integration.test.ts
 *
 * These tests are intentionally excluded from the default unit-test suite
 * (they hit the network) and should be run manually or in a dedicated CI step.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

// ── Admin client (service role, bypasses RLS) ────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Integration tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  return createClient<Database>(url, key)
}

// ── Stub window so getSupabaseBrowserClient() doesn't throw in Node ──────────

// savePracticeAnswer (and reviewWordBankEntry) call getSupabaseBrowserClient(),
// which guards against non-browser environments. We mock the module so the
// integration test can run in Node without a real browser context.
import { vi } from 'vitest'

const supabaseAdmin = adminClient()

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => supabaseAdmin,
}))

// Import after mocking
const { savePracticeAnswer } = await import('../queries')

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
let wordId: string
let answerHistoryId: string

beforeAll(async () => {
  // Insert a word_bank fixture with default (new) SRS state.
  const { data, error } = await supabaseAdmin
    .from('word_bank')
    .insert({
      user_id: TEST_USER_ID,
      text: '__test_srs_integration__',
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      srs_status: 'new',
      status: 'ready',
      difficulty: 0,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to insert word_bank fixture: ${error.message}`)
  wordId = data.id
})

afterAll(async () => {
  // Clean up in reverse dependency order.
  if (answerHistoryId) {
    await supabaseAdmin.from('answer_history').delete().eq('id', answerHistoryId)
  }
  if (wordId) {
    await supabaseAdmin.from('word_bank').delete().eq('id', wordId)
  }
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('savePracticeAnswer → word_bank SRS', () => {
  it('writes grade to answer_history and advances SRS on word_bank', async () => {
    await savePracticeAnswer(TEST_USER_ID, {
      exerciseId: 'test-exercise-1',
      slug: 'fill_blank',
      exerciseTypeId: 5,
      isCorrect: true,
      userAnswer: 'run',
      timeMs: 1200,
      contentId: `word_bank:${wordId}`,
      context: 'practice',
      sourceRef: { source: 'word_bank', id: wordId },
    })

    // Wait briefly for the fire-and-forget SRS update to settle.
    await new Promise((r) => setTimeout(r, 300))

    // Verify answer_history row has grade set.
    const { data: ahRows } = await supabaseAdmin
      .from('answer_history')
      .select('id, grade, content_id')
      .eq('user_id', TEST_USER_ID)
      .eq('content_id', `word_bank:${wordId}`)
      .order('answered_at', { ascending: false })
      .limit(1)

    expect(ahRows).toHaveLength(1)
    const ahRow = ahRows![0]
    answerHistoryId = ahRow.id
    // Correct answer in <5s → grade 5
    expect(ahRow.grade).toBe(5)

    // Verify word_bank SRS fields advanced.
    const { data: word } = await supabaseAdmin
      .from('word_bank')
      .select('repetitions, next_review_at, srs_status')
      .eq('id', wordId)
      .single()

    expect(word!.repetitions).toBeGreaterThan(0)
    expect(word!.next_review_at).not.toBeNull()
    const nextReview = new Date(word!.next_review_at!)
    expect(nextReview.getTime()).toBeGreaterThan(Date.now())
    expect(word!.srs_status).not.toBe('new')
  })
})
