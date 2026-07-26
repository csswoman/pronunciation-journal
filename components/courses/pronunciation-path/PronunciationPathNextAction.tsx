import Link from 'next/link'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PathRecommendation } from '@/lib/pronunciation/path/types'
import { pathCtaPrimaryClass } from './path-action-styles'

interface PronunciationPathNextActionProps {
  recommendation: PathRecommendation
  copyEnabled: boolean
  href: string
  ctaLabel: string
}

export function PronunciationPathNextAction({
  recommendation,
  copyEnabled,
  href,
  ctaLabel,
}: PronunciationPathNextActionProps) {
  const title = copyEnabled ? 'Qué practicar ahora' : 'Siguiente práctica'
  const reason =
    copyEnabled || recommendation.reasonKind === 'all_retained'
      ? recommendation.reasonEs
      : 'Continúa con la siguiente unidad de la ruta.'

  const targetTitle = recommendation.targetId
    ? getLearnerTargetCopy(recommendation.targetId).title
    : null

  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-4 rounded-lg bg-surface-raised p-4 ring-1 ring-inset ring-badge-primary-border sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="font-mono text-caption text-primary">{title}</p>
        {targetTitle ? (
          <h2 className="text-pretty text-balance font-h4 text-fg">{targetTitle}</h2>
        ) : (
          <h2 className="text-pretty text-balance font-h4 text-fg">Explorar la ruta</h2>
        )}
        <p className="max-w-prose text-pretty font-body-sm text-fg-muted">{reason}</p>
      </div>
      <Link href={href} className={pathCtaPrimaryClass}>
        {ctaLabel}
      </Link>
    </section>
  )
}
