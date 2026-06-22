"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoursePathPriorityCount } from "@/components/courses/CoursePathIcons";
import CoursePracticeSuggestions from "@/components/courses/CoursePracticeSuggestions";
import { countPriorityLessons } from "@/lib/courses/buildCurriculum";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import { db } from "@/lib/db";
import { deriveLevelView, lessonProgressKey } from "@/lib/courses/progress";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathProgressClientProps {
  level: CoursePathLevel;
  compactHead?: boolean;
}

export default function CoursePathProgressClient({ level, compactHead }: CoursePathProgressClientProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const rows = await db.completedLessons.bulkGet(
        level.units.flatMap((unit) => unit.lessons.map((lesson) => lessonProgressKey(level.id, lesson.id)))
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

    loadProgress().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [level]);

  const derived = useMemo(() => deriveLevelView(level, completedIds), [completedIds, level]);
  const nPriority = countPriorityLessons(level);
  const currentLesson = derived.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.state === "current");
  const firstLesson = derived.units[0]?.lessons[0];

  return (
    <>
      <div className={compactHead ? "course-path__head course-path__head--compact" : "course-path__head"}>
        <h2>{derived.level.title}</h2>
        <div className="course-path__prog">
          <b className="course-path__prog-pct">{derived.progressPercent}%</b>
          <div className="course-path__prog-meta">
            {derived.completedCoreLessons} / {derived.totalCoreLessons} esenciales
            {derived.level.hours && <span>{derived.level.hours}</span>}
            <CoursePathPriorityCount count={nPriority} className="course-path__prog-star" />
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
          <span className="course-path__resume-action">Continuar</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      <CoursePracticeSuggestions level={level} levelId={level.id} completedIds={completedIds} />
    </>
  );
}
