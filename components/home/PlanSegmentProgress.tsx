import { cn } from '@/lib/cn'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'

interface PlanSegmentProgressProps {
  stepIds: string[]
  completedCount: number
  getStepStatus: (stepId: string) => DailyStepStatus
  /** Step currently mid-session, if any. */
  activeStepId?: string | null
  /** First pending step when nothing is mid-session — not filled, only marked. */
  entryStepId?: string | null
}

/**
 * Discrete N-segment progress.
 * Done = solid fill. Current/entry = outline only (never looks completed).
 * Pending = quiet track.
 */
export function PlanSegmentProgress({
  stepIds,
  completedCount,
  getStepStatus,
  activeStepId = null,
  entryStepId = null,
}: PlanSegmentProgressProps) {
  const currentId = activeStepId ?? entryStepId

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
        const current = !done && id === currentId
        return (
          <div
            key={id}
            className={cn(
              'h-1.5 min-w-0 flex-1 rounded-full',
              done && 'bg-primary',
              current && 'bg-transparent ring-2 ring-inset ring-primary',
              !done && !current && 'bg-border-default',
            )}
            title={done ? 'Hecho' : current ? (activeStepId === id ? 'En curso' : 'Siguiente') : 'Pendiente'}
          />
        )
      })}
    </div>
  )
}
