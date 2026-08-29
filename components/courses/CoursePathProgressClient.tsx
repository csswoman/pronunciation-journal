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
 *   - CoursePracticeSuggestions (footer review suggestions)
 */

import { ChevronRight } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import CoursePathHeroBanner from "@/components/courses/CoursePathHeroBanner";
import CoursePathLessonGroup, { type LessonWithState } from "@/components/courses/CoursePathLessonGroup";
import CoursePathProgressRing, { type CoursePathRowProgressStatus } from "@/components/courses/CoursePathProgressRing";
import CoursePracticeSuggestions from "@/components/courses/CoursePracticeSuggestions";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { deriveLevelView, lessonProgressKey } from "@/lib/courses/progress";
import { cn } from "@/lib/cn";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathProgressClientProps {
  level: CoursePathLevel;
  compactHead?: boolean;
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

export default function CoursePathProgressClient({ level, compactHead }: CoursePathProgressClientProps) {
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

  return (
    <>
      {loadError && (
        <div className="course-path__load-error" role="alert">
          <span>No hemos podido leer tu progreso en este dispositivo. Mostramos la ruta sin progreso guardado.</span>
          <button type="button" className="course-path__load-retry" onClick={() => setRetryKey((key) => key + 1)}>
            Reintentar
          </button>
        </div>
      )}

      <div className={compactHead ? "course-path__head course-path__head--compact" : "course-path__head"}>
        {compactHead ? <h2>{derived.level.title}</h2> : <h1>{derived.level.title}</h1>}
      </div>

      <CoursePathHeroBanner
        levelId={level.id}
        firstLesson={firstLesson}
        currentLesson={currentLesson}
        hasProgress={completedIds.size > 0}
      />

      <div className="course-path__units" aria-label="Unidades del curso">
        {derived.units.map((unit) => {
          const totalCount = unit.unit.lessons.length;
          const completedCount = unit.lessons.filter((lesson) => lesson.state === "done").length;
          const progressPercent = unit.progressPercent;

          let rowStatus: CoursePathRowProgressStatus = "unstarted";
          let metaText = `${totalCount} ${totalCount === 1 ? "lección" : "lecciones"} · sin empezar`;

          if (completedCount === totalCount && totalCount > 0) {
            rowStatus = "done";
            metaText = `${totalCount} ${totalCount === 1 ? "lección" : "lecciones"} · completada`;
          } else if (completedCount > 0) {
            rowStatus = "partial";
            metaText = `${totalCount} ${totalCount === 1 ? "lección" : "lecciones"} · ${completedCount} de ${totalCount}`;
          }

          return (
            <details
              key={unit.unit.id}
              className={cn(
                "course-path__unit",
                rowStatus === "done" && "course-path__unit--done",
                unit.unit.isOptionalSection && "course-path__unit--optional-block"
              )}
              open={unit.defaultOpen}
            >
              <summary className="course-path__urow">
                <CoursePathProgressRing
                  status={rowStatus}
                  progressPercent={progressPercent}
                  size={22}
                  ariaLabel={`${unit.unit.title}: ${completedCount} de ${totalCount} lecciones completadas`}
                />
                <div className="course-path__uinfo">
                  <div className="course-path__ut">{unit.unit.title}</div>
                  <div className="course-path__um">
                    <span>{metaText}</span>
                    {unit.unit.isOptionalSection && (
                      <span className="course-path__optional-tag">Opcional</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="course-path__uicon-chevron" size={16} aria-hidden />
              </summary>

              <div className="course-path__lessons" role="region" aria-label={unit.unit.title}>
                <div>
                  {groupPendingLessons(
                    unit.lessons.filter((lesson) => {
                      const isDuplicatedStart = completedIds.size === 0 && lesson.id === firstLesson?.id;
                      return lesson.state !== "done" && !isDuplicatedStart;
                    })
                  ).map(({ group, lessons }, index) => {
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
              </div>
            </details>
          );
        })}
      </div>

      <CoursePracticeSuggestions level={level} levelId={level.id} completedIds={completedIds} />
    </>
  );
}
