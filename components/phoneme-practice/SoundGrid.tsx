'use client'

import { useRouter } from 'next/navigation'
import type { Sound } from '@/lib/phoneme-practice/types'

interface Props {
  sounds: Sound[]
  /** Accuracy (0-100) by IPA. >=85 = mastered, >0 = in progress. */
  accuracyByIpa: Map<string, number>
}

function scoreColorClass(score: number): string {
  if (score >= 85) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-error'
}

export function SoundGrid({ sounds, accuracyByIpa }: Props) {
  const router = useRouter()

  const mastered   = sounds.filter(s => (accuracyByIpa.get(s.ipa) ?? 0) >= 85).length
  const inProgress = sounds.filter(s => { const v = accuracyByIpa.get(s.ipa) ?? 0; return v > 0 && v < 85 }).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-kicker text-fg-subtle">
            SOUNDS
          </p>
          <p className="text-body-sm font-semibold mt-0.5 text-fg">
            {mastered} mastered · {inProgress} within reach
          </p>
        </div>
        <span className="text-caption text-fg-subtle">
          {sounds.length} total phonemes
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
        {sounds.map(s => {
          const score = accuracyByIpa.get(s.ipa) ?? null
          const isMastered   = (score ?? 0) >= 85
          const isPracticing = score !== null && score > 0 && score < 85
          const isAvailable  = score === null

          const tooltipParts = [
            s.ipa,
            s.example ? `"${s.example}"` : null,
            isMastered ? 'Mastered' : isPracticing ? 'In progress' : 'Untouched',
            score !== null ? `${score}% accuracy` : null,
          ].filter(Boolean)

          const subText = isMastered ? '✓' : score !== null ? String(score) : isAvailable ? '—' : ''

          const tileClass = isMastered
            ? 'bg-primary border-primary shadow-xs'
            : isPracticing
            ? 'bg-primary-soft border-primary/45 shadow-xs'
            : 'bg-surface-raised border-border-subtle'

          const ipaClass = isMastered ? 'text-on-primary' : isPracticing ? 'text-primary' : 'text-fg'
          const subClass = isMastered
            ? 'text-on-primary/65'
            : isPracticing && score !== null
            ? scoreColorClass(score)
            : 'text-fg-subtle'

          return (
            <button
              key={s.id}
              onClick={() => router.push(`/practice/sounds/sound/${s.id}`)}
              title={tooltipParts.join(' — ')}
              className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 transition-all active:scale-95 relative group ${tileClass}`}
            >
              <div className="absolute inset-0 rounded-xl bg-black opacity-0 transition-opacity group-hover:opacity-5 pointer-events-none" />
              <span className={`font-mono font-bold text-body-sm leading-none tracking-tight ${ipaClass}`}>
                {s.ipa}
              </span>
              <span className={`mt-1 text-tiny font-semibold tabular-nums leading-none ${subClass}`}>
                {subText}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {[
          { label: 'Mastered',    tileClass: 'bg-primary border-primary' },
          { label: 'In progress', tileClass: 'bg-primary-soft border-primary/45' },
          { label: 'Untouched',   tileClass: 'bg-surface-raised border-border-subtle' },
        ].map(({ label, tileClass }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded border ${tileClass}`} />
            <span className="text-tiny text-fg-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
