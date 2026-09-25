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
import { useLearnerLevelId } from "@/hooks/useLearnerLevelId";
import type { CefrLevelId, CoursePathLevel } from "@/lib/courses/types";

const DEFAULT_LEVEL: CefrLevelId = "a1";

const OPTIONAL_TAB_LEVEL: CoursePathLevel = {
  id: "opcionales",
  spineLabel: "Opcionales",
  spineSubtitle: "Rutas y temas",
  title: "Temas opcionales",
  description: "Rutas especializadas y temas opcionales.",
  units: [],
};

interface CoursePathLevelPickerProps {
  levels: CoursePathLevel[];
  selectedLevelId: string;
  mobileSearch?: ReactNode;
  electiveTracks?: CoursePathLevel[];
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
  const href =
    level.id === DEFAULT_LEVEL
      ? "/courses"
      : level.id === "opcionales"
      ? "/courses?level=opcionales"
      : `/courses?level=${level.id}`;

  const ariaLabel =
    level.id === "opcionales"
      ? `Temas opcionales: ${completedCount} de ${totalCount} lecciones completadas`
      : `Nivel ${level.spineLabel}: ${completedCount} de ${totalCount} lecciones completadas`;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
      className={cn("course-path__level", isActive && "course-path__level--on")}
    >
      <span className="course-path__level-lv">{level.spineLabel}</span>
      {isActive && (
        <span className="course-path__level-count" aria-hidden="true">
          {completedCount}/{totalCount}
        </span>
      )}
    </Link>
  );
}

function AssessmentActions({
  selectedLevelId,
  learnerLevelId,
}: {
  selectedLevelId: string;
  learnerLevelId: CefrLevelId;
}) {
  const isNavigatingOwnLevel = learnerLevelId === selectedLevelId;

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
        href={`/assessment?mode=checkpoint&level=${learnerLevelId}`}
        className="course-path__text-link"
        title="Evaluación de salida de tu nivel"
      >
        {isNavigatingOwnLevel
          ? "Checkpoint del nivel"
          : `Checkpoint de tu nivel (${learnerLevelId.toUpperCase()})`}
      </Link>
    </>
  );
}

export default function CoursePathLevelPicker({
  levels,
  selectedLevelId,
  mobileSearch,
  electiveTracks,
}: CoursePathLevelPickerProps) {
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const validCefrLevel = (["a1", "a2", "b1", "b2", "c1", "c2"] as CefrLevelId[]).includes(
    selectedLevelId as CefrLevelId
  )
    ? (selectedLevelId as CefrLevelId)
    : DEFAULT_LEVEL;
  const learnerLevelId = useLearnerLevelId(validCefrLevel);

  const electives = electiveTracks ?? [];
  const optionalTotalCount = electives.reduce(
    (sum, track) => sum + track.units.reduce((uSum, u) => uSum + u.lessons.length, 0),
    0
  );
  const isOptionalActive =
    selectedLevelId === "opcionales" ||
    selectedLevelId === "electivas" ||
    selectedLevelId === "optional" ||
    electives.some((track) => track.id === selectedLevelId);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const userId = await getOptionalUserId();
      if (!userId) {
        if (!cancelled) setCompletedCounts({});
        return;
      }

      const allLevels = [...levels, ...electives];
      const allKeys = allLevels.flatMap((level) =>
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

      let optionalCount = 0;
      for (const track of electives) {
        for (const unit of track.units) {
          for (const lesson of unit.lessons) {
            if (completedSet.has(`${track.id}:${lesson.id}`)) {
              optionalCount++;
            }
          }
        }
      }
      nextCounts["opcionales"] = optionalCount;

      setCompletedCounts(nextCounts);
    }

    loadProgress().catch(() => {
      if (!cancelled) setCompletedCounts({});
    });

    return () => {
      cancelled = true;
    };
  }, [levels, electives]);

  const selectedLevel = levels.find((l) => l.id === selectedLevelId) ?? levels[0];

  return (
    <section className="course-path__level-picker" aria-labelledby="course-level-picker-title">
      <h2 id="course-level-picker-title" className="sr-only">
        Nivel
      </h2>

      {/* Desktop / Tablet Spine Navigation */}
      <nav className="course-path__spine course-path__spine--desktop hidden lg:flex" aria-label="Niveles del curso">
        {levels.map((level) => {
          const totalCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
          const completedCount = completedCounts[level.id] ?? 0;
          const isActive = level.id === selectedLevelId && !isOptionalActive;

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
        {electives.length > 0 && (
          <LevelCardTab
            key="opcionales"
            level={OPTIONAL_TAB_LEVEL}
            isActive={isOptionalActive}
            completedCount={completedCounts["opcionales"] ?? 0}
            totalCount={optionalTotalCount}
          />
        )}
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
              {isOptionalActive ? "Opcionales" : selectedLevel.spineLabel}
            </strong>
            <ChevronDown size={14} aria-hidden />
          </summary>
          <div className="course-path__level-picker-mobile-content">
            <nav className="course-path__spine course-path__spine--mobile" aria-label="Cambiar nivel">
              {levels.map((level) => {
                const totalCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
                const completedCount = completedCounts[level.id] ?? 0;
                const isActive = level.id === selectedLevelId && !isOptionalActive;

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
              {electives.length > 0 && (
                <LevelCardTab
                  key="opcionales"
                  level={OPTIONAL_TAB_LEVEL}
                  isActive={isOptionalActive}
                  completedCount={completedCounts["opcionales"] ?? 0}
                  totalCount={optionalTotalCount}
                />
              )}
            </nav>
            <div className="course-path__level-picker-mobile-actions">
              <AssessmentActions selectedLevelId={selectedLevelId} learnerLevelId={learnerLevelId} />
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
