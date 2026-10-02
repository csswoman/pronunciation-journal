// Planned structure:
// <SpokenStarterChips>
//   <ConnectorRow /> ("Usa" + outlined chips, optional)
//   <StarterRow /> ("Puedes empezar con" + soft chips)
// </SpokenStarterChips>

import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

interface ChipSet {
  /** Connectors the answer must use; shown as outlined chips. */
  connectors?: readonly string[]
  /** Sentence openers; shown as soft chips. */
  starters: readonly string[]
}

const CHIP_SETS: Partial<Record<SpeechConstraintId, ChipSet>> = {
  rodeo_circumlocution: {
    starters: ['It is a thing that…', 'You use it when…', 'It looks like…'],
  },
  opinion_connector: {
    connectors: ['because', 'so'],
    starters: ['I think…', 'In my opinion…'],
  },
}

export function hasSpokenStarterChips(id: SpeechConstraintId | undefined): boolean {
  return Boolean(id && CHIP_SETS[id])
}

/** Connectors and sentence openers that make a spoken constraint easier to start. */
export function SpokenStarterChips({ constraintId }: { constraintId: SpeechConstraintId }) {
  const chips = CHIP_SETS[constraintId]
  if (!chips) return null
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
      {chips.connectors && (
        <>
          <span className="text-body-sm font-medium text-fg-muted">Usa</span>
          {chips.connectors.map((connector) => (
            <span
              key={connector}
              className="rounded-full border-2 border-fg bg-surface px-3.5 py-1 text-body-sm font-bold text-fg"
            >
              {connector}
            </span>
          ))}
        </>
      )}
      <span className="text-body-sm font-medium text-fg-muted">Puedes empezar con</span>
      {chips.starters.map((starter) => (
        <span
          key={starter}
          className="rounded-full border border-border-subtle bg-surface-sunken px-3.5 py-1.5 text-body-sm font-medium text-fg"
        >
          {starter}
        </span>
      ))}
    </div>
  )
}
