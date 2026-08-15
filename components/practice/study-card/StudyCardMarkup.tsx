import { cn } from '@/lib/cn'
import type { CompiledMarkedText } from '@/lib/essential-words/study-markup'

// Planned structure:
// <Chip /> — metadata badge
// <MarkedText /> — highlight spans from CompiledMarkedText

export function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'font-kicker rounded-full px-2 py-0.5',
        accent
          ? 'bg-primary text-on-primary'
          : 'border border-border-subtle text-fg-subtle',
      )}
    >
      {children}
    </span>
  )
}

export function MarkedText({
  value,
  className,
  targetWord,
}: {
  value: CompiledMarkedText
  className?: string
  /** Primary color is reserved for the target word, never generic emphasis. */
  targetWord?: string
}) {
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const [index, highlight] of value.highlights.entries()) {
    if (cursor < highlight.start) parts.push(value.text.slice(cursor, highlight.start))
    const marked = value.text.slice(highlight.start, highlight.end)
    const isTarget = targetWord != null && marked.toLowerCase() === targetWord.toLowerCase()
    parts.push(
      <mark key={`${highlight.start}:${highlight.end}:${index}`} className={cn('bg-transparent font-semibold', isTarget ? 'text-primary' : 'text-fg')}>
        {marked}
      </mark>,
    )
    cursor = highlight.end
  }
  if (cursor < value.text.length) parts.push(value.text.slice(cursor))
  return <span className={className}>{parts}</span>
}
