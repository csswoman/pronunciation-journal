'use client'

interface WritingHintTooltipProps {
  message: string
  visible: boolean
  x: number
  y: number
}

/** Small floating tooltip anchored near a hint mark's coordinates. */
export function WritingHintTooltip({ message, visible, x, y }: WritingHintTooltipProps) {
  if (!visible) return null

  return (
    <div
      role="tooltip"
      style={{ left: x, top: y }}
      className="pointer-events-none absolute z-10 max-w-64 -translate-y-full rounded-[var(--radius-sm)] bg-fg px-2.5 py-1.5 font-body-sm text-surface shadow-lg"
    >
      {message}
    </div>
  )
}
