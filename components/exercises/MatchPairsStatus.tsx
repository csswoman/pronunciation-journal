'use client'

export const MATCH_DOT_COLORS = [
  'oklch(0.65 0.18 25)',
  'oklch(0.65 0.18 250)',
  'oklch(0.65 0.18 310)',
  'oklch(0.65 0.16 145)',
  'oklch(0.70 0.18 55)',
  'oklch(0.65 0.16 185)',
]

export function MatchPairsStatus({
  submitted,
  matchedCount,
  totalCount,
  selectedTerm,
  armedDefinition,
}: {
  submitted: boolean
  matchedCount: number
  totalCount: number
  selectedTerm: string | null | undefined
  armedDefinition: string | null | undefined
}) {
  if (submitted) return null

  return (
    <>
      <p className="m-0 w-full text-pretty text-center text-body-sm leading-snug text-fg-muted sm:text-body-sm">
        Relaciona cada término con su definición. Las definiciones están mezcladas.
      </p>

      {(matchedCount > 0 || selectedTerm || armedDefinition) && (
        <p
          className="m-0 animate-state-in text-center text-caption font-medium tabular-nums text-fg-subtle"
          aria-live="polite"
        >
          {selectedTerm
            ? `Ahora elige la definición de “${selectedTerm}”`
            : armedDefinition
              ? 'Ahora elige el término que coincide'
              : `${matchedCount} de ${totalCount} emparejados`}
        </p>
      )}
    </>
  )
}
