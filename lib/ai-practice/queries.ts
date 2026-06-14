import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { enqueue } from '@/lib/sync/sync-manager'
import { db } from '@/lib/db'
import type { UserLearningState } from './learning-state'

/**
 * Fetch the learning state stored remotely for the given user.
 * Returns null if the row does not exist or the table is not yet migrated (PGRST205).
 */
function isMissingLearningStateTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return /user_learning_state/i.test(error.message ?? "");
}

let learningStateTableMissing = false;

export async function fetchRemoteLearningState(userId: string): Promise<UserLearningState | null> {
  if (learningStateTableMissing) return null;

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('user_learning_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (isMissingLearningStateTable(error)) {
        learningStateTableMissing = true;
      }
      return null
    }
    if (!data) return null
    return data.state as unknown as UserLearningState
  } catch {
    return null
  }
}

/**
 * Merge remote and local learning state using last-write-wins.
 * If the remote state is newer, writes it to Dexie and returns it.
 * Otherwise keeps the local state unchanged.
 */
export async function hydrateFromRemote(userId: string): Promise<void> {
  const [remote, local] = await Promise.all([
    fetchRemoteLearningState(userId),
    db.learningState.get(userId),
  ])

  if (!remote) return
  const remoteTime = new Date(remote.updatedAt).getTime()
  const localTime = local ? new Date(local.updatedAt).getTime() : 0

  if (remoteTime > localTime) {
    await db.learningState.put({ userId, state: remote, updatedAt: remote.updatedAt })
  }
}

/**
 * Persist the learning state to Dexie and enqueue an upsert to Supabase.
 * Safe to call after every session — the outbox batches and dedupes.
 */
export async function persistLearningState(
  userId: string,
  state: UserLearningState,
): Promise<void> {
  const updatedAt = new Date().toISOString()
  await db.transaction('rw', [db.learningState, db.syncOutbox], async () => {
    await db.learningState.put({ userId, state, updatedAt })
    await enqueue(
      'user_learning_state',
      'upsert',
      { user_id: userId, state, updated_at: updatedAt },
      { user_id: userId },
    )
  })
}
