import Link from "next/link"
import { Radar } from "@/components/icons"

import { cn } from '@/lib/cn'
import type { FluencyScores, SkillKey } from '@/lib/progress/fluency-scores'
import { SKILL_KEYS } from '@/lib/progress/fluency-scores'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

export type { FluencyScores, SkillKey }

interface Props {
  scores?: FluencyScores | null
  comparisonLabel?: string
}

const SKILL_ORDER: { key: SkillKey; label: string; source: string; href: string }[] = [
  { key: 'pronunciation', label: 'Pronunciación', source: 'Sound Lab: fonemas evaluados', href: '/practice' },
  { key: 'grammar', label: 'Gramática', source: 'Decks: patrones estructurales', href: '/practice/decks' },
  { key: 'vocabulary', label: 'Vocabulario', source: 'Diccionario: retención activa', href: '/words' },
  { key: 'listening', label: 'Escucha', source: 'Práctica diaria: percepción y dictado', href: '/daily' },
  { key: 'speaking', label: 'Habla', source: 'Práctica diaria: producción oral', href: '/daily' },
  { key: 'reading', label: 'Lectura', source: 'Cursos: comprensión de textos', href: '/courses' },
]

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

function RadarChart({ scores }: { scores: FluencyScores }) {
  const total = SKILL_ORDER.length
  const points = SKILL_ORDER.map((s, i) => polarPoint(i, total, scores[s.key] / 100))
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[380px]"
      role="img"
      aria-label="Gráfico de radar del balance de habilidades en 6 dimensiones"
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

function DimensionList({ scores }: { scores: FluencyScores }) {
  const values = SKILL_ORDER.map((s) => scores[s.key])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const best = SKILL_ORDER.find((s) => scores[s.key] === max)!
  const worst = SKILL_ORDER.find((s) => scores[s.key] === min)!

  return (
    <div className="flex flex-col gap-2.5">
      {/* 2-column compact grid for the 6 skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SKILL_ORDER.map((s) => {
          const val = scores[s.key]
          const isBest = val === max && max > 0
          const isWorst = val === min && min < max
          return (
            <Link
              key={s.key}
              href={s.href}
              className={cn(
                'group flex min-h-[44px] items-center justify-between gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2 transition-colors hover:bg-surface-raised focus-ring',
                isBest && 'border-[color-mix(in_oklch,var(--success)_40%,transparent)]',
                isWorst && 'border-[color-mix(in_oklch,var(--warning)_40%,transparent)]',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-body-sm font-semibold text-fg">
                  <span className="truncate">{s.label}</span>
                  <span className="text-caption font-normal text-fg-subtle opacity-60 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
                <div className="truncate text-tiny text-fg-subtle">{s.source}</div>
              </div>
              <div
                className={cn(
                  'shrink-0 text-body-md font-bold tabular-nums text-primary',
                  isBest && 'text-success',
                  isWorst && 'text-warning',
                )}
              >
                {val}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Highlights: Best & Area to reinforce */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--success)_25%,transparent)] bg-success-soft/70 px-3 py-2 text-caption text-success">
          <div className="flex items-center justify-between gap-1">
            <span className="text-body-sm font-bold text-success-value">{best.label}</span>
            <span className="font-semibold text-success-value">{max}/100</span>
          </div>
          <p className="mt-0.5 text-tiny opacity-90">Tu dimensión más consolidada.</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--warning)_25%,transparent)] bg-warning-soft/70 px-3 py-2 text-caption text-warning">
          <div className="flex items-center justify-between gap-1">
            <span className="text-body-sm font-bold text-warning-value">{worst.label}</span>
            <span className="font-semibold text-warning-value">{min}/100</span>
          </div>
          <p className="mt-0.5 text-tiny opacity-90">Prioridad recomendada para tu práctica.</p>
        </div>
      </div>
    </div>
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
    !scores || SKILL_KEYS.every((s) => !scores[s] || scores[s] <= 0)

  return (
    <ProgressCard className="gap-5">
      <div className="flex items-start justify-between gap-3">
        <ProgressCardHeader
          icon={<Radar size={16} />}
          eyebrow="6 dimensiones"
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
            <DimensionList scores={scores!} />
          </div>
        </div>
      )}
    </ProgressCard>
  )
}
