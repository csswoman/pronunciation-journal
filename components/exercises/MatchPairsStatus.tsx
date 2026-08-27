'use client'

export const MATCH_DOT_COLORS = [
  'var(--match-pair-dot-1)',
  'var(--match-pair-dot-2)',
  'var(--match-pair-dot-3)',
  'var(--match-pair-dot-4)',
  'var(--match-pair-dot-5)',
  'var(--match-pair-dot-6)',
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

  const message = selectedTerm
    ? `Ahora elige la pareja de “${selectedTerm}”`
    : armedDefinition
      ? 'Ahora elige el término que coincide'
      : matchedCount > 0
        ? `${matchedCount} de ${totalCount} emparejados`
        : null

  if (!message) return null

  return (
    <div className="flex h-5 items-center justify-center">
      <p
        className="m-0 animate-state-in text-center text-caption font-medium tabular-nums text-fg-subtle"
        aria-live="polite"
      >
        {message}
      </p>
    </div>
  )
}
