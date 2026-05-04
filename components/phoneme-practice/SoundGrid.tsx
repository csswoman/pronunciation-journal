'use client'

import { useRouter } from 'next/navigation'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

interface Props {
  progressList: UserSoundProgressWithSound[]
}

const STATUS_LABEL: Record<string, string> = {
  locked:     'Not started',
  available:  'Ready to practice',
  practicing: 'In progress',
  mastered:   'Mastered',
}

function scoreColor(score: number): string {
  if (score >= 85) return 'oklch(0.62 0.17 145)'
  if (score >= 60) return 'oklch(0.68 0.16 70)'
  return 'oklch(0.62 0.18 30)'
}

export function SoundGrid({ progressList }: Props) {
  const router = useRouter()

  const mastered = progressList.filter(p => p.status === 'mastered').length
  const inProgress = progressList.filter(p => p.status === 'practicing').length

  function handleClick(p: UserSoundProgressWithSound) {
    if (p.status === 'locked') return
    router.push(`/practice/sound/${p.sound_id}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-tiny font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--text-tertiary)' }}>
            SOUNDS
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--deep-text)' }}>
            {mastered} mastered · {inProgress} within reach
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {progressList.length} total phonemes
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
        {progressList.map(p => {
          const score = p.total_attempts > 0
            ? Math.round((p.correct_answers / p.total_attempts) * 100)
            : null

          const tooltipParts = [
            `/${p.sounds.ipa}/`,
            p.sounds.example ? `"${p.sounds.example}"` : null,
            STATUS_LABEL[p.status],
            score !== null ? `${score}% accuracy` : null,
            p.total_attempts > 0 ? `${p.total_attempts} attempts` : null,
          ].filter(Boolean)

          // Per-status visual treatment
          const isMastered  = p.status === 'mastered'
          const isPracticing = p.status === 'practicing'
          const isAvailable  = p.status === 'available'
          const isLocked     = p.status === 'locked'

          const bg = isMastered
            ? 'var(--primary)'
            : isPracticing
            ? 'color-mix(in oklch, var(--primary) 12%, var(--card-bg))'
            : isAvailable
            ? 'var(--card-bg)'
            : 'transparent'

          const border = isMastered
            ? 'var(--primary)'
            : isPracticing
            ? 'color-mix(in oklch, var(--primary) 45%, transparent)'
            : isAvailable
            ? 'color-mix(in oklch, var(--line-divider) 100%, transparent)'
            : 'var(--line-divider)'

          const ipaColor = isMastered
            ? 'var(--on-primary)'
            : isPracticing
            ? 'var(--primary)'
            : isAvailable
            ? 'var(--deep-text)'
            : 'var(--text-tertiary)'

          const subColor = isMastered
            ? 'rgba(var(--on-primary), 0.65)'
            : isPracticing && score !== null
            ? scoreColor(score)
            : 'var(--text-tertiary)'

          const subText = isMastered
            ? '✓'
            : score !== null
            ? String(score)
            : isAvailable
            ? '—'
            : ''

          return (
            <button
              key={p.sound_id}
              onClick={() => handleClick(p)}
              title={tooltipParts.join(' — ')}
              disabled={isLocked}
              className="flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all hover:brightness-95 active:scale-95"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.35 : 1,
                boxShadow: isPracticing
                  ? '0 1px 4px color-mix(in oklch, var(--primary) 14%, transparent)'
                  : isAvailable
                  ? '0 1px 3px var(--line-divider)'
                  : 'none',
              }}
            >
              <span
                className="font-mono font-bold text-sm leading-none"
                style={{ color: ipaColor, letterSpacing: '-0.01em' }}
              >
                {p.sounds.ipa}
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
          { label: 'Mastered',    bg: 'var(--primary)',                                              border: 'var(--primary)' },
          { label: 'In progress', bg: 'color-mix(in oklch, var(--primary) 12%, var(--card-bg))',     border: 'color-mix(in oklch, var(--primary) 45%, transparent)' },
          { label: 'Untouched',   bg: 'var(--card-bg)',                                              border: 'var(--line-divider)' },
        ].map(({ label, bg, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-[4px]" style={{ background: bg, border: `1px solid ${border}` }} />
            <span className="text-tiny" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
