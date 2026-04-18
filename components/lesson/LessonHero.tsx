import Link from 'next/link'
import type { Lesson } from '@/lib/types'
import type { DifficultyMode } from './lesson-lobby-types'

interface Props {
  lesson: Lesson
  totalWords: number
  chunkLabel: string | null
  overall: number
  diffMode: DifficultyMode
  onDiffChange: (mode: DifficultyMode) => void
  backHref?: string
}

export function LessonHero({ lesson, totalWords, chunkLabel, overall, diffMode, onDiffChange, backHref }: Props) {
  const visibleWords = lesson.words.slice(0, 6)
  const extraCount = lesson.words.length - visibleWords.length
  const estMin = Math.max(3, Math.ceil(totalWords * 0.4))

  return (
    <div className="relative overflow-hidden rounded-t-[15px] bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="relative space-y-6">
        <div
          className="flex items-center justify-between px-4 py-2.5 border border-b border-[var(--line-divider)]"
        >
          <div className="flex items-center gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200 hover:-translate-x-0.5"
                style={{
                  borderColor: 'var(--line-divider)',
                  color: 'var(--text-secondary)',
                  background: 'color-mix(in_oklch,var(--card-bg)_80%,transparent)',
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M10 12L6 8l4-4" />
                </svg>
                Back
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Lesson{chunkLabel && <> · {chunkLabel}</>}
              </span>
            </div>
          </div>

          <DifficultyToggle value={diffMode} onChange={onDiffChange} />
        </div>

        <div className="p-8 md:p-10 max-w-2xl space-y-3">
          <h1 className="font-display text-[28px] font-semibold leading-[1.08] tracking-tight text-[var(--deep-text)] lg:text-[34px]">
            {lesson.title}
          </h1>
          <p className="max-w-xl text-[15px] leading-6 text-[var(--text-secondary)]">
            Pick a practice mode that matches your energy — start easy, build confidence, then push your limits.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-8 px-10 py-3 text-[13px] font-medium"
          style={{
            border: '1px solid var(--line-divider)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M2 8h8M2 12h5" />
            </svg>
            {totalWords} words
          </span>

          <span style={{ color: 'var(--line-divider)' }}>|</span>

          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 1.5" />
            </svg>
            {estMin} min
          </span>

          <span style={{ color: 'var(--line-divider)' }}>|</span>

          {visibleWords.length > 0 && (
            <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
              {visibleWords.map((w, i) => (
                <span key={w.word} className="flex items-center gap-1">
                  <span className="hover:text-[var(--deep-text)] transition-colors cursor-pointer">{w.word}</span>
                  {(i < visibleWords.length - 1 || extraCount > 0) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
                      <circle cx="6" cy="6" r="1.8" />
                    </svg>
                  )}
                </span>
              ))}
              {extraCount > 0 && (
                <span style={{ color: 'var(--text-tertiary)' }}>+{extraCount} more</span>
              )}
            </span>
          )}

          {overall >= 80 && (
            <>
              <span style={{ color: 'var(--line-divider)' }}>|</span>
              <span className="flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" />
                </svg>
                Lesson complete
              </span>
            </>
          )}
          {overall > 0 && overall < 80 && (
            <>
              <span style={{ color: 'var(--line-divider)' }}>|</span>
              <span className="flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3" /><circle cx="8" cy="11" r="0.5" fill="currentColor" />
                </svg>
                {overall}% mastered
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface DifficultyToggleProps {
  value: DifficultyMode
  onChange: (mode: DifficultyMode) => void
}

function DifficultyToggle({ value, onChange }: DifficultyToggleProps) {
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Difficulty
      </p>
      <div className="inline-flex rounded-2xl border border-[var(--line-divider)] bg-[color-mix(in_oklch,var(--card-bg)_70%,transparent)] p-1 text-sm font-semibold shadow-sm backdrop-blur-sm">
        <button
          onClick={() => onChange('chill')}
          className="rounded-xl px-4 py-2 transition-all duration-200"
          style={{
            background: value === 'chill' ? 'var(--btn-regular-bg)' : 'transparent',
            color: value === 'chill' ? 'var(--deep-text)' : 'var(--text-secondary)',
          }}
        >
          Chill
        </button>
        <button
          onClick={() => onChange('master')}
          className="rounded-xl px-4 py-2 transition-all duration-200"
          style={{
            background: value === 'master' ? 'var(--primary)' : 'transparent',
            color: value === 'master' ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
        >
          Master
        </button>
      </div>
    </div>
  )
}
