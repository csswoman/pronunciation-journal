'use client'

import type { Lesson } from '@/lib/types'

export type LessonStageId = 'guided' | 'pronunciation' | 'speed'

export interface LessonStageDef {
  id: LessonStageId
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  icon: 'ear' | 'mic' | 'bolt'
}

export const LESSON_STAGES: LessonStageDef[] = [
  {
    id: 'guided',
    title: 'Listen & Repeat',
    description: 'Hear each word, then record yourself',
    difficulty: 'Easy',
    icon: 'ear',
  },
  {
    id: 'pronunciation',
    title: 'Pronunciation',
    description: 'Pronounce each word without the IPA hint',
    difficulty: 'Medium',
    icon: 'mic',
  },
  {
    id: 'speed',
    title: 'Speed Round',
    description: 'Go through all words as fast as you can',
    difficulty: 'Hard',
    icon: 'bolt',
  },
]

// ── Stage mastery stored as accuracy per stage ────────────────────────────────

export interface LessonStageMastery {
  pct: number   // 0-100, 0 = never attempted
  attempts: number
}

export type LessonStageMasteryMap = Record<LessonStageId, LessonStageMastery>

export function emptyLessonMastery(): LessonStageMasteryMap {
  return {
    guided:       { pct: 0, attempts: 0 },
    pronunciation: { pct: 0, attempts: 0 },
    speed:        { pct: 0, attempts: 0 },
  }
}

export function isLessonStageUnlocked(id: LessonStageId, mastery: LessonStageMasteryMap): boolean {
  switch (id) {
    case 'guided':       return true
    case 'pronunciation': return mastery.guided.attempts >= 1
    case 'speed':        return mastery.pronunciation.attempts >= 1
  }
}

export function overallLessonMastery(mastery: LessonStageMasteryMap): number {
  const vals = Object.values(mastery).filter(m => m.attempts > 0)
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((s, m) => s + m.pct, 0) / vals.length)
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function EarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M6 12a6 6 0 1 1 12 0c0 3-2 4-3 6" />
      <path d="M12 18a3 3 0 0 1-3-3" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function StageIcon({ icon }: { icon: LessonStageDef['icon'] }) {
  switch (icon) {
    case 'ear':  return <EarIcon />
    case 'mic':  return <MicIcon />
    case 'bolt': return <BoltIcon />
  }
}

function MasteryRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const filled = (pct / 100) * circumference
  const strokeColor =
    pct >= 80 ? 'var(--admonitions-color-tip)' :
    pct >= 50 ? 'var(--admonitions-color-warning)' :
    pct > 0   ? 'var(--primary)' :
    'var(--line-color)'
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        style={{ stroke: 'var(--btn-regular-bg)' }} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        style={{ stroke: strokeColor }} strokeWidth={4}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  lesson: Lesson
  /** Total words across all chunks (not just current session) */
  totalWords: number
  /** Which chunk (1-based) is being shown this session */
  sessionChunk: number
  totalChunks: number
  mastery: LessonStageMasteryMap
  onSelectStage: (stageId: LessonStageId) => void
}

export function LessonLobby({ lesson, totalWords, sessionChunk, totalChunks, mastery, onSelectStage }: Props) {
  const overall = overallLessonMastery(mastery)

  const nextUnlocked = LESSON_STAGES.find(s => {
    const unlocked = isLessonStageUnlocked(s.id, mastery)
    return unlocked && mastery[s.id].pct < 80
  })

  const difficultyColor = (d: LessonStageDef['difficulty']) =>
    d === 'Easy' ? 'var(--admonitions-color-tip)' :
    d === 'Medium' ? 'var(--admonitions-color-warning)' :
    'var(--admonitions-color-caution)'

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="rounded-2xl border p-5 flex items-center gap-4" style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--line-divider)',
      }}>
        <div className="relative flex-shrink-0">
          <MasteryRing pct={overall} size={56} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: 'var(--text-secondary)' }}>
            {overall}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {lesson.title}
          </div>
          <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {totalChunks > 1
              ? `Set ${sessionChunk} of ${totalChunks} · ${lesson.words.length} words`
              : `${totalWords} words`
            } · {LESSON_STAGES.length} stages
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {LESSON_STAGES.map((stage, i) => {
          const unlocked = isLessonStageUnlocked(stage.id, mastery)
          const m = mastery[stage.id]
          const isNext = nextUnlocked?.id === stage.id

          return (
            <button
              key={stage.id}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectStage(stage.id)}
              className="w-full text-left rounded-2xl border px-4 py-4 flex items-center gap-4 transition-colors"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: unlocked
                  ? isNext ? 'var(--primary)' : 'var(--line-divider)'
                  : 'var(--line-color)',
                opacity: unlocked ? 1 : 0.5,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                boxShadow: isNext ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--btn-regular-bg)',
                  color: unlocked ? 'var(--primary)' : 'var(--text-tertiary)',
                }}>
                <StageIcon icon={stage.icon} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Stage {i + 1} —</span>
                  <span className="text-sm font-semibold"
                    style={{ color: unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {stage.title}
                  </span>
                </div>
                <span className="text-xs mt-0.5 block" style={{ color: difficultyColor(stage.difficulty) }}>
                  {stage.difficulty}
                </span>
              </div>

              {/* Right: mastery ring or lock */}
              <div className="flex-shrink-0">
                {!unlocked ? (
                  <span style={{ color: 'var(--text-tertiary)' }}><LockIcon /></span>
                ) : m.attempts > 0 ? (
                  <div className="relative w-9 h-9">
                    <MasteryRing pct={m.pct} size={36} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ color: 'var(--text-secondary)' }}>
                      {m.pct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>—</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      {nextUnlocked ? (
        <button
          onClick={() => onSelectStage(nextUnlocked.id)}
          className="btn-primary w-full py-3.5 rounded-2xl font-bold text-sm"
        >
          Start Next Stage
        </button>
      ) : (
        <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          All stages completed! Keep practicing to improve your score.
        </p>
      )}
    </div>
  )
}
