"use client";

/*
 * Planned subcomponents:
 * - CoursePathProgressClient (client coordinator for course path progress)
 *   - ProgressLoadingState (WordCarousel loader)
 *   - ProgressErrorBanner (offline / dexie error banner)
 *   - ProgressLevelHead (level title heading)
 *   - ProgressCtaSection (start here / resume next lesson)
 *   - UnitAccordionList (list of course path units with 3-state summary rows)
 *     - UnitSummaryRow (CoursePathProgressRing + title + meta + chevron)
 *     - UnitLessonsList (pending LessonGroups and completed LessonGroup)
 *   - CoursePathYaPuedesDecirEsto (inline achievement block for real-world phrases)
 *   - CoursePracticeSuggestions (footer review suggestions)
 *   - CoursePathC1Electives (optional post-C1 elective tracks list)
 *   - CoursePathAsideProgress (sidebar progress dashboard)
 */

import Link from "next/link";
import { BookOpen, ChevronRight } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import CoursePathAsideProgress from "@/components/courses/CoursePathAsideProgress";
import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";
import CoursePathHeroBanner from "@/components/courses/CoursePathHeroBanner";
import CoursePathLessonGroup, { type LessonWithState } from "@/components/courses/CoursePathLessonGroup";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import CoursePathSearch from "@/components/courses/CoursePathSearch";
import CoursePathYaPuedesDecirEsto from "@/components/courses/CoursePathYaPuedesDecirEsto";
import CoursePracticeSuggestions from "@/components/courses/CoursePracticeSuggestions";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { deriveLevelView, lessonProgressKey } from "@/lib/courses/progress";
import type { CoursePathLevel } from "@/lib/courses/types";
import { cn } from "@/lib/cn";

interface CoursePathProgressClientProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  hideAside?: boolean;
  electiveTracks?: CoursePathLevel[];
}

