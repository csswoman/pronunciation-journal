import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { PrescriptionSession } from '@/lib/pronunciation/assessment/schema'

interface PronunciationFiveDayPlanProps {
  sessions: readonly PrescriptionSession[]
}

const STYLE_LABEL: Record<PrescriptionSession['style'], string> = {
  perception: 'Distinguir sonidos',
  drill: 'Práctica dirigida',
  transfer: 'Uso en contexto',
}

/**
 * Renders the exactly-five-session prescription as a simple ordered plan.
 * Sits after "qué trabajar primero" and before the evidence detail
 * (progressive disclosure — plan 067, step 7).
 */
export function PronunciationFiveDayPlan({ sessions }: PronunciationFiveDayPlanProps) {
  return (
    <ol className="flex flex-col gap-3">
      {sessions.map((session, index) => {
        const lookup = getTarget(session.targetId)
        const label = lookup.ok ? lookup.target.label : session.targetId
        return (
          <li
            key={`${session.targetId}-${index}`}
            className="flex flex-col gap-1 rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                Día {index + 1} · {label}
              </span>
              <span className="text-[12px] text-[var(--text-secondary)]">{STYLE_LABEL[session.style]}</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">{session.reason}</p>
          </li>
        )
      })}
    </ol>
  )
}
