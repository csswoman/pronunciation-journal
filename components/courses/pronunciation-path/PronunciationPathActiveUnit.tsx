import Link from 'next/link'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { contentHrefForRefs } from '@/lib/pronunciation/path/content-href'
import type { PathUnit, UnitLearningState } from '@/lib/pronunciation/path/types'

const STATE_LABEL: Record<UnitLearningState, string> = {
  not_started: 'Sin empezar',
  learning: 'En progreso',
  ready_for_transfer: 'Lista para transferir',
  retained: 'Retenida',
}

interface PronunciationPathActiveUnitProps {
  unit: PathUnit
  state: UnitLearningState
  needsEvidence: boolean
  copyEnabled: boolean
  showTransferPlaceholder?: boolean
}

export function PronunciationPathActiveUnit({
  unit,
  state,
  needsEvidence,
  copyEnabled,
  showTransferPlaceholder = false,
}: PronunciationPathActiveUnitProps) {
  const { title, ipaHint, plainHint } = getLearnerTargetCopy(unit.targetId)
  const contentHref = contentHrefForRefs(unit.contentRefs)
  const practiceHref = unit.practiceHref
  const stateLabel = copyEnabled ? STATE_LABEL[state] : 'Unidad'

  return (
    <section
      aria-label={`Unidad activa: ${title}`}
      className="flex min-w-0 flex-col gap-4 rounded-md border border-border bg-surface p-4"
    >
      <header className="flex min-w-0 flex-col gap-1">
        <p className="font-mono text-caption uppercase tracking-wide text-fg-subtle">Unidad activa</p>
        <h2 className="text-pretty font-h4 text-fg">
          {title}
          {ipaHint ? (
            <span className="ml-2 font-ipa font-normal text-fg-muted" aria-label={title}>
              ({ipaHint})
            </span>
          ) : null}
        </h2>
        <p className="font-caption text-fg-subtle">{stateLabel}</p>
        {needsEvidence ? (
          <p className="text-pretty font-body-sm text-fg-muted">
            Necesitamos más evidencia en este sonido — la práctica ayuda a reunirla.
          </p>
        ) : null}
        {copyEnabled && plainHint ? (
          <p className="text-pretty font-body-sm text-fg-muted">{plainHint}</p>
        ) : null}
      </header>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        {practiceHref ? (
          <Link
            href={practiceHref}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 font-label text-accent-fg"
          >
            Practicar ahora
          </Link>
        ) : null}
        {contentHref ? (
          <Link
            href={contentHref}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 font-label text-fg"
          >
            Ver contenido
          </Link>
        ) : (
          <p className="font-body-sm text-fg-muted">Contenido en la ruta</p>
        )}
      </div>

      {showTransferPlaceholder ? (
        <p className="text-pretty font-caption text-fg-subtle">
          Misión contextual — próximamente
        </p>
      ) : null}
    </section>
  )
}
