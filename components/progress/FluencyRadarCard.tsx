// Planned structure:
// <FluencyRadarCard>
//   <RadarHeader />
//   <RadarChart />        (SVG)
//   <RadarLegend />
//   <EmptyState />        (alt branch)

import { Radar } from 'lucide-react'

export type SkillKey =
  | 'pronunciation'
  | 'grammar'
  | 'vocabulary'
  | 'listening'
  | 'speaking'
  | 'reading'

export type FluencyScores = Record<SkillKey, number>

interface Props {
  scores?: FluencyScores | null
  comparisonLabel?: string
}

const SKILL_ORDER: { key: SkillKey; label: string }[] = [
  { key: 'pronunciation', label: 'Pronunciation' },
  { key: 'grammar',       label: 'Grammar' },
  { key: 'vocabulary',    label: 'Vocabulary' },
  { key: 'listening',     label: 'Listening' },
  { key: 'speaking',      label: 'Speaking' },
  { key: 'reading',       label: 'Reading' },
]

const SIZE = 320
const CENTER = SIZE / 2
const RADIUS = 120
const RINGS = [0.25, 0.5, 0.75, 1]

function polarPoint(index: number, total: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: CENTER + Math.cos(angle) * RADIUS * ratio,
    y: CENTER + Math.sin(angle) * RADIUS * ratio,
  }
}

function RadarHeader({ comparisonLabel }: { comparisonLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in oklch, var(--primary) 13%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <Radar size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-tiny font-bold uppercase tracking-[0.22em] text-fg-subtle">
            Skills · 6 dimensions
          </span>
          <span className="text-sm font-semibold text-fg">Your fluency profile</span>
        </div>
      </div>
      {comparisonLabel && (
        <span
          className="rounded-full border px-3 py-1 text-tiny font-semibold text-fg-muted"
          style={{ borderColor: 'var(--line-divider)', background: 'var(--btn-regular-bg)' }}
        >
          {comparisonLabel}
        </span>
      )}
    </div>
  )
}

function RadarChart({ scores }: { scores: FluencyScores }) {
  const total = SKILL_ORDER.length
  const points = SKILL_ORDER.map((s, i) => polarPoint(i, total, scores[s.key] / 100))
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px]">
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.10" />
        </radialGradient>
      </defs>

      {/* Concentric rings */}
      {RINGS.map((ratio, i) => {
        const ring = SKILL_ORDER.map((_, j) => {
          const p = polarPoint(j, total, ratio)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon
            key={i}
            points={ring}
            fill="none"
            stroke="var(--line-divider)"
            strokeWidth={1}
            strokeDasharray={ratio === 1 ? '0' : '3 4'}
          />
        )
      })}

      {/* Axes */}
      {SKILL_ORDER.map((_, i) => {
        const p = polarPoint(i, total, 1)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="var(--line-divider)"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="url(#radar-fill)"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points + value labels */}
      {SKILL_ORDER.map((s, i) => {
        const p = points[i]
        const labelPos = polarPoint(i, total, 1.18)
        return (
          <g key={s.key}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="var(--card-bg)"
              stroke="var(--primary)"
              strokeWidth={2}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fg text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function RadarLegend({ scores }: { scores: FluencyScores }) {
  return (
    <div className="flex flex-col gap-2">
      {SKILL_ORDER.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: 'var(--primary)' }}
            />
            <span className="text-xs text-fg-muted">{s.label}</span>
          </div>
          <span className="text-xs font-bold text-fg tabular-nums">{scores[s.key]}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyRadar() {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px] opacity-60">
      {RINGS.map((ratio, i) => {
        const ring = SKILL_ORDER.map((_, j) => {
          const p = polarPoint(j, SKILL_ORDER.length, ratio)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon
            key={i}
            points={ring}
            fill="none"
            stroke="var(--line-divider)"
            strokeWidth={1}
            strokeDasharray={ratio === 1 ? '0' : '3 4'}
          />
        )
      })}
      {SKILL_ORDER.map((s, i) => {
        const labelPos = polarPoint(i, SKILL_ORDER.length, 1.18)
        return (
          <text
            key={s.key}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-fg-muted text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            {s.label}
          </text>
        )
      })}
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <EmptyRadar />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold text-fg">No fluency data yet</p>
        <p className="max-w-[280px] text-xs text-fg-muted">
          Complete a few exercises across pronunciation, grammar, vocabulary,
          listening, speaking, and reading to unlock your fluency profile.
        </p>
      </div>
    </div>
  )
}

export function FluencyRadarCard({ scores, comparisonLabel }: Props) {
  const isEmpty =
    !scores ||
    SKILL_ORDER.every((s) => !scores[s.key] || scores[s.key] <= 0)

  return (
    <div
      className="flex flex-col gap-6 rounded-3xl p-6"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
      }}
    >
      <RadarHeader comparisonLabel={isEmpty ? undefined : comparisonLabel} />

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="flex justify-center">
            <RadarChart scores={scores!} />
          </div>
          <RadarLegend scores={scores!} />
        </div>
      )}
    </div>
  )
}
