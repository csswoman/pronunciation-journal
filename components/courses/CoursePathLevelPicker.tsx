"use client";

/*
 * Planned subcomponents:
 * - CoursePathLevelPicker (client shell for level selection with progress)
 *   - LevelSpineNav (horizontal card grid for desktop/tablet)
 *     - LevelCardTab (individual tab with label, progress bar and count)
 *   - LevelMobileAccordion (collapsible dropdown for small screens)
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import type { CefrLevelId, CoursePathLevel } from "@/lib/courses/types";

const DEFAULT_LEVEL: CefrLevelId = "a1";

interface CoursePathLevelPickerProps {
  levels: CoursePathLevel[];
  selectedLevelId: CefrLevelId;
  mobileSearch?: ReactNode;
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function completionKey(userId: string, courseSlug: string, lessonSlug: string): string {
  return `${userId}:${courseSlug}:${lessonSlug}`;
}

interface LevelCardTabProps {
  level: CoursePathLevel;
  isActive: boolean;
  completedCount: number;
  totalCount: number;
}

function LevelCardTab({
  level,
  isActive,
  completedCount,
  totalCount,
}: LevelCardTabProps) {
  const href = level.id === DEFAULT_LEVEL ? "/courses" : `/courses?level=${level.id}`;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={`Nivel ${level.spineLabel}: ${completedCount} de ${totalCount} lecciones completadas`}
      className={cn(
        "course-path__level",
        isActive && "course-path__level--on"
      )}
    >
      <div className="course-path__level-lv">{level.spineLabel}</div>
      <div className="course-path__level-count" aria-hidden="true">
        {completedCount}/{totalCount}
      </div>
    </Link>
  );
}

function AssessmentActions({ selectedLevelId }: { selectedLevelId: CefrLevelId }) {
  return (
    <>
      <Link
        href="/assessment"
        className="course-path__text-link"
        title="Evaluación diagnóstica inicial para ubicar tu nivel"
      >
        Test de ubicación
      </Link>
      <Link
        href={`/assessment?mode=checkpoint&level=${selectedLevelId}`}
        className="course-path__text-link"
        title="Evaluación de salida del nivel seleccionado"
      >
        Checkpoint del nivel
      </Link>
    </>
  );
}

export default function CoursePathLevelPicker({
  levels,
  selectedLevelId,
  mobileSearch,
}: CoursePathLevelPickerProps) {
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const userId = await getOptionalUserId();
      if (!userId) {
        if (!cancelled) setCompletedCounts({});
        return;
      }

      const allKeys = levels.flatMap((level) =>
        level.units.flatMap((unit) =>
          unit.lessons.map((lesson) => completionKey(userId, level.id, lesson.id))
        )
      );

      const rows = await db.completedLessons.bulkGet(allKeys);
      if (cancelled) return;

      const completedSet = new Set(
        rows
          .filter((row): row is NonNullable<typeof row> => Boolean(row))
          .map((row) => `${row.courseSlug}:${row.lessonSlug}`)
      );

      const nextCounts: Record<string, number> = {};
      for (const level of levels) {
        let count = 0;
        for (const unit of level.units) {
          for (const lesson of unit.lessons) {
            if (completedSet.has(`${level.id}:${lesson.id}`)) {
              count++;
            }
          }
        }
        nextCounts[level.id] = count;
      }

      setCompletedCounts(nextCounts);
    }

    loadProgress().catch(() => {
      if (!cancelled) setCompletedCounts({});
    });

    return () => {
      cancelled = true;
    };
  }, [levels]);

  const selectedLevel = levels.find((l) => l.id === selectedLevelId) ?? levels[0];

  return (
    <section className="course-path__level-picker" aria-labelledby="course-level-picker-title">
      <div className="course-path__level-picker-head">
        <h2 id="course-level-picker-title" className="course-path__level-picker-title">
          Nivel
        </h2>
        <div className="course-path__level-picker-actions">
          <AssessmentActions selectedLevelId={selectedLevelId} />
        </div>
      </div>

      {/* Desktop / Tablet Spine Navigation */}
      <nav className="course-path__spine course-path__spine--desktop" aria-label="Niveles del curso">
        {levels.map((level) => {
          const totalCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
          const completedCount = completedCounts[level.id] ?? 0;
          const isActive = level.id === selectedLevelId;

          return (
            <LevelCardTab
              key={level.id}
              level={level}
              isActive={isActive}
              completedCount={completedCount}
              totalCount={totalCount}
            />
          );
        })}
      </nav>

      {/* Mobile Toolbar (Search + Level Selector side-by-side) */}
      <div className="course-path__mobile-toolbar lg:hidden">
        {mobileSearch && (
          <div className="course-path__mobile-search-wrap">
            {mobileSearch}
          </div>
        )}
        <details className="course-path__level-picker-mobile">
          <summary className="course-path__level-picker-mobile-summary">
            <span className="course-path__level-picker-mobile-label">Nivel actual</span>
            <strong className="course-path__level-picker-mobile-current">
              {selectedLevel.spineLabel}
            </strong>
            <ChevronDown size={14} aria-hidden />
          </summary>
          <div className="course-path__level-picker-mobile-content">
            <nav className="course-path__spine course-path__spine--mobile" aria-label="Cambiar nivel">
              {levels.map((level) => {
                const totalCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
                const completedCount = completedCounts[level.id] ?? 0;
                const isActive = level.id === selectedLevelId;

                return (
                  <LevelCardTab
                    key={level.id}
                    level={level}
                    isActive={isActive}
                    completedCount={completedCount}
                    totalCount={totalCount}
                  />
                );
              })}
            </nav>
            <div className="course-path__level-picker-mobile-actions">
              <AssessmentActions selectedLevelId={selectedLevelId} />
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