function groupPendingLessons(lessons: LessonWithState[]): Array<{ group: string; lessons: LessonWithState[] }> {
  return lessons.reduce<Array<{ group: string; lessons: LessonWithState[] }>>((groups, lesson) => {
    const group = lesson.group ?? "Contenido del curso";
    const lastGroup = groups.at(-1);
    if (lastGroup?.group === group) {
      lastGroup.lessons.push(lesson);
    } else {
      groups.push({ group, lessons: [lesson] });
    }
    return groups;
  }, []);
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

export default function CoursePathProgressClient({
  level,
  compactHead,
  hideAside,
  electiveTracks,
}: CoursePathProgressClientProps) {
  const loadingWords = useLoadingWords();
  const [completedIds, setCompletedIds] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`course-path:groups:${level.id}`);
      setExpandedGroups(saved ? (JSON.parse(saved) as Record<string, boolean>) : {});
    } catch {
      setExpandedGroups({});
    }
  }, [level.id]);

  const handleGroupToggle = (id: string, open: boolean) => {
    setExpandedGroups((previous) => {
      const next = { ...previous, [id]: open };
      try {
        window.localStorage.setItem(`course-path:groups:${level.id}`, JSON.stringify(next));
      } catch {
        // Storage unavailable fallback
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    setCompletedIds(null);
    setLoadError(false);

    async function loadProgress() {
      const userId = await getOptionalUserId();

      if (!userId) {
        if (!cancelled) setCompletedIds(new Set());
        return;
      }

      const rows = await db.completedLessons.bulkGet(
        level.units.flatMap((unit) =>
          unit.lessons.map((lesson) => completionKey(userId, level.id, lesson.id))
        )
      );

      if (cancelled) return;

      setCompletedIds(
        new Set(
          rows
            .filter((row): row is NonNullable<typeof row> => Boolean(row))
            .map((row) => lessonProgressKey(level.id, row.lessonSlug))
        )
      );
    }

    loadProgress().catch(() => {
      if (!cancelled) {
        setCompletedIds(new Set());
        setLoadError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [level, retryKey]);

  const derived = useMemo(() => {
    if (!completedIds) return null;
    return deriveLevelView(level, completedIds);
  }, [completedIds, level]);

  const currentLesson = derived?.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.state === "current");
  const firstLesson = derived?.units[0]?.lessons[0];

  if (!derived || !completedIds) {
    return (
      <div
        className="course-path__progress-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Comprobando tu progreso"
      >
        <span className="sr-only">Comprobando tu progreso…</span>
        <WordCarousel words={loadingWords} />
      </div>
    );
  }

  const totalLessonCount = derived.units.reduce((sum, u) => sum + u.unit.lessons.length, 0);
  const completedLessonCount = derived.units.reduce(
    (sum, u) => sum + u.lessons.filter((l) => l.state === "done").length,
    0
  );
  const showAside = !hideAside && !level.isElective;

  return (
    <div
      className={cn(
        "course-path__client-layout",
        !showAside && "course-path__client-layout--no-aside"
      )}
    >
      <div className="course-path__client-main">
        {loadError && (
          <div className="course-path__load-error" role="alert">
            <span>No hemos podido leer tu progreso en este dispositivo. Mostramos la ruta sin progreso guardado.</span>
            <button type="button" className="course-path__load-retry" onClick={() => setRetryKey((key) => key + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {!compactHead && (
          <div className="course-path__head-row flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="course-path__head min-w-0 flex-1">
              <h2 className="text-h2 font-bold text-fg">{derived.level.title}</h2>
              {derived.level.description && (
                <p className="course-path__head-subtitle text-body-sm text-fg-muted mt-1">
                  {derived.level.description}
                </p>
              )}
            </div>
            <div className="course-path__head-actions flex items-center gap-4 shrink-0 pt-1">
              <Link
                href="/assessment"
                className="course-path__text-link font-semibold text-primary hover:underline"
                title="Evaluación diagnóstica inicial para ubicar tu nivel"
              >
                Test de ubicación
              </Link>
              <Link
                href={`/assessment?mode=checkpoint&level=${level.id}`}
                className="course-path__text-link font-semibold text-primary hover:underline"
                title="Evaluación de salida del nivel seleccionado"
              >
                Checkpoint
              </Link>
            </div>
          </div>
        )}

        <CoursePathHeroBanner
          levelId={level.id}
          firstLesson={firstLesson}
          currentLesson={currentLesson}
          hasProgress={completedIds.size > 0}
        />

        <div className="course-path__main-search mb-4">
          <CoursePathSearch />
        </div>

        <div className="course-path__units" aria-label="Unidades del curso">
          {derived.units.map((unit) => {
            const totalCount = unit.unit.lessons.length;
            const completedCount = unit.lessons.filter((lesson) => lesson.state === "done").length;
            const isOptional = Boolean(unit.unit.isOptionalSection);

            if (isOptional) {
              const optId = `${unit.unit.id}-optional-card`;
              const optOpen = expandedGroups[optId] ?? false;

              return (
                <details
                  key={unit.unit.id}
                  className="course-path__optional-card"
                  open={optOpen}
                  onToggle={(e) => handleGroupToggle(optId, e.currentTarget.open)}
                >
                  <summary className="course-path__optional-summary">
                    <div className="course-path__optional-icon-box" aria-hidden="true">
                      <BookOpen size={20} className="course-path__optional-icon" />
                    </div>
                    <div className="course-path__optional-heading">
                      <span className="course-path__optional-title">{unit.unit.title}</span>
                      <span className="course-path__optional-meta">
                        {totalCount} {totalCount === 1 ? "lección" : "lecciones"} ·{" "}
                        {completedCount === totalCount && totalCount > 0 ? "completado" : completedCount > 0 ? `${completedCount} de ${totalCount}` : "sin empezar"}{" "}
                        <span className="course-path__optional-badge">OPCIONAL</span>
                      </span>
                    </div>
                    <ChevronRight className="course-path__optional-chevron" size={16} aria-hidden />
                  </summary>

                  <div className="course-path__optional-body">
                    {unit.lessons.map((lesson) => (
                      <CoursePathLessonRow
                        key={`${unit.unit.id}-${lesson.id}`}
                        lesson={lesson}
                        levelId={level.id}
                      />
                    ))}
                  </div>
                </details>
              );
            }

            // Core essential units card container
            const pendingGroups = groupPendingLessons(
              unit.lessons.filter((lesson) => {
                const isDuplicatedStart = completedIds.size === 0 && lesson.id === firstLesson?.id;
                return lesson.state !== "done" && !isDuplicatedStart;
              })
            );

            return (
              <div key={unit.unit.id} className="course-path__main-card">
                {pendingGroups.map(({ group, lessons }, index) => {
                  const id = `${unit.unit.id}-${group}-${index}`;
                  const hasCurrentLesson = lessons.some((lesson) => lesson.state === "current");
                  return (
                    <CoursePathLessonGroup
                      key={id}
                      id={id}
                      title={group}
                      lessons={lessons}
                      levelId={level.id}
                      open={expandedGroups[id] ?? (hasCurrentLesson || index === 0)}
                      onToggle={handleGroupToggle}
                    />
                  );
                })}
                {unit.lessons.some((lesson) => lesson.state === "done") && (() => {
                  const id = `${unit.unit.id}-completed`;
                  const lessons = unit.lessons.filter((lesson) => lesson.state === "done");
                  return (
                    <CoursePathLessonGroup
                      id={id}
                      title="Completadas"
                      lessons={lessons}
                      levelId={level.id}
                      open={expandedGroups[id] ?? false}
                      onToggle={handleGroupToggle}
                      completed
                    />
                  );
                })()}
              </div>
            );
          })}
        </div>

        {level.realLife && level.realLife.length > 0 && (
          <CoursePathYaPuedesDecirEsto
            scenarios={level.realLife}
            isUnlocked={completedIds.size > 0}
          />
        )}

        <CoursePracticeSuggestions level={level} levelId={level.id} completedIds={completedIds} />

        {electiveTracks && electiveTracks.length > 0 && (
          <CoursePathC1Electives tracks={electiveTracks} />
        )}
      </div>

      {showAside && (
        <div className="course-path__client-aside hidden lg:block">
          <CoursePathAsideProgress
            level={level}
            selectedLevelId={level.id}
            completedCount={completedLessonCount}
            totalCount={totalLessonCount}
            completedIds={completedIds}
          />
        </div>
      )}
    </div>
  );
}
