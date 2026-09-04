import Link from 'next/link'
import { Play } from '@/components/icons'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { cn } from '@/lib/cn'
import type { PathRecommendation } from '@/lib/pronunciation/path/types'
import {
  pathCtaPrimaryClass,
  pathCtaSecondaryClass,
  pathPanelFocusClass,
  pathPanelQuietClass,
} from './path-action-styles'

interface PronunciationPathNextActionProps {
  recommendation: PathRecommendation
  copyEnabled: boolean
  href: string
  ctaLabel: string
  /** Full hero when aligned; quiet strip while exploring another unit. */
  mode?: 'primary' | 'compact'
  lessonHref?: string | null
  needsEvidence?: boolean
}

export function PronunciationPathNextAction({
  recommendation,
  copyEnabled,
  href,
  ctaLabel,
  mode = 'primary',
  lessonHref = null,
  needsEvidence = false,
}: PronunciationPathNextActionProps) {
  const isCompact = mode === 'compact'
  const title = isCompact
    ? 'Tu siguiente práctica'
    : copyEnabled
      ? 'Qué practicar ahora'
      : 'Siguiente práctica'
  const reason =
    copyEnabled || recommendation.reasonKind === 'all_retained'
      ? recommendation.reasonEs
      : 'Continúa con la siguiente unidad de la ruta.'

  const targetCopy = recommendation.targetId
    ? getLearnerTargetCopy(recommendation.targetId)
    : null
  const targetTitle = targetCopy?.title ?? null
  const ipaHint = targetCopy?.ipaHint ?? null
  const plainHint = copyEnabled ? targetCopy?.plainHint : null

  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-w-0 flex-col p-4 sm:p-5',
        isCompact ? cn(pathPanelQuietClass, 'gap-3 bg-surface-sunken') : cn(pathPanelFocusClass, 'gap-4')
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p
          className={cn(
            'font-kicker uppercase tracking-wider',
            isCompact ? 'text-fg-subtle' : 'text-primary'
          )}
        >
          {title}
        </p>
        {targetTitle ? (
          <h2
            className={cn( 'text-pretty text-balance text-fg', isCompact ? 'font-label' : 'font-h4' )}
          >
            {targetTitle}
            {!isCompact && ipaHint ? (
              <span className="ml-2 font-ipa font-normal text-fg-muted" lang="en-fonipa">
                ({ipaHint})
              </span>
            ) : null}
          </h2>
        ) : (
          <h2
            className={cn( 'text-pretty text-balance text-fg', isCompact ? 'font-label' : 'font-h4' )}
          >
            Explorar la ruta
          </h2>
        )}
        {!isCompact ? (
          <>
            <p className="max-w-prose text-pretty font-body-sm text-fg-muted">{reason}</p>
            {needsEvidence ? (
              <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
                Aún no hay suficiente práctica grabada de este sonido. Practica un poco para medirlo.
              </p>
            ) : null}
            {plainHint ? (
              <p className="max-w-prose text-pretty font-body-sm text-fg-muted">{plainHint}</p>
            ) : null}
          </>
        ) : (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
            Estás viendo otra etapa. Cuando quieras, vuelve a esta práctica.
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={href}
          className={cn(pathCtaPrimaryClass, isCompact && 'min-h-10 sm:w-fit')}
        >
          <Play size={13} className="shrink-0 stroke-[2.5]" aria-hidden />
          <span>{ctaLabel}</span>
        </Link>
        {!isCompact && lessonHref ? (
          <Link href={lessonHref} className={pathCtaSecondaryClass}>
            Abrir lección
          </Link>
        ) : null}
      </div>
    </section>
  )
}
