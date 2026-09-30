"use client";

// Planned structure:
// <ActivityHistoryCard>
//   <CardHeader>
//     <KickerAndOverallAccuracy overallAccuracy={overallAccuracy} />
//     <TitleText title="Últimas 15 sesiones" />
//   </CardHeader>
//   <DistributionBar categories={categories} />
//   <SessionsList sessions={displayedSessions} />
//   <PaginationControls page={currentPage} totalPages={totalPages} />
// </ActivityHistoryCard>

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { ActivitySessionSummary } from "@/lib/progress/activity-types";
import { cn } from "@/lib/cn";

interface Props {
  sessions: ActivitySessionSummary[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 4;

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "Ahora mismo";
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "hace 1 d";
  if (diffDays < 7) return `hace ${diffDays} d`;
  return date.toLocaleDateString("es", { month: "short", day: "numeric" });
}

function getBadgeVariant(pct: number): string {
  if (pct >= 85) return "bg-success/20 text-success border-success/30";
  if (pct >= 50) return "bg-warning/20 text-warning border-warning/30";
  return "bg-error/20 text-error border-error/30";
}

export function ActivityHistoryCard({ sessions, pageSize = DEFAULT_PAGE_SIZE }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6">
        <div>
          <span className="font-kicker font-bold text-xs uppercase tracking-wider text-fg-subtle">
            PRÁCTICA RECIENTE
          </span>
          <h3 className="font-display text-xl font-bold text-fg leading-tight mt-1">
            Últimas 15 sesiones
          </h3>
          <p className="py-6 text-center text-xs text-fg-muted">
            Completa una sesión para ver tu historial de actividad aquí.
          </p>
        </div>
      </div>
    );
  }

  // Calculate practice distribution by category
  const totalExercises = sessions.reduce((sum, s) => sum + s.exercisesTotal, 0);
  const groupedMap = new Map<string, { label: string; exercises: number; totalAccuracy: number; count: number }>();

  for (const s of sessions) {
    const existing = groupedMap.get(s.sourceLabel) || {
      label: s.sourceLabel,
      exercises: 0,
      totalAccuracy: 0,
      count: 0,
    };
    existing.exercises += s.exercisesTotal;
    if (s.exercisesTotal > 0) {
      existing.totalAccuracy += s.accuracyPct;
      existing.count += 1;
    }
    groupedMap.set(s.sourceLabel, existing);
  }

  const categories = Array.from(groupedMap.values()).map((g, idx) => ({
    id: `cat-${idx}`,
    label: g.label,
    percentage: totalExercises > 0 ? Math.round((g.exercises / totalExercises) * 100) : 0,
    accuracy: g.count > 0 ? Math.round(g.totalAccuracy / g.count) : undefined,
    exercises: g.exercises,
  }));

  const accuracySessions = sessions.filter((s) => s.exercisesTotal > 0);
  const overallAccuracy =
    accuracySessions.length > 0
      ? Math.round(accuracySessions.reduce((acc, s) => acc + s.accuracyPct, 0) / accuracySessions.length)
      : undefined;

  const effectivePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(sessions.length / effectivePageSize);
  const displayedSessions = sessions.slice(
    (currentPage - 1) * effectivePageSize,
    currentPage * effectivePageSize,
  );

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6 sm:p-7">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-fg-subtle">
            PRÁCTICA RECIENTE
          </span>

          {overallAccuracy !== undefined && (
            <div className="text-right">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-fg leading-none">
                {overallAccuracy}%
              </span>
              <span className="block text-xs sm:text-sm font-semibold text-fg-muted mt-0.5">
                precisión promedio
              </span>
            </div>
          )}
        </div>

        <h3 className="font-display text-2xl font-extrabold text-fg leading-tight mt-1.5">
          Últimas {Math.min(15, sessions.length)} sesiones
        </h3>

        {/* Categories Distribution Bar */}
        {categories.length > 0 && totalExercises > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  style={{ width: `${cat.percentage}%` }}
                  className={cn(
                    "h-full transition-all duration-300",
                    idx === 0 ? "bg-primary" : idx === 1 ? "bg-lilac" : "bg-mint",
                  )}
                  title={`${cat.label}: ${cat.percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-fg-muted font-semibold">
              {categories.map((cat) => (
                <span key={cat.id} className="flex items-center gap-1.5">
                  <span>{cat.label}</span>
                  <strong className="text-fg font-extrabold">{cat.percentage}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sessions list */}
        <ul className="mt-5 flex flex-col gap-3 animate-state-in" key={currentPage}>
          {displayedSessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3.5 rounded-2xl border border-border-subtle/50 bg-surface-sunken px-4 sm:px-5 py-3.5"
            >
              <div className="min-w-0">
                <span className="text-base font-bold text-fg">
                  {session.sourceLabel}
                </span>
                <p className="text-sm font-medium text-fg-muted mt-0.5">
                  {session.exercisesTotal > 0
                    ? `${session.exercisesTotal} ejercicios · ${session.accuracyPct}% precisión`
                    : "Sin ejercicios · actividad registrada"}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {session.exercisesTotal > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-sm font-extrabold tabular-nums",
                      getBadgeVariant(session.accuracyPct),
                    )}
                  >
                    {session.accuracyPct} %
                  </span>
                )}
                <span className="text-sm font-semibold text-fg-muted">
                  {formatWhen(session.completedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-border-subtle/50 pt-4">
          <span className="text-sm font-semibold text-fg-muted">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
              aria-label="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
