import Link from 'next/link'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PathRecommendation } from '@/lib/pronunciation/path/types'

interface PronunciationPathNextActionProps {
  recommendation: PathRecommendation
  copyEnabled: boolean
  href: string
}

export function PronunciationPathNextAction({
  recommendation,
  copyEnabled,
  href,
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
      className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-surface-elevated p-4"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-mono text-caption uppercase tracking-wide text-fg-subtle">{title}</p>
        {targetTitle ? (
          <h2 className="text-pretty font-h4 text-fg">{targetTitle}</h2>
        ) : (
          <h2 className="text-pretty font-h4 text-fg">Explorar la ruta</h2>
        )}
        <p className="text-pretty font-body-sm text-fg-muted">{reason}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 font-label text-accent-fg sm:w-fit"
      >
        {recommendation.targetId ? 'Ir a esta unidad' : 'Ver etapas'}
      </Link>
    </section>
  )
}
