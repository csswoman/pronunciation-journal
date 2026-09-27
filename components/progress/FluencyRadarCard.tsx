import Link from "next/link"
import { Radar } from "@/components/icons"

import type { FluencyScores, SkillKey, SkillScore } from '@/lib/progress/fluency-scores'
import { SKILL_KEYS } from '@/lib/progress/fluency-scores'

import { FluencyDimensionList, SKILL_ORDER } from './FluencyDimensionList'
import { ProgressCard, ProgressCardHeader } from './ProgressCard'

export type { FluencyScores, SkillKey, SkillScore }

interface Props {
  scores?: FluencyScores | null
  comparisonLabel?: string
}

const SIZE = 380
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

/** Extract the numeric value for the radar polygon. null → 0 for display. */
function scoreValue(s: SkillScore): number {
  return s.score ?? 0
}

function RadarChart({ scores }: { scores: FluencyScores }) {
  const total = SKILL_ORDER.length
  const points = SKILL_ORDER.map((s, i) => polarPoint(i, total, scoreValue(scores[s.key]) / 100))
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[380px]"
      role="img"
      aria-label={`Gráfico de radar del balance de habilidades en ${total} dimensiones`}
    >
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
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        )
      })}

      {SKILL_ORDER.map((_, i) => {
        const p = polarPoint(i, total, 1)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        )
      })}

      <polygon
        points={polygon}
        fill="color-mix(in oklch, var(--primary) 22%, transparent)"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {SKILL_ORDER.map((s, i) => {
        const p = points[i]
        const labelPos = polarPoint(i, total, 1.18)
        return (
          <g key={s.key}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="var(--primary)" />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              fontSize={10.5}
              fontWeight={600}
              letterSpacing="0.08em"
              className="uppercase fill-fg-subtle text-fg-subtle"
            >
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function EmptyRadar() {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[320px] opacity-60"
      role="img"
      aria-label="Gráfico de radar vacío (sin actividad registrada)"
    >
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
            stroke="var(--border-subtle)"
            strokeWidth={1}
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
            fill="currentColor"
            fontSize={10.5}
            fontWeight={600}
            letterSpacing="0.08em"
            className="uppercase fill-fg-subtle text-fg-subtle"
          >
            {s.label}
          </text>
        )
      })}
    </svg>
  )
}

export function FluencyRadarCard({ scores, comparisonLabel }: Props) {
  const isEmpty =
    !scores || SKILL_KEYS.every((s) => {
      const sk = scores[s]
      return !sk || (sk.score == null && sk.evidenceCount <= 0)
    })

  return (
    <ProgressCard className="gap-5">
      <div className="flex items-start justify-between gap-3">
        <ProgressCardHeader
          icon={<Radar size={16} />}
          eyebrow={`${SKILL_ORDER.length} dimensiones`}
          title="Balance de skills"
        />
        {!isEmpty && comparisonLabel ? (
          <span className="rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 text-tiny font-semibold text-fg-muted">
            {comparisonLabel}
          </span>
        ) : null}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <EmptyRadar />
          <div className="flex max-w-[340px] flex-col gap-2">
            <p className="text-body-sm font-semibold text-fg">Perfil de habilidades en construcción</p>
            <p className="text-caption text-fg-muted">
              Se calibra automáticamente a medida que practicas pronunciación, gramática, vocabulario y habla.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Link
                href="/daily"
                className="inline-flex min-h-[36px] items-center rounded-sm bg-primary-soft px-3 py-1.5 text-caption font-semibold text-primary transition-opacity hover:opacity-80 focus-ring"
              >
                Plan diario →
              </Link>
              <Link
                href="/practice"
                className="inline-flex min-h-[36px] items-center rounded-sm border border-border-subtle bg-surface-sunken px-3 py-1.5 text-caption font-semibold text-fg hover:bg-surface-raised transition-colors focus-ring"
              >
                Sound Lab →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col @[520px]:flex-row @[520px]:items-center gap-5">
          <div className="flex shrink-0 justify-center mx-auto @[520px]:mx-0 w-full max-w-[260px] sm:max-w-[280px]">
            <RadarChart scores={scores!} />
          </div>
          <div className="flex-1 min-w-0">
            <FluencyDimensionList scores={scores!} />
          </div>
        </div>
      )}
    </ProgressCard>
  )
}
