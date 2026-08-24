import { cn } from '@/lib/cn'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'

interface PlanSegmentProgressProps {
  stepIds: string[]
  completedCount: number
  getStepStatus: (stepId: string) => DailyStepStatus
  /** Step currently mid-session, if any. (Marked in the step list, not here.) */
  activeStepId?: string | null
  /** First pending step when nothing is mid-session. (Marked in the step list.) */
  entryStepId?: string | null
}

/**
 * Discrete N-segment progress.
 * Completed steps fill accent-2 (progress role); current/entry live in the step list.
 */
export function PlanSegmentProgress({
  stepIds,
  completedCount,
  getStepStatus,
}: PlanSegmentProgressProps) {
  return (
    <div
      className="flex min-w-0 flex-1 gap-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={stepIds.length}
      aria-valuenow={completedCount}
      aria-label={`${completedCount} de ${stepIds.length} pasos completados`}
    >
      {stepIds.map((id) => {
        const st = getStepStatus(id)
        const done = st === 'done' || st === 'resolved'
        return (
          <div
            key={id}
            className={cn(
              'h-2.5 min-w-0 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none',
              done ? 'bg-primary' : 'bg-surface-sunken',
            )}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
