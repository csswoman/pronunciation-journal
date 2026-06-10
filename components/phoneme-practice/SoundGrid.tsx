'use client'

import { useRouter } from 'next/navigation'
import type { Sound } from '@/lib/phoneme-practice/types'

interface Props {
  sounds: Sound[]
  /** Accuracy (0-100) by IPA. >=85 = mastered, >0 = in progress. */
  accuracyByIpa: Map<string, number>
}

function scoreColor(score: number): string {
  if (score >= 85) return 'oklch(0.62 0.17 145)'
  if (score >= 60) return 'oklch(0.68 0.16 70)'
  return 'oklch(0.62 0.18 30)'
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
          <p className="text-tiny font-bold uppercase tracking-[0.24em] text-fg-subtle">
            SOUNDS
          </p>
          <p className="text-sm font-semibold mt-0.5 text-fg">
            {mastered} mastered · {inProgress} within reach
          </p>
        </div>
        <span className="text-xs text-fg-subtle">
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

          const bg = isMastered
            ? 'var(--primary)'
            : isPracticing
            ? 'color-mix(in oklch, var(--primary) 12%, var(--card-bg))'
            : 'var(--card-bg)'

          const border = isMastered
            ? 'var(--primary)'
            : isPracticing
            ? 'color-mix(in oklch, var(--primary) 45%, transparent)'
            : 'color-mix(in oklch, var(--line-divider) 100%, transparent)'

          const ipaColor = isMastered
            ? 'var(--on-primary)'
            : isPracticing
            ? 'var(--primary)'
            : 'var(--text-primary)'

          const subColor = isMastered
            ? 'rgba(var(--on-primary), 0.65)'
            : isPracticing && score !== null
            ? scoreColor(score)
            : 'var(--text-tertiary)'

          const subText = isMastered ? '✓' : score !== null ? String(score) : isAvailable ? '—' : ''

          return (
            <button
              key={s.id}
              onClick={() => router.push(`/practice/sounds/sound/${s.id}`)}
              title={tooltipParts.join(' — ')}
              className="flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all active:scale-95 relative group"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: isPracticing
                  ? '0 1px 4px color-mix(in oklch, var(--primary) 14%, transparent)'
                  : isAvailable
                  ? '0 1px 3px var(--line-divider)'
                  : 'none',
              }}
            >
              <div className="absolute inset-0 rounded-xl bg-black opacity-0 transition-opacity group-hover:opacity-5 pointer-events-none" />
              <span
                className="font-mono font-bold text-sm leading-none"
                style={{ color: ipaColor, letterSpacing: '-0.01em' }}
              >
                {s.ipa}
              </span>
              <span
                className="mt-1 text-tiny font-semibold tabular-nums leading-none"
                style={{ color: subColor }}
              >
                {subText}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {[
          { label: 'Mastered',    bg: 'var(--primary)',                                            border: 'var(--primary)' },
          { label: 'In progress', bg: 'color-mix(in oklch, var(--primary) 12%, var(--card-bg))',   border: 'color-mix(in oklch, var(--primary) 45%, transparent)' },
          { label: 'Untouched',   bg: 'var(--card-bg)',                                            border: 'var(--line-divider)' },
        ].map(({ label, bg, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: bg, border: `1px solid ${border}` }} />
            <span className="text-tiny text-fg-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
