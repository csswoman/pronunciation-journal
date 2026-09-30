// Planned structure:
// <FluencyDimensionList>
//   <DimensionLink /> × 7   (score or "—" when evidence is insufficient)
//   <DimensionHighlights /> | insufficient-evidence note
// </FluencyDimensionList>

import Link from "next/link"

import { cn } from '@/lib/cn'
import type { FluencyScores, SkillKey } from '@/lib/progress/fluency-scores'

export const SKILL_ORDER: { key: SkillKey; label: string; source: string; href: string }[] = [
  { key: 'pronunciation', label: 'Pronunciación', source: 'Sound Lab: fonemas evaluados', href: '/practice' },
  { key: 'grammar', label: 'Gramática', source: 'Decks: patrones estructurales', href: '/practice/decks' },
  { key: 'vocabulary', label: 'Vocabulario', source: 'Diccionario: retención activa', href: '/words' },
  { key: 'listening', label: 'Escucha', source: 'Práctica diaria: percepción y dictado', href: '/daily' },
  { key: 'speaking', label: 'Habla', source: 'Práctica diaria: producción oral', href: '/daily' },
  { key: 'reading', label: 'Lectura', source: 'Cursos: comprensión de textos', href: '/courses' },
  { key: 'writing', label: 'Escritura', source: 'Práctica diaria: producción escrita', href: '/daily' },
]

export function FluencyDimensionList({ scores }: { scores: FluencyScores }) {
  const entries = SKILL_ORDER.map((s) => ({ ...s, val: scores[s.key].score ?? 0, skill: scores[s.key] }))
  const scored = entries.filter((e) => e.skill.score != null && !e.skill.insufficientEvidence)
  const max = scored.length ? Math.max(...scored.map((e) => e.val)) : 0
  const min = scored.length ? Math.min(...scored.map((e) => e.val)) : 0
  const hasComparableScores = scored.length >= 2 && max > min
  const best = hasComparableScores ? scored.find((e) => e.val === max) : undefined
  const worst = hasComparableScores ? scored.find((e) => e.val === min) : undefined

  return (
    <div className="flex flex-col gap-2.5">
      {/* 2-column compact grid for the 7 skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map((e) => {
          const isBest = hasComparableScores && !e.skill.insufficientEvidence && e.val === max
          const isWorst = hasComparableScores && !e.skill.insufficientEvidence && e.val === min
          return (
            <Link
              key={e.key}
              href={e.href}
              className={cn(
                'group flex min-h-[44px] items-center justify-between gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2 transition-colors hover:bg-surface-raised focus-ring',
                isBest && 'border-[color-mix(in_oklch,var(--success)_40%,transparent)]',
                isWorst && 'border-[color-mix(in_oklch,var(--warning)_40%,transparent)]',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-body-sm font-semibold text-fg">
                  <span className="truncate">{e.label}</span>
                  <span className="text-caption font-normal text-fg-subtle opacity-60 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
                <div className="truncate text-tiny text-fg-subtle">{e.source}</div>
              </div>
              <div
                className={cn(
                  'shrink-0 text-body-md font-bold tabular-nums',
                  e.skill.insufficientEvidence ? 'text-fg-muted' : 'text-primary',
                  isBest && 'text-success',
                  isWorst && 'text-warning',
                )}
              >
                {e.skill.insufficientEvidence ? '—' : e.val}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Highlights: Best & Area to reinforce */}
      {best && worst ? (
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
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5 text-center text-caption text-fg-muted">
          Necesitas más práctica variada para ver tus fortalezas y áreas de mejora.
        </div>
      )}
    </div>
  )
}
