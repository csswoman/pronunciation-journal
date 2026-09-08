'use client'

// Planned structure:
// <ReaderCard>
//   <CardHeader> (Level badge, Audio badge) </CardHeader>
//   <CardBody> (Topic title, Text preview, Target word chips) </CardBody>
//   <CardFooter> (Date, estimated read time) </CardFooter>
// </ReaderCard>

import type { ReaderPassage } from '@/lib/practice/reader/types'
import Badge from '@/components/ui/Badge'
import { Trash2 } from '@/components/icons'

interface ReaderCardProps {
  passage: ReaderPassage
  onSelect: (passage: ReaderPassage) => void
  onDelete?: (passage: ReaderPassage) => void
}

export function ReaderCard({ passage, onSelect, onDelete }: ReaderCardProps) {
  const formattedDate = new Date(passage.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(passage)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(passage)}
      onKeyDown={handleKeyDown}
      className="group flex flex-col justify-between rounded-2xl border border-border-default bg-surface-raised p-5 shadow-xs transition-all hover:border-primary/50 hover:bg-surface-raised/80 hover:shadow-sm focus-ring cursor-pointer select-none text-left"
    >
      <div className="flex flex-col gap-3">
        {/* Badges Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge label={`Nivel ${passage.level.toUpperCase()}`} variant="neutral" size="sm" />
          {passage.audioUrl ? (
            <Badge
              label="Voz HD"
              variant="default"
              size="sm"
              dot
            />
          ) : (
            <Badge label="Sin audio HD" variant="neutral" size="sm" />
          )}
        </div>

        {/* Topic Title */}
        <h3 className="text-body-lg font-semibold text-fg group-hover:text-primary transition-colors line-clamp-1">
          {passage.topic || 'Lectura de práctica'}
        </h3>

        {/* Text Preview Snippet */}
        <p className="text-body-sm text-fg-muted line-clamp-2 leading-relaxed">
          {passage.passage}
        </p>

        {/* Vocabulary Chips */}
        {passage.targetItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {passage.targetItems.slice(0, 4).map((word) => (
              <span
                key={word}
                className="inline-flex items-center rounded-md bg-surface-sunken px-2 py-0.5 text-caption font-mono text-fg-muted border border-border-subtle"
              >
                {word}
              </span>
            ))}
            {passage.targetItems.length > 4 && (
              <span className="text-caption font-mono text-fg-muted self-center">
                +{passage.targetItems.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-border-subtle text-caption text-fg-muted font-mono">
        <span>{formattedDate}</span>
        <div className="flex items-center gap-2.5">
          <span>~1 min de lectura</span>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(passage)
              }}
              title="Eliminar lectura"
              aria-label="Eliminar lectura"
              className="p-1 rounded-md text-fg-muted hover:text-error hover:bg-surface-sunken transition-colors opacity-70 hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
