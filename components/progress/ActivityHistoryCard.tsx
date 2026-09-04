"use client"

import { useState } from 'react'
import { History, ChevronLeft, ChevronRight } from "@/components/icons"

import type { ActivitySessionSummary } from '@/lib/progress/activity-types'

import {
  ProgressCard,
  ProgressCardHeader,
  ProgressCategoryChart,
  type CategoryProgressItem,
} from './ProgressCard'

interface Props {
  sessions: ActivitySessionSummary[]
}

const PAGE_SIZE = 3

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3_600_000)
  if (diffHours < 1) return 'Ahora mismo'
  if (diffHours < 24) return `hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' })
}

export function ActivityHistoryCard({ sessions }: Props) {
  const [currentPage, setCurrentPage] = useState(1)

  if (sessions.length === 0) {
    return (
      <ProgressCard>
        <ProgressCardHeader icon={<History size={16} />} title="Práctica reciente" />
        <p className="py-3 text-center text-body-sm text-fg-muted">
          Completa una sesión para ver tu historial de actividad aquí.
        </p>
      </ProgressCard>
    )
  }

  // Calculate practice distribution by category
  const totalExercises = sessions.reduce((sum, s) => sum + s.exercisesTotal, 0)

  const groupedMap = new Map<
    string,
    { label: string; exercises: number; totalAccuracy: number; count: number }
  >()

  for (const s of sessions) {
    const existing = groupedMap.get(s.sourceLabel) || {
      label: s.sourceLabel,
      exercises: 0,
      totalAccuracy: 0,
      count: 0,
    }
    existing.exercises += s.exercisesTotal
    existing.totalAccuracy += s.accuracyPct
    existing.count += 1
    groupedMap.set(s.sourceLabel, existing)
  }

  const categories: CategoryProgressItem[] = Array.from(groupedMap.values()).map((g, idx) => ({
    id: `cat-${idx}`,
    label: g.label,
    percentage: totalExercises > 0 ? Math.round((g.exercises / totalExercises) * 100) : 0,
    accuracy: Math.round(g.totalAccuracy / g.count),
    exercises: g.exercises,
  }))

  const overallAccuracy = Math.round(
    sessions.reduce((acc, s) => acc + s.accuracyPct, 0) / sessions.length,
  )

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE)
  const displayedSessions = sessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<History size={16} />} title="Práctica reciente" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* Category distribution graph & percentage breakdown */}
        <ProgressCategoryChart items={categories} overallAccuracy={overallAccuracy} />

        {/* Compact Recent Sessions summary list with pagination */}
        <div className="flex flex-col gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-border-subtle">
          <div className="flex items-center justify-between">
            <span className="font-kicker font-medium text-fg-subtle text-caption">
              Últimas sesiones ({sessions.length})
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {displayedSessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-semibold text-fg">{session.sourceLabel}</p>
                  <p className="text-caption text-fg-muted">
                    {session.exercisesTotal} ejercicios · {session.accuracyPct}% precisión
                  </p>
                </div>
                <span className="shrink-0 text-caption text-fg-subtle">{formatWhen(session.completedAt)}</span>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-1 flex items-center justify-between pt-1 border-t border-border-subtle">
              <span className="text-caption text-fg-muted">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken p-1.5 text-fg hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken p-1.5 text-fg hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProgressCard>
  )
}


