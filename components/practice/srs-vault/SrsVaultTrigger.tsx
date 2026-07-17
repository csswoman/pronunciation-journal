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
      className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 text-caption text-fg-muted transition-colors hover:border-border-default hover:text-fg focus-ring"
    >
      Baúl · {count} {noun}
    </button>
  )
}
