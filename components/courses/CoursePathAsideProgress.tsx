"use client";

/*
 * Planned subcomponents:
 * - CoursePathAsideProgress (sidebar dashboard matching target layout design)
 *   - LevelOverallProgress (Percentage ring + completed count + remaining hours)
 *   - CheckpointMilestone (Next hito progress bar towards Checkpoint)
 *   - ReviewTopicsList (Para repasar section with retention bars + CTA button)
 *   - WeeklyStreakTracker (Esta semana 7-day streak dots)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, MicVocal } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import type { CoursePathLevel, CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathAsideProgressProps {
  level: CoursePathLevel;
  selectedLevelId: CoursePathTrackId;
  completedCount: number;
  totalCount: number;
  showCheckpoint?: boolean;
}

const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];

function getStartOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CoursePathAsideProgress({
  level,
  selectedLevelId,
  completedCount,
  totalCount,
  showCheckpoint = true,
}: CoursePathAsideProgressProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingLessons = Math.max(0, totalCount - completedCount);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then((user) => {
        if (!cancelled) setUserId(user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Only account-scoped rows are evidence for this learner.
  const favoritesCount = useLiveQuery(async () => {
    try {
      if (!userId) return null;
      const rows = await db.favorites.toArray();
      return rows.filter((row) => row.userId === userId).length;
    } catch {
      return null;
    }
  }, [userId], null);

  // Daily activity is scoped to the signed-in learner; unknown storage is not
  // rendered as activity.
  const activeDaysMap = useLiveQuery(async () => {
    try {
      if (!userId) return null;
      const monday = getStartOfWeek();
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        dates.push(formatDateISO(dayDate));
      }
      const datesSet = new Set(dates);
      const allRows = await db.dailyProgress.toArray();
      const activeSet = new Set(
        allRows
          .filter((row) =>
            row.userId === userId &&
            datesSet.has(row.date) &&
            ((row.totalAttempts ?? 0) > 0 || (row.xp ?? 0) > 0)
          )
          .map((row) => row.date)
      );
      return dates.map((d) => activeSet.has(d));
    } catch {
      return null;
    }
  }, [userId], null);

  const activeDaysCount = activeDaysMap?.filter(Boolean).length ?? 0;

  // SVG circular arc progress
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <aside className="flex flex-col gap-6 w-full font-sans" aria-label="Resumen y progreso de aprendizaje">
      {/* 1. Pronunciación Quick Access */}
      <Link href="/courses/pronunciation" className="block no-underline group">
        <PastelCard tone="coral" className="p-6 sm:p-7 rounded-[2rem] flex items-center justify-between gap-4 transition-transform group-hover:translate-x-0.5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
              <MicVocal size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-fg leading-snug font-display">Pronunciación</h3>
              <p className="text-body-sm text-fg/80 font-sans">
                {favoritesCount === null
                  ? "Sin datos de palabras guardadas."
                  : `${favoritesCount} ${favoritesCount === 1 ? "palabra guardada" : "palabras guardadas"} para practicar`}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-fg/60 group-hover:text-fg transition-colors shrink-0" aria-hidden />
        </PastelCard>
      </Link>

      {/* 2. Tu progreso en A1 */}
      <PastelCard tone="lilac" className="p-6 sm:p-7 rounded-[2rem] flex flex-col gap-5 shadow-xs">
        <h3 className="text-lg font-bold text-fg font-display">Tu progreso en {level.spineLabel}</h3>
        <div className="flex items-center gap-6">
          {/* Circular Progress Ring */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-black/15 dark:text-white/20"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-fg transition-all duration-500"
              />
            </svg>
            {/* Top start dot indicator */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-neutral-900 dark:bg-white border-2 border-purple-200 dark:border-purple-900" aria-hidden="true" />
            <span className="absolute text-xl font-bold text-fg font-display">{percent}%</span>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-fg font-display tracking-tight">
                {completedCount}
              </span>
              <span className="text-lg sm:text-xl font-bold text-fg font-display">
                de {totalCount}
              </span>
            </div>
            <span className="text-body-sm text-fg/80 font-sans mt-1">lecciones completadas</span>
          </div>
        </div>
      </PastelCard>

      {showCheckpoint && (
        <PastelCard tone="butter" className="p-6 sm:p-7 rounded-[2rem] flex flex-col gap-4 shadow-xs">
        <div>
          <span className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold tracking-wider uppercase px-3.5 py-1 rounded-full inline-block font-display">
            Siguiente hito
          </span>
        </div>

        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg leading-tight font-display text-balance">
          Checkpoint · {level.title}
        </h4>

        {/* Milestone Progress Bar */}
        <div className="h-3.5 w-full rounded-full bg-black/10 dark:bg-white/15 overflow-hidden p-0.5 border border-black/10">
          <div
            className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-body-sm text-fg/80 font-sans">
          {remainingLessons === 0
            ? "¡Nivel completado! Listo para evaluación."
            : `Te faltan ${remainingLessons} lecciones para el checkpoint.`}
        </p>

        <div>
          <Link
            href={`/assessment?mode=checkpoint&level=${selectedLevelId}`}
            className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-full px-6 py-3 text-sm font-bold inline-flex items-center gap-2.5 transition-colors no-underline shadow-xs font-display"
          >
            <span>Ir al Checkpoint</span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        </PastelCard>
      )}

      {/* 4. Esta semana */}
      <PastelCard tone="mint" className="p-6 sm:p-7 rounded-[2rem] flex flex-col gap-4 font-sans shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-fg font-display">Esta semana</h3>
          <span className="text-lg font-bold text-fg font-display">{activeDaysMap === null ? "Sin datos" : `${activeDaysCount} ${activeDaysCount === 1 ? "día" : "días"}`}</span>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isActive = activeDaysMap?.[idx] ?? false;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border-2 border-dashed border-current/30 text-fg/40"
                  }`}
                >
                  {isActive && <Check size={14} strokeWidth={2.5} aria-hidden />}
                </div>
                <span className="text-caption font-bold text-fg/70 font-display">{day}</span>
              </div>
            );
          })}
        </div>
      </PastelCard>
    </aside>
  );
}
