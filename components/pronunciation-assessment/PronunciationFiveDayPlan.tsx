import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
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
 * Five-session plan as a flat divided list — not five identical cards
 * (quieter; avoids nested-card noise under results).
 */
export function PronunciationFiveDayPlan({ sessions }: PronunciationFiveDayPlanProps) {
  return (
    <ol className="flex min-w-0 flex-col divide-y divide-border-subtle border-y border-border-subtle">
      {sessions.map((session, index) => {
        const { title, ipaHint } = getLearnerTargetCopy(session.targetId)
        return (
          <li key={`${session.targetId}-${index}`} className="flex min-w-0 flex-col gap-1 py-3">
            <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <span className="min-w-0 text-pretty break-words font-label text-fg">
                Día {index + 1} · {title}
                {ipaHint ? (
                  <>
                    {' '}
                    <span className="font-ipa font-normal text-fg-muted">({ipaHint})</span>
                  </>
                ) : null}
              </span>
              <span className="shrink-0 font-caption text-fg-subtle">
                {STYLE_LABEL[session.style]}
              </span>
            </div>
            <p className="max-w-prose text-pretty break-words font-body-sm text-fg-muted">
              {session.reason}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
