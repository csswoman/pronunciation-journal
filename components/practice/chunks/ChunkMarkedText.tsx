import type { ReactNode } from 'react'
import type { ChunkTextHighlight } from '@/lib/chunk-of-day/types'

interface Props {
  text: string
  highlights: readonly ChunkTextHighlight[]
}

/** Renders author-validated focus ranges without exposing authoring markup. */
export function ChunkMarkedText({ text, highlights }: Props) {
  if (highlights.length === 0) return text

  const parts: ReactNode[] = []
  let cursor = 0
  for (const highlight of highlights) {
    if (cursor < highlight.start) parts.push(text.slice(cursor, highlight.start))
    parts.push(<mark key={`${highlight.start}:${highlight.end}`} className="bg-transparent font-semibold text-primary underline decoration-primary/60 decoration-2 underline-offset-4">{text.slice(highlight.start, highlight.end)}</mark>)
    cursor = highlight.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}
