// Planned structure:
// <SkillProfileCard>
//   <WordsByStatus />
//   <WeakestPhonemes />
// </SkillProfileCard>

import { BarChart3 } from 'lucide-react'

import type { SkillProfileData } from '@/lib/progress/queries'

interface Props {
  data: SkillProfileData
}

const STATUS_CONFIG: {
  key: keyof SkillProfileData['wordsByStatus']
  label: string
  color: string
}[] = [
  { key: 'new', label: 'New', color: 'var(--line-divider)' },
  { key: 'learning', label: 'Learning', color: 'color-mix(in oklch, var(--primary) 50%, oklch(0.6 0.15 60))' },
  { key: 'review', label: 'Review', color: 'color-mix(in oklch, var(--primary) 75%, transparent)' },
  { key: 'mastered', label: 'Mastered', color: 'var(--primary)' },
]

function WordsByStatus({ wordsByStatus }: { wordsByStatus: SkillProfileData['wordsByStatus'] }) {
  const total = Object.values(wordsByStatus).reduce((a, b) => a + b, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-[0.15em]">Word Bank</p>
        <p className="text-xs text-fg-muted">No words added yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-muted">
        Word Bank · {total} words
      </p>

      {/* Stacked bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--line-divider)' }}>
        {STATUS_CONFIG.map(({ key, color }) => {
          const pct = total > 0 ? (wordsByStatus[key] / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={key}
              style={{ width: `${pct}%`, background: color }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {STATUS_CONFIG.map(({ key, label, color }) => {
          const count = wordsByStatus[key]
          if (count === 0) return null
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-fg-muted">
                {label} <span className="font-semibold text-fg">{count}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeakestPhonemes({ phonemes }: { phonemes: SkillProfileData['weakestPhonemes'] }) {
  if (phonemes.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-muted">Phonemes</p>
        <p className="text-xs text-fg-muted">Practice phoneme exercises to see your weakest sounds.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-muted">
        Weakest Phonemes
      </p>
      <div className="flex flex-col gap-2">
        {phonemes.map((p) => (
          <div key={p.ipa} className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
              style={{
                background: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                color: 'var(--primary)',
              }}
            >
              /{p.ipa}/
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fg-muted">{p.totalAttempts} attempts</span>
                <span className="text-xs font-semibold text-fg">
                  {p.accuracy}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--line-divider)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${p.accuracy}%`,
                    background: p.accuracy >= 70 ? 'var(--primary)' : 'color-mix(in oklch, var(--primary) 60%, oklch(0.6 0.15 30))',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkillProfileCard({ data }: Props) {
  const hasAnyData =
    Object.values(data.wordsByStatus).some((v) => v > 0) ||
    data.weakestPhonemes.length > 0

  return (
    <div
      className="flex flex-col gap-6 rounded-3xl p-6"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in oklch, var(--primary) 13%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <BarChart3 size={18} />
        </div>
        <span className="text-sm font-semibold text-fg">Skill Profile</span>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm font-medium text-fg-muted">Nothing to show yet</p>
          <p className="text-xs text-fg-muted text-center">
            Add words to your word bank and practice phoneme exercises to build your skill profile.
          </p>
        </div>
      ) : (
        <>
          <WordsByStatus wordsByStatus={data.wordsByStatus} />
          <div className="h-px w-full" style={{ background: 'var(--line-divider)' }} />
          <WeakestPhonemes phonemes={data.weakestPhonemes} />
        </>
      )}
    </div>
  )
}
