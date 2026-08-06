'use client'

type SrsVaultTriggerProps = {
  count: number
  onOpen: () => void
}

export function SrsVaultTrigger({ count, onOpen }: SrsVaultTriggerProps) {
  if (count === 0) return null

  const noun = count === 1 ? 'palabra' : 'palabras'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="min-h-10 rounded-md px-2.5 py-1.5 text-caption text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg-muted focus-ring"
    >
      Baúl · {count} {noun}
    </button>
  )
}
