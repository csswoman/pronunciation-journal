import type { LessonStageDef, LessonStageMastery, DifficultyMode } from './lesson-lobby-types'

interface Props {
  stage: LessonStageDef
  mastery: LessonStageMastery
  isNext: boolean
  unlocked: boolean
  diffMode: DifficultyMode
  onSelect: (diffMode: DifficultyMode) => void
}

export function StageCard({ stage, mastery, isNext, unlocked, diffMode, onSelect }: Props) {
  return (
    <button
      disabled={!unlocked}
      onClick={() => unlocked && onSelect(diffMode)}
      className="group text-left rounded-xl border p-5 transition-all duration-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
      style={{
        backgroundColor: isNext
          ? 'color-mix(in_oklch,var(--primary)_7%,var(--card-bg))'
          : 'var(--card-bg)',
        borderColor: isNext ? 'var(--primary)' : 'var(--line-divider)',
        opacity: unlocked ? 1 : 0.45,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        boxShadow: isNext ? '0 0 0 1px var(--primary), 0 12px 30px rgba(0,0,0,0.06)' : '0 1px 3px var(--line-divider)',
      }}
    >
      {stage.recommended && mastery.attempts === 0 && (
        <span
          className="absolute right-4 top-4 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          recommended
        </span>
      )}

      {!unlocked && (
        <span className="absolute right-4 top-4 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
          <LockIcon />
        </span>
      )}

      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl text-xl" style={{ background: 'var(--btn-regular-bg)' }}>
          {stage.emoji}
        </span>
        <span
          className="text-[17px] font-semibold leading-tight"
          style={{ color: unlocked ? 'var(--deep-text)' : 'var(--text-tertiary)' }}
        >
          {stage.title}
        </span>
      </div>

      <p className="text-[14px] leading-6 mb-4 text-[var(--text-secondary)]">
        {stage.subtitle}
      </p>

      <StageProgressBar pct={mastery.pct} attempts={mastery.attempts} color={stage.barColor} />

      <p className="mt-2 text-[12px] font-medium text-[var(--text-tertiary)]">
        {mastery.attempts === 0 ? 'Not started' : `${mastery.pct}% mastery`}
      </p>
    </button>
  )
}

function StageProgressBar({ pct, attempts, color }: { pct: number; attempts: number; color: string }) {
  return (
    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--btn-regular-bg)' }}>
      {attempts === 0 ? (
        <div className="h-full w-1/5 rounded-full overflow-hidden">
          <DiagonalStripes color={color} />
        </div>
      ) : (
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      )}
    </div>
  )
}

function DiagonalStripes({ color }: { color: string }) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-full">
      <div
        className="absolute inset-0"
        style={{
          background: `${color}`,
        }}
      />
    </div>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
