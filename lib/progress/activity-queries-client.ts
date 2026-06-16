import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { mergeResolvedIds } from '@/lib/daily/plan-storage'

function startOfLocalDayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Pull reconciled step ids from today's server sessions and merge into localStorage. */
export async function syncTodayReconciledSteps(userId: string): Promise<Set<string>> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('reconciled_step_ids')
      .eq('user_id', userId)
      .gte('completed_at', startOfLocalDayIso())

    if (error) throw error

    const ids = (data ?? []).flatMap((row) => (row.reconciled_step_ids as string[]) ?? [])
    return mergeResolvedIds(userId, ids)
  } catch (err) {
    console.error('[activity-queries-client] syncTodayReconciledSteps failed', err)
    return mergeResolvedIds(userId, [])
  }
}
