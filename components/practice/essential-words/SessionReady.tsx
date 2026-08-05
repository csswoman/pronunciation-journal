'use client'

// Planned structure:
// <SessionReady>
//   <ReadyHeadline />     — "Hoy te tocan N palabras" + "~M minutos"
//   <StatBlock />         — Nuevas · Repasos · En el baúl
//   <StructureNote />     — "X bloques de palabras nuevas, más los repasos y una ronda final"
//   <PillButton>Empezar</PillButton>
// </SessionReady>

import { estimateDurationMs } from '@/lib/essential-words/session-plan-time-ceiling'
import { PillButton } from '@/components/ui/PillButton'
import type { EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'
import { StatBlock } from './StatBlock'

interface Props {
  counts: EssentialWordsCounts
  vaulted: number
  onBegin: () => void
}

// Mirrors the plan engine's per-new-word cost (1 expose + 3 exercises) and
// per-review-word cost (3 exercises) from session-plan-time-ceiling.ts —
// those helpers are file-local there, so the shape is reproduced here from
// the same exported estimateDurationMs primitive rather than duplicating constants.
function estimateSessionMinutes(counts: EssentialWordsCounts): number {
  const newMs = estimateDurationMs({ exposeCount: counts.newRemaining, exerciseCount: counts.newRemaining * 3 })
  const reviewMs = estimateDurationMs({ exposeCount: 0, exerciseCount: counts.reviewRemaining * 3 })
  return Math.max(1, Math.round((newMs + reviewMs) / 60000))
}

export function SessionReady({ counts, vaulted, onBegin }: Props) {
  const total = counts.newRemaining + counts.reviewRemaining
  const minutes = estimateSessionMinutes(counts)
  const blocks = Math.ceil(counts.newRemaining / 3)

  return (
    <div className="flex flex-col items-center layout-stack-loose py-layout-page-block text-center animate-message-in">
      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 text-h3 text-fg">
          Hoy te tocan {total} {total === 1 ? 'palabra' : 'palabras'}
        </h2>
        <p className="m-0 text-body-sm text-fg-muted">unos {minutes} minutos</p>
      </div>

      <div className="w-full max-w-sm">
        <StatBlock
          stats={[
            { label: 'Nuevas', value: counts.newRemaining },
            { label: 'Repasos', value: counts.reviewRemaining },
            { label: 'En el baúl', value: vaulted },
          ]}
        />
      </div>

      {counts.newRemaining > 0 ? (
        <p className="m-0 max-w-[42ch] rounded-md bg-surface-sunken px-4 py-3 text-caption text-fg-muted">
          {blocks} {blocks === 1 ? 'bloque' : 'bloques'} de palabras nuevas, más los repasos y una ronda final
        </p>
      ) : null}

      <PillButton
        type="button"
        variant="primary"
        size="md"
        className="w-full max-w-sm"
        onClick={onBegin}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        Empezar
      </PillButton>
    </div>
  )
}
