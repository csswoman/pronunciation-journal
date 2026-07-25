import Anchor from '@/components/ui/Anchor'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { targetIdToPracticeRoute } from '@/lib/pronunciation/target-route'
import type { PrescriptionSession } from '@/lib/pronunciation/assessment/schema'

interface PronunciationFiveDayPlanProps {
  sessions: readonly PrescriptionSession[]
  /** When true, feature day 1 and collapse the rest (low-evidence peak-end). */
  evidenceLight?: boolean
}

const STYLE_LABEL: Record<PrescriptionSession['style'], string> = {
  perception: 'Distinguir sonidos',
  drill: 'Práctica dirigida',
  transfer: 'Uso en contexto',
}

const PRACTICE_FALLBACK = '/practice/sounds'

function SessionRow({
  session,
  index,
  featured,
}: {
  session: PrescriptionSession
  index: number
  featured?: boolean
}) {
  const { title, ipaHint } = getLearnerTargetCopy(session.targetId)
  const route = targetIdToPracticeRoute(session.targetId) ?? PRACTICE_FALLBACK
  const titleNode = (
    <>
      Día {index + 1} · {title}
      {ipaHint ? (
        <>
          {' '}
          <span className="font-ipa font-normal text-fg-muted" aria-label={title}>
            ({ipaHint})
          </span>
        </>
      ) : null}
    </>
  )

  return (
    <li className={featured ? 'flex min-w-0 flex-col gap-1 py-1' : 'flex min-w-0 flex-col gap-1 py-3'}>
      <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        {featured ? (
          <Anchor
            href={route}
            color="unstyled"
            className="min-w-0 text-pretty break-words font-label text-fg underline-offset-2 hover:underline"
          >
            {titleNode}
          </Anchor>
        ) : (
          <span className="min-w-0 text-pretty break-words font-label text-fg">{titleNode}</span>
        )}
        <span className="shrink-0 font-caption text-fg-subtle">{STYLE_LABEL[session.style]}</span>
      </div>
      <p className="max-w-prose text-pretty break-words font-body-sm text-fg-muted">{session.reason}</p>
    </li>
  )
}

/**
 * Five-session plan as a flat divided list — not five identical cards
 * (quieter; avoids nested-card noise under results).
 */
export function PronunciationFiveDayPlan({
  sessions,
  evidenceLight = false,
}: PronunciationFiveDayPlanProps) {
  const [first, ...rest] = sessions

  if (evidenceLight && first) {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <ol className="flex min-w-0 flex-col rounded-md bg-surface-sunken px-4 py-3">
          <SessionRow session={first} index={0} featured />
        </ol>
        {rest.length > 0 ? (
          <details className="min-w-0">
            <summary className="cursor-pointer font-label text-fg">Ver el resto de la semana</summary>
            <ol className="mt-2 flex min-w-0 flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {rest.map((session, index) => (
                <SessionRow
                  key={`${session.targetId}-${index + 1}`}
                  session={session}
                  index={index + 1}
                />
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    )
  }

  return (
    <ol className="flex min-w-0 flex-col divide-y divide-border-subtle border-y border-border-subtle">
      {sessions.map((session, index) => (
        <SessionRow
          key={`${session.targetId}-${index}`}
          session={session}
          index={index}
        />
      ))}
    </ol>
  )
}
