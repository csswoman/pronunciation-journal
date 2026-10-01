'use client'

// Planned structure:
// <ReaderCard>
//   <CardHeader>
//     <LevelBadge /> (e.g. A1)
//     <AudioBadge /> (e.g. ◀ Voz HD)
//     <StatusBadge /> (e.g. A MEDIAS, Nueva, ✓ 3/3)
//   </CardHeader>
//   <CardBody>
//     <CardTitle /> (Bricolage font-display)
//     <CardSnippet /> (Text excerpt)
//     <TargetWordChips /> (asynchronous, bundle, etc.)
//   </CardBody>
//   <CardFooter>
//     <MetadataText /> (e.g. 29 sept · ~1 min)
//     <ActionGroup>
//       <DeleteButton />
//       <ReadButton /> (Leer →)
//     </ActionGroup>
//   </CardFooter>
// </ReaderCard>

import type { ReaderPassage } from '@/lib/practice/reader/types'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { Trash2, ArrowRight } from '@/components/icons'

interface ReaderCardProps {
  passage: ReaderPassage
  tone?: PastelTone
  onSelect: (passage: ReaderPassage) => void
  onDelete?: (passage: ReaderPassage) => void
  statusBadgeText?: string
}

export function ReaderCard({
  passage,
  tone = 'sky',
  onSelect,
  onDelete,
  statusBadgeText,
}: ReaderCardProps) {
  const formattedDate = new Date(passage.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  // Calculate read time estimate based on passage word count (~180 wpm)
  const wordCount = passage.passage ? passage.passage.split(/\s+/).length : 0
  const readMinutes = Math.max(1, Math.round(wordCount / 180))

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(passage)
    }
  }

  // Derive status badge default if not provided
  const derivedStatus =
    statusBadgeText ??
    (passage.questions && passage.questions.length > 0 ? '✓ 3/3' : 'A MEDIAS')

  return (
    <PastelCard
      tone={tone}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(passage)}
      onKeyDown={handleKeyDown}
      className="group flex flex-col justify-between rounded-3xl p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-ring cursor-pointer select-none text-left min-h-[340px] border border-black/10"
    >
      <div className="flex flex-col gap-3">
        {/* Badges Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-full bg-ink text-paper text-xs font-black flex items-center justify-center shrink-0 uppercase shadow-2xs">
              {passage.level.toUpperCase()}
            </span>
            {passage.audioUrl ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper/50 backdrop-blur-xs border border-black/10 px-2.5 py-1 text-xs font-medium text-fg">
                <span className="text-[10px]">◀</span> Voz HD
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper/50 backdrop-blur-xs border border-black/10 px-2.5 py-1 text-xs font-medium text-fg/75">
                Sin voz HD
              </span>
            )}
          </div>

          <div>
            {derivedStatus === '✓ 3/3' || derivedStatus.startsWith('✓') ? (
              <span className="rounded-full bg-ink text-paper px-3 py-1 text-xs font-bold flex items-center gap-1">
                {derivedStatus}
              </span>
            ) : derivedStatus === 'A MEDIAS' ? (
              <span className="rounded-full bg-ink text-paper px-3 py-1 text-xs font-bold uppercase tracking-wider">
                A MEDIAS
              </span>
            ) : (
              <span className="rounded-full bg-paper/60 backdrop-blur-xs border border-black/10 text-fg px-3 py-1 text-xs font-semibold">
                {derivedStatus}
              </span>
            )}
          </div>
        </div>

        {/* Topic Title with Bricolage Font */}
        <h3 className="font-display text-xl sm:text-2xl font-bold text-fg group-hover:text-ink transition-colors line-clamp-1 mt-2">
          {passage.topic || 'Lectura de práctica'}
        </h3>

        {/* Text Preview Snippet */}
        <p className="text-body-sm text-fg/80 line-clamp-3 leading-relaxed font-normal">
          {passage.passage}
        </p>

        {/* Target Vocabulary Chips */}
        {passage.targetItems && passage.targetItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {passage.targetItems.slice(0, 3).map((word) => (
              <span
                key={word}
                className="inline-flex items-center rounded-full bg-paper/85 backdrop-blur-xs px-3 py-1 text-xs font-mono font-medium text-fg border border-black/5 shadow-2xs"
              >
                {word}
              </span>
            ))}
            {passage.targetItems.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-paper/85 backdrop-blur-xs px-2.5 py-1 text-xs font-mono font-semibold text-fg/80 border border-black/5">
                +{passage.targetItems.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/10 text-xs font-mono text-fg/75">
        <span>{formattedDate} · ~{readMinutes} min</span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(passage)
              }}
              title="Eliminar lectura"
              aria-label="Eliminar lectura"
              className="p-1.5 rounded-full text-fg/70 hover:text-error hover:bg-black/10 transition-colors focus-ring"
            >
              <Trash2 className="size-4" />
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-secondary px-4 py-1.5 text-xs font-bold transition-transform active:scale-95 shadow-xs"
          >
            <span>Leer</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </PastelCard>
  )
}
