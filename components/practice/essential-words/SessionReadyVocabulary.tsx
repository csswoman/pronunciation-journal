'use client'

import type { VocabBucket } from '@/lib/essential-words/ready-vocabulary'
import PastelCard from '@/components/layout/PastelCard'

const LABELS: { key: VocabBucket; label: string; dotTone: string; barTone: string }[] = [
  { key: 'nuevas', label: 'Nuevas', dotTone: 'bg-butter-deep', barTone: 'bg-butter-deep' },
  { key: 'aprendiendo', label: 'Aprendiendo', dotTone: 'bg-sky-deep', barTone: 'bg-sky-deep' },
  { key: 'en_repaso', label: 'En repaso', dotTone: 'bg-coral-deep', barTone: 'bg-coral-deep' },
  { key: 'dominadas', label: 'Dominadas', dotTone: 'bg-ink', barTone: 'bg-ink' },
]

interface Props {
  buckets: Record<VocabBucket, number>
  totalWords?: number
}

export function SessionReadyVocabulary({ buckets, totalWords = 2800 }: Props) {
  const touched = LABELS.reduce((sum, row) => sum + (buckets[row.key] ?? 0), 0)
  const displayTotal = totalWords && totalWords > 0 ? totalWords : 2800

  return (
    <PastelCard
      tone="lilac"
      className="p-6 flex flex-col gap-4 shadow-sm animate-home-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-xs font-bold tracking-widest text-ink-secondary uppercase">
          Tu vocabulario
        </h3>
        <span className="text-2xl font-black text-ink tracking-tight">
          {touched} de {displayTotal}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-3.5 w-full overflow-hidden rounded-full bg-ink/10 flex p-0.5"
        role="img"
        aria-label={LABELS.map((row) => `${row.label}: ${buckets[row.key] ?? 0}`).join(', ')}
      >
        {LABELS.map((row) => {
          const value = buckets[row.key] ?? 0
          if (value <= 0) return null
          const pct = Math.max(1.5, (value / displayTotal) * 100)
          return (
            <div
              key={row.key}
              className={`h-full rounded-full transition-all ${row.barTone}`}
              style={{ width: `${pct}%` }}
              title={`${row.label}: ${value}`}
            />
          )
        })}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-1">
        {LABELS.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-secondary">
            <span className={`size-2.5 rounded-full shrink-0 ${row.dotTone}`} aria-hidden />
            <span>{row.label}</span>
            <span className="font-black text-ink ml-auto tabular-nums">
              {buckets[row.key] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </PastelCard>
  )
}
