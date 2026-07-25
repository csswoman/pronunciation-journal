import Anchor from '@/components/ui/Anchor'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

interface PronunciationPriorityCardProps {
  result: TargetResult
  rank: number
}

/**
 * One priority target with a direct practice CTA. Interactive unit = card
 * is allowed; rank uses soft primary so it doesn't compete with the CTA.
 */
export function PronunciationPriorityCard({ result, rank }: PronunciationPriorityCardProps) {
  const { title, ipaHint } = getLearnerTargetCopy(result.targetId)
  const route = targetIdToPronunciationPathRoute(result.targetId)

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-md border border-border-default bg-surface-raised p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-caption font-semibold tabular-nums text-primary"
        >
          {rank}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="min-w-0 text-pretty break-words font-label text-fg">
            {title}
            {ipaHint ? (
              <>
                {' '}
                <span className="font-ipa font-normal text-fg-muted" aria-label={title}>
                  ({ipaHint})
                </span>
              </>
            ) : null}
          </h3>
          <p className="text-pretty font-body-sm text-fg-muted">
            Aquí hubo más fricción que en el resto del diagnóstico. Conviene empezar por este contraste.
          </p>
        </div>
      </div>
      {route ? (
        <Anchor
          href={route}
          color="unstyled"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-cta-bg px-5 font-label text-cta-fg no-underline transition-colors duration-150 ease-out-quart hover:bg-cta-bg-hover hover:text-cta-fg hover:no-underline"
        >
          Practicar ahora
        </Anchor>
      ) : (
        <p className="text-pretty font-body-sm text-fg-muted">
          Este objetivo se trabaja en tu plan de la semana más abajo.
        </p>
      )}
    </li>
  )
}
