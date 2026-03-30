'use client'

import { STAGES, isStageUnlocked, overallMastery } from '@/lib/phoneme-practice/stages'
import type { StageDef, StageMasteryMap, StageId } from '@/lib/phoneme-practice/stages'

interface Props {
  soundIpa: string
  soundName: string
  mastery: StageMasteryMap
  hasPairs: boolean
  onSelectStage: (stageId: StageId) => void
}

function EarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M6 12a6 6 0 1 1 12 0c0 3-2 4-3 6" />
      <path d="M12 18a3 3 0 0 1-3-3" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M8 7H20M8 7l4-4M8 7l4 4" />
      <path d="M16 17H4M16 17l-4-4M16 17l-4 4" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function StageIcon({ icon }: { icon: StageDef['icon'] }) {
  switch (icon) {
    case 'ear': return <EarIcon />
    case 'swap': return <SwapIcon />
    case 'mic': return <MicIcon />
  }
}

function MasteryRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const filled = (pct / 100) * circumference

  const color =
    pct >= 80 ? '#22c55e' :
    pct >= 50 ? '#f59e0b' :
    pct > 0   ? '#a78bfa' :
    '#374151'

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  )
}

export function StageLobby({ soundIpa, soundName, mastery, hasPairs, onSelectStage }: Props) {
  const overall = overallMastery(mastery, hasPairs)
  const visibleStages = hasPairs ? STAGES : STAGES.filter(s => s.id !== 'pairs')

  const nextUnlocked = visibleStages.find(s => {
    const unlocked = isStageUnlocked(s.id, mastery, hasPairs)
    const m = mastery[s.id]
    return unlocked && m.pct < 80
  })

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <MasteryRing pct={overall} size={56} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-200">
            {overall}%
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold font-mono text-purple-400">{soundIpa}</div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
            {soundName} · {visibleStages.length} stages
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {visibleStages.map((stage, i) => {
          const unlocked = isStageUnlocked(stage.id, mastery, hasPairs)
          const m = mastery[stage.id]
          const isNext = nextUnlocked?.id === stage.id

          return (
            <button
              key={stage.id}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectStage(stage.id)}
              className={`w-full text-left rounded-2xl border px-4 py-4 flex items-center gap-4 transition-colors
                ${unlocked
                  ? isNext
                    ? 'bg-white dark:bg-gray-800 border-purple-500/60 dark:border-purple-500/40 shadow-sm hover:border-purple-400'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  : 'bg-gray-900/40 border-gray-800 opacity-60 cursor-not-allowed'
                }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${unlocked ? 'bg-purple-900/40 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                <StageIcon icon={stage.icon} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Stage {i + 1} —</span>
                  <span className={`text-sm font-semibold ${unlocked ? 'text-gray-100' : 'text-gray-500'}`}>
                    {stage.title}
                  </span>
                </div>
                <span className={`text-xs mt-0.5 ${stage.difficulty === 'Easy' ? 'text-green-500' : 'text-amber-500'}`}>
                  {stage.difficulty}
                </span>
              </div>

              {/* Right side: mastery % or lock */}
              <div className="flex-shrink-0">
                {!unlocked ? (
                  <span className="text-gray-600"><LockIcon /></span>
                ) : m.total > 0 ? (
                  <div className="relative w-9 h-9">
                    <MasteryRing pct={m.pct} size={36} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-300">
                      {m.pct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-600 font-medium">—</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      {nextUnlocked && (
        <button
          onClick={() => onSelectStage(nextUnlocked.id)}
          className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors"
        >
          Start Next Stage
        </button>
      )}

      {!nextUnlocked && (
        <p className="text-center text-xs text-gray-500">
          All stages completed! Keep practicing to improve your score.
        </p>
      )}
    </div>
  )
}
