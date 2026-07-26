import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { contentHrefForRefs } from '@/lib/pronunciation/path/content-href'
import {
  unitStateBadgeVariant,
  unitStateLabelEs,
} from '@/lib/pronunciation/path/unit-labels'
import type { PathUnit, UnitLearningState } from '@/lib/pronunciation/path/types'
import { pathCtaSecondaryClass } from './path-action-styles'

interface PronunciationPathActiveUnitProps {
  unit: PathUnit
  state: UnitLearningState
  needsEvidence: boolean
  copyEnabled: boolean
  /** When false, recommendation already owns the primary practice CTA. */
  showPracticeCta: boolean
  /** Deep-link back to the recommended next practice when this unit has no drill yet. */
  fallbackPracticeHref?: string | null
}

export function PronunciationPathActiveUnit({
  unit,
  state,
  needsEvidence,
  copyEnabled,
  showPracticeCta,
  fallbackPracticeHref = null,
}: PronunciationPathActiveUnitProps) {
  const { title, ipaHint, plainHint } = getLearnerTargetCopy(unit.targetId)
  const contentHref = contentHrefForRefs(unit.contentRefs)
  const practiceHref = unit.practiceHref
  const stateLabel = copyEnabled ? unitStateLabelEs(state) : 'Unidad'
  const awaitingTransferMission = unit.stageId === 'intonation-transfer' && !practiceHref

  return (
    <section aria-label={`Unidad activa: ${title}`} className="flex min-w-0 flex-col gap-4">
      <header className="flex min-w-0 flex-col gap-2">
        <p className="font-mono text-caption text-fg-subtle">
          {showPracticeCta ? 'Unidad seleccionada' : 'Detalle de la unidad'}
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <h2 className="min-w-0 text-pretty text-balance font-h4 text-fg">
            {title}
            {ipaHint ? (
              <span className="ml-2 font-ipa font-normal text-fg-muted" aria-label={title}>
                ({ipaHint})
              </span>
            ) : null}
          </h2>
          <Badge label={stateLabel} variant={unitStateBadgeVariant(state)} size="sm" />
        </div>
        {needsEvidence ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
            Necesitamos más evidencia en este sonido. La práctica ayuda a reunirla.
          </p>
        ) : null}
        {copyEnabled && plainHint ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">{plainHint}</p>
        ) : null}
        {awaitingTransferMission ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
            La misión contextual aún no está lista. Mientras tanto, estudia la lección o vuelve a tu
            siguiente práctica.
          </p>
        ) : null}
      </header>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showPracticeCta && practiceHref ? (
          <Link href={practiceHref} className={pathCtaSecondaryClass}>
            Practicar en Sound Lab
          </Link>
        ) : null}
        {contentHref ? (
          <Link href={contentHref} className={pathCtaSecondaryClass}>
            Abrir lección
          </Link>
        ) : null}
        {awaitingTransferMission && fallbackPracticeHref ? (
          <Link href={fallbackPracticeHref} className={pathCtaSecondaryClass}>
            Ir a tu siguiente práctica
          </Link>
        ) : null}
      </div>
    </section>
  )
}
