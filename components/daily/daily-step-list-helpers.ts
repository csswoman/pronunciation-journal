import { getThreadHintsForStep } from '@/lib/practice/daily-plan/step-thread'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'

const STORAGE_KEY = 'daily:step'

/** Pending compact rows shown before the "Ver N más" toggle. */
export const MAX_VISIBLE_COMPACT_PENDING = 2

export type RowVisual = 'done' | 'entry' | 'current' | 'pending'

export function collectPlanHints(steps: DailyStep[]): StepThreadHint[] {
  const byWord = new Map<string, StepThreadHint>()
  for (let i = 0; i < steps.length; i++) {
    for (const hint of getThreadHintsForStep(steps, i)) {
      if (!byWord.has(hint.word)) byWord.set(hint.word, hint)
    }
  }
  return [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word))
}

export function stepMeta(step: DailyStep): string {
  const parts: string[] = []
  if (step.exercises.length > 0) {
    parts.push(
      `${step.exercises.length} ${step.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`,
    )
  }
  const cardCount = step.studyCards?.length ?? 0
  if (cardCount > 0) {
    parts.push(`${cardCount} ${cardCount === 1 ? 'palabra' : 'palabras'}`)
  }
  if (step.readerPassage) parts.push('lectura')
  parts.push(`${step.estMinutes} min`)
  return parts.join(' · ')
}

export function rowVisual(
  status: DailyStepStatus,
  isInProgress: boolean,
  isEntry: boolean,
): RowVisual {
  if (status === 'done' || status === 'resolved') return 'done'
  if (isInProgress) return 'current'
  if (isEntry) return 'entry'
  return 'pending'
}

/** True mid-session: storage exists and at least one exercise was advanced. */
export function readInProgressStepId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { stepId?: string; exerciseIndex?: number }
    if (!parsed.stepId || typeof parsed.exerciseIndex !== 'number') return null
    if (parsed.exerciseIndex <= 0) return null
    return parsed.stepId
  } catch {
    return null
  }
}

/**
 * When the user expands "Ver N más", map step ids that were behind the toggle
 * to a 0-based stagger index for `list-stagger`. Empty when collapsed.
 */
export function revealStaggerByStepId(
  steps: DailyStep[],
  getStepStatus: (stepId: string) => DailyStepStatus,
  opts: {
    collapseFutureSteps: boolean
    showAllCompact: boolean
    entryIndex: number
    activeId: string | null
  },
): Map<string, number> {
  const { collapseFutureSteps, showAllCompact, entryIndex, activeId } = opts
  const result = new Map<string, number>()
  if (!collapseFutureSteps || !showAllCompact) return result

  let budget = MAX_VISIBLE_COMPACT_PENDING
  let stagger = 0
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const status = getStepStatus(step.id)
    const isInProgress =
      activeId === step.id && status !== 'done' && status !== 'resolved'
    const isEntry =
      !activeId && i === entryIndex && status !== 'done' && status !== 'resolved'
    if (isEntry || isInProgress) continue
    if (status === 'done' || status === 'resolved') continue
    if (budget > 0) {
      budget -= 1
      continue
    }
    result.set(step.id, stagger)
    stagger += 1
  }
  return result
}
