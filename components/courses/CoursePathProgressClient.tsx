"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import CoursePracticeSuggestions from "@/components/courses/CoursePracticeSuggestions";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { deriveLevelView, lessonProgressKey } from "@/lib/courses/progress";
import { cn } from "@/lib/cn";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathProgressClientProps {
  level: CoursePathLevel;
  compactHead?: boolean;
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
  const [completedIds, setCompletedIds] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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
      <div className="course-path__progress-loading" role="status" aria-live="polite">
        <span className="course-path__skeleton-bar course-path__skeleton-bar--head" aria-hidden />
        <span>Comprobando tu progreso…</span>
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
        <h2>{derived.level.title}</h2>
        <div className="course-path__prog">
          <b className="course-path__prog-pct">{derived.progressPercent}%</b>
          <div className="course-path__prog-meta">
            {derived.completedCoreLessons} de {derived.totalCoreLessons} lecciones esenciales
            {derived.level.hours && <span>{derived.level.hours}</span>}
          </div>
        </div>
      </div>

      {completedIds.size === 0 && firstLesson && (
        <Link href={studyLessonPath(level.id, firstLesson.number)} className="course-path__start-here">
          <span className="course-path__start-label">Empieza aquí</span>
          <span className="course-path__start-title">{firstLesson.title}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      {completedIds.size > 0 && currentLesson && (
        <Link href={studyLessonPath(level.id, currentLesson.number)} className="course-path__resume">
          <span className="course-path__resume-body">
            <span className="course-path__resume-label">Siguiente lección</span>
            <span className="course-path__resume-title">{currentLesson.title}</span>
          </span>
          <span className="course-path__resume-action">Abrir lección</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      <div className="course-path__units" aria-label="Unidades del curso">
        {derived.units.map((unit) => {
          const completedCount = unit.lessons.filter((lesson) => lesson.state === "done").length;
          const progressPercent = unit.progressPercent;

          return (
            <details
              key={unit.unit.id}
              className={cn( "course-path__unit", unit.status === "done" && "course-path__unit--done", unit.unit.isOptionalSection && "course-path__unit--optional-block", )}
              open={unit.defaultOpen}
            >
              <summary className="course-path__urow">
                <div
                  className="course-path__ring"
                  style={{ "--p": progressPercent } as React.CSSProperties}
                  role="img"
                  aria-label={`${progressPercent}% completada`}
                >
                  <div className="course-path__ring-inner" aria-hidden>{progressPercent}%</div>
                </div>
                <div className="course-path__uinfo">
                  <div className="course-path__un">{unit.unit.label}</div>
                  <div className="course-path__ut">{unit.unit.title}</div>
                  <div className="course-path__um">
                    {completedCount} de {unit.unit.lessons.length} completadas
                    {unit.unit.isOptionalSection && (
                      <span className="course-path__optional-tag">Opcional</span>
                    )}
                  </div>
                </div>
              </summary>

              <div className="course-path__lessons" role="region" aria-label={unit.unit.title}>
                <div>
                  {unit.lessons.map((lesson) => (
                    <CoursePathLessonRow key={lesson.id} lesson={lesson} levelId={level.id} />
                  ))}
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
