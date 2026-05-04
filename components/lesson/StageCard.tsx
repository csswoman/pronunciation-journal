import { Ear, Mic, Zap, type LucideIcon } from 'lucide-react'
import type { LessonStageDef, LessonStageMastery, DifficultyMode } from './lesson-lobby-types'

interface Props {
  stage: LessonStageDef
  mastery: LessonStageMastery
  index: number
  unlocked: boolean
  diffMode: DifficultyMode
  onSelect: (diffMode: DifficultyMode) => void
}

const CARD_COLORS = [
  { bg: '#e8eaf6', label: '#5c6bc0' },
  { bg: '#ede7f6', label: '#7e57c2' },
  { bg: '#fef9c3', label: '#ca8a04' },
]

// Blue-tinted text palette for pastel card backgrounds above.
// NOT generic grays — chosen for contrast on these specific backgrounds.
const CARD_TEXT = {
  title:    '#1a1a2e',  // blue-black for h3 titles
  subtitle: '#555577',  // blue-gray for descriptions
  meta:     '#888899',  // light blue-gray for metadata / timestamps
  cta:      '#1a1a2e',  // same deep blue for the arrow button bg
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  ear: Ear,
  mic: Mic,
  zap: Zap,
}

const STAGE_LABELS: Record<string, string> = {
  guided: 'Guided',
  pronunciation: 'Pronunciation',
  speed: 'Speed',
}

const STAGE_TIMES: Record<string, string> = {
  guided: '5 min',
  pronunciation: '5 min',
  speed: '3 min',
}

export function StageCard({ stage, mastery, index, unlocked, diffMode, onSelect }: Props) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const num = String(index + 1).padStart(2, '0')
  const Icon = STAGE_ICONS[stage.icon] ?? Mic

  return (
    <button
      disabled={!unlocked}
      onClick={() => unlocked && onSelect(diffMode)}
      className="group text-left rounded-3xl p-6 flex flex-col transition-all duration-200 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg"
      style={{
        backgroundColor: color.bg,
        opacity: unlocked ? 1 : 0.5,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        minHeight: '280px',
      }}
    >
      {/* Top row: number + icon */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-5xl font-bold leading-none" style={{ color: `${color.label}55` }}>
          {num}
        </span>
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color.label}18`, color: color.label }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      </div>

      {/* Category badge */}
      <span
        className="self-start text-tiny font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 border"
        style={{ color: color.label, borderColor: `${color.label}44`, background: `${color.label}12` }}
      >
        {STAGE_LABELS[stage.id] ?? stage.title}
      </span>

      {/* Title */}
      <h3 className="text-[22px] font-bold leading-tight mb-2" style={{ color: CARD_TEXT.title }}>
        {stage.title}
      </h3>

      {/* Description */}
      <p className="text-caption leading-relaxed flex-1" style={{ color: CARD_TEXT.subtitle }}>
        {stage.subtitle}
      </p>

      {/* Bottom row: time + arrow */}
      <div className="flex items-center justify-between mt-6">
        <span className="text-caption font-medium" style={{ color: CARD_TEXT.meta }}>
          {mastery.attempts > 0 ? `${mastery.pct}% mastery` : (STAGE_TIMES[stage.id] ?? '5 min')}
        </span>
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
          style={{ background: CARD_TEXT.cta, color: 'var(--on-primary)' }}
        >
          <ArrowIcon />
        </span>
      </div>

      {!unlocked && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LockIcon />
        </span>
      )}
    </button>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-30">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

