import { describe, expect, it, vi } from 'vitest'
import { buildValidDiagnosticResult } from './fixtures'
import { persistPronunciationAssessmentServer } from '../persistence-server'

function fakeSupabase(insertResult: { error: { code?: string; message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult)
  return { from: vi.fn(() => ({ insert })), insert }
}

describe('persistPronunciationAssessmentServer', () => {
  it('rejects when result.userId does not match the authenticated userId', async () => {
    const supabase = fakeSupabase({ error: null })
    const result = buildValidDiagnosticResult('someone-else')

    const outcome = await persistPronunciationAssessmentServer(supabase as never, {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      result,
    })

    expect(outcome).toEqual({ ok: false, error: 'user_mismatch', detail: expect.any(String) })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('rejects an invalid result without hitting the database', async () => {
    const supabase = fakeSupabase({ error: null })
    const invalid = { ...buildValidDiagnosticResult('user-1'), targetResults: [] }

    const outcome = await persistPronunciationAssessmentServer(supabase as never, {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      result: invalid as never,
    })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.error).toBe('invalid_result')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('inserts a valid result and reports alreadyPersisted: false on success', async () => {
    const supabase = fakeSupabase({ error: null })
    const result = buildValidDiagnosticResult('user-1')

    const outcome = await persistPronunciationAssessmentServer(supabase as never, {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      result,
    })

    expect(outcome).toEqual({ ok: true, alreadyPersisted: false })
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: 'user-1',
        schema_version: 1,
      })
    )
  })

  it('treats a 23505 unique-violation retry as an idempotent success', async () => {
    const supabase = fakeSupabase({ error: { code: '23505', message: 'duplicate key value violates unique constraint' } })
    const result = buildValidDiagnosticResult('user-1')

    const outcome = await persistPronunciationAssessmentServer(supabase as never, {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      result,
    })

    expect(outcome).toEqual({ ok: true, alreadyPersisted: true })
  })

  it('surfaces any other db error as a failure', async () => {
    const supabase = fakeSupabase({ error: { code: '42501', message: 'row-level security violation' } })
    const result = buildValidDiagnosticResult('user-1')

    const outcome = await persistPronunciationAssessmentServer(supabase as never, {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      result,
    })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.error).toBe('db_error')
  })
})
