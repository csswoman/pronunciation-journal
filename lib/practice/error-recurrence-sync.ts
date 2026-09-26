import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { applyProductionGrade, createEmptyState, type UserLearningState } from '@/lib/ai-practice/learning-state'
import { retractErrorPattern, EMPTY_RECURRENCE_QUEUE } from '@/lib/practice/error-recurrence'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'

/**
 * Sincroniza patrones de error detectados o ensayados en los ejercicios hacia
 * la cola de reincidencia de `user_learning_state` en Dexie y Supabase outbox.
 */
export async function recordPracticeErrorRecurrence(
  userId: string,
  errorPattern: ErrorPatternId | undefined,
  rehearsedPattern: ErrorPatternId | undefined,
  isCorrect: boolean,
): Promise<boolean> {
  if (!errorPattern && !rehearsedPattern) return false

  try {
    const existingRow = await db.learningState.get(userId)
    const currentState = existingRow?.state ?? createEmptyState(userId, 'client')
    const updatedState = applyProductionGrade(currentState, {
      errorPattern,
      rehearsedPattern,
      correct: isCorrect,
    })
    const updatedAt = updatedState.updatedAt || new Date().toISOString()
    await db.learningState.put({ userId, state: updatedState, updatedAt })
    try {
      await enqueue(
        userId,
        'user_learning_state',
        'upsert',
        {
          user_id: userId,
          state: updatedState as unknown as Record<string, unknown>,
          updated_at: updatedAt,
        },
        { user_id: userId },
      )
    } catch (err) {
      // Dexie is the local source of truth. A failed remote enqueue should not
      // cause a second local failure to be counted for the same correction.
      console.warn('[recordPracticeErrorRecurrence] failed to enqueue learning state', err)
    }
    return true
  } catch (err) {
    console.warn('[recordPracticeErrorRecurrence] failed to update errorRecurrence', err)
    return false
  }
}

/**
 * Retira un fallo registrado por error en la cola de reincidencia.
 * Si reduce failCount a 0, escribe un tombstone para que copias remotas
 * previas no resuciten el patrón.
 */
export async function retractPracticeErrorRecurrence(
  userId: string,
  patternId: ErrorPatternId | undefined,
  now: number = Date.now(),
): Promise<void> {
  if (!patternId) return

  try {
    await db.transaction('rw', [db.learningState, db.syncOutbox], async () => {
      const existingRow = await db.learningState.get(userId)
      const currentState = existingRow?.state ?? createEmptyState(userId, 'client')
      const queue = currentState.errorRecurrence ?? EMPTY_RECURRENCE_QUEUE
      const updatedQueue = retractErrorPattern(queue, patternId, now)
      const updatedAt = new Date(now).toISOString()
      const updatedState: UserLearningState = {
        ...currentState,
        updatedAt,
        errorRecurrence: updatedQueue,
      }
      await db.learningState.put({ userId, state: updatedState, updatedAt })
      await enqueue(
        userId,
        'user_learning_state',
        'upsert',
        {
          user_id: userId,
          state: updatedState as unknown as Record<string, unknown>,
          updated_at: updatedAt,
        },
        { user_id: userId },
      )
    })
  } catch (err) {
    console.warn('[retractPracticeErrorRecurrence] failed to retract errorRecurrence', err)
    throw err
  }
}
