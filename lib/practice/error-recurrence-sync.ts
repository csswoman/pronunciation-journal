import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { applyProductionGrade, createEmptyState } from '@/lib/ai-practice/learning-state'
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
): Promise<void> {
  if (!errorPattern && !rehearsedPattern) return

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
    console.warn('[recordPracticeErrorRecurrence] failed to update errorRecurrence', err)
  }
}
