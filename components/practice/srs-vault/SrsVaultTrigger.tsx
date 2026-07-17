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
      className="font-caption text-fg-muted transition-colors hover:text-fg"
    >
      Baúl · {count} {noun}
    </button>
  )
}
