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
  { key: 'pronunciation', label: 'Pronunciación', source: 'Sound Lab · evidencia del evaluador', href: '/practice' },
  { key: 'grammar', label: 'Gramática', source: 'Respuestas evaluadas', href: '/practice/decks' },
  { key: 'vocabulary', label: 'Vocabulario', source: 'Repaso y retención verificada', href: '/words' },
  { key: 'listening', label: 'Escucha', source: 'Percepción y dictado', href: '/daily' },
  { key: 'speaking', label: 'Habla', source: 'Producción evaluada', href: '/daily' },
  { key: 'reading', label: 'Lectura', source: 'Comprensión evaluada', href: '/courses' },
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
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[380px]">
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
              fill="var(--text-tertiary)"
              fontSize={10.5}
              fontWeight={600}
              letterSpacing="0.08em"
              className="uppercase"
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
    <div className="flex flex-col gap-2">
      {SKILL_ORDER.map((s) => {
        const val = scores[s.key]
        const isBest = val === max && max > 0
        const isWorst = val === min && min < max
        return (
          <Link
            key={s.key}
            href={s.href}
            className={cn(
              'flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5 transition-colors hover:bg-surface-raised focus-ring',
              isBest && 'border-[color-mix(in_oklch,var(--success)_40%,transparent)]',
              isWorst && 'border-[color-mix(in_oklch,var(--warning)_40%,transparent)]',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-body-sm font-semibold text-fg flex items-center gap-1.5">
                <span>{s.label}</span>
                <span className="text-caption font-normal text-fg-subtle opacity-70">→</span>
              </div>
              <div className="text-tiny text-fg-subtle">{s.source}</div>
            </div>
            <div
              className={cn('text-body-lg font-semibold text-primary', isBest && 'text-success', isWorst && 'text-warning')}
            >
              {val}
            </div>
          </Link>
        )
      })}

      <div className="mt-1 flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 rounded-[var(--radius-md)] bg-success-soft px-3 py-2.5 text-caption text-success">
          <b className="mb-0.5 block text-body-sm text-success-value">
            {best.label} {max}
          </b>
          Tu área más fuerte en este momento.
        </div>
        <div className="flex-1 rounded-[var(--radius-md)] bg-warning-soft px-3 py-2.5 text-caption text-warning">
          <b className="mb-0.5 block text-body-sm text-warning-value">
            {worst.label} {min}
          </b>
          Recomendado para una práctica enfocada.
        </div>
      </div>
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
            fill="var(--text-tertiary)"
            fontSize={10.5}
            fontWeight={600}
            letterSpacing="0.08em"
            className="uppercase"
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
          <div className="flex max-w-[280px] flex-col gap-1">
            <p className="text-body-sm font-semibold text-fg">Sin datos de fluidez aún</p>
            <p className="text-caption text-fg-muted">
              Completa ejercicios en pronunciación, gramática, vocabulario, escucha,
              habla y lectura para desbloquear tu perfil.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col @[660px]:flex-row @[660px]:items-center gap-6">
          <div className="flex shrink-0 justify-center mx-auto @[660px]:mx-0 w-full max-w-[320px]">
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
