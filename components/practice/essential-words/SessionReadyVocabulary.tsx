'use client'

// Planned structure:
// <SessionReadyVocabulary> title + mounting segmented bar + legend </SessionReadyVocabulary>

import type { VocabBucket } from '@/lib/essential-words/ready-vocabulary'
import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

const LABELS: { key: VocabBucket; label: string; tone: string }[] = [
  { key: 'nuevas', label: 'Nuevas', tone: 'bg-primary/30' },
  { key: 'aprendiendo', label: 'Aprendiendo', tone: 'bg-primary/55' },
  { key: 'en_repaso', label: 'En repaso', tone: 'bg-primary/75' },
  { key: 'dominadas', label: 'Dominadas', tone: 'bg-primary' },
]

interface Props {
  buckets: Record<VocabBucket, number>
  totalWords?: number
}

export function SessionReadyVocabulary({ buckets, totalWords }: Props) {
  const touched = LABELS.reduce((sum, row) => sum + buckets[row.key], 0)
  if (touched === 0) return null

  const meta =
    totalWords && totalWords > 0
      ? `${touched} de ${totalWords}`
      : `${touched} tocadas`

  return (
    <SessionSurface density="compact">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="m-0 font-label text-fg">Tu vocabulario</h3>
        <span className="font-caption tabular-nums text-fg-muted">{meta}</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="img"
        aria-label={LABELS.map((row) => `${row.label}: ${buckets[row.key]}`).join(', ')}
      >
        <div className="progress-fill-mount flex h-full w-full">
          {LABELS.map((row) => {
            const value = buckets[row.key]
            if (value <= 0) return null
            return (
              <div
                key={row.key}
                className={cn('h-full', row.tone)}
                style={{ width: `${(value / touched) * 100}%` }}
                title={`${row.label}: ${value}`}
              />
            )
          })}
        </div>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
        {LABELS.map((row) => (
          <li key={row.key} className="inline-flex items-center gap-1.5 text-caption text-fg-muted">
            <span className={cn('size-2 shrink-0 rounded-full', row.tone)} aria-hidden />
            {row.label}{' '}
            <span className="tabular-nums text-fg">{buckets[row.key]}</span>
          </li>
        ))}
      </ul>
    </SessionSurface>
  )
}
