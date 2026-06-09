"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Lock, ArrowRight } from "lucide-react";
import { deriveLevelView } from "@/lib/courses/progress";
import { countPriorityLessons } from "@/lib/courses/buildCurriculum";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import type { CoursePathLevel } from "@/lib/courses/types";
import { useCoursePathProgress } from "@/hooks/useCoursePathProgress";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import { CoursePathPriorityCount } from "@/components/courses/CoursePathIcons";
import { cn } from "@/lib/cn";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
}

export default function CoursePathLevelPanel({ level, compactHead }: CoursePathLevelPanelProps) {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const { completedIds, ready, error, retry } = useCoursePathProgress(level.id);

  const derived = useMemo(
    () => (ready ? deriveLevelView(level, completedIds) : null),
    [level, completedIds, ready]
  );

  const toggleUnit = (unitId: string) => {
    setOpenUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isUnitOpen = (unitId: string, defaultOpen: boolean) => openUnits[unitId] ?? defaultOpen;

  const nPriority = countPriorityLessons(level);

  if (error) {
    return (
      <div className="course-path__load-error">
        <p>No se pudo cargar el progreso.</p>
        <button type="button" className="course-path__load-retry" onClick={retry}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!ready || !derived) {
    return (
      <div className="course-path__load-skeleton">
        <div className="course-path__skeleton-bar course-path__skeleton-bar--head" />
        <div className="course-path__skeleton-bar" />
        <div className="course-path__skeleton-bar" />
      </div>
    );
  }

  const currentLesson = derived.units
    .flatMap((u) => u.lessons)
    .find((l) => l.state === "current");

  return (
    <>
      <div className={cn("course-path__head", compactHead && "course-path__head--compact")}>
        <h2>{derived.level.title}</h2>
        <p className="course-path__prog">
          Progreso: <b>{derived.progressPercent}%</b>
          {derived.level.hours && <> · {derived.level.hours}</>}
          {" · "}
          <CoursePathPriorityCount count={nPriority} className="course-path__prog-star" />
          {" · "}
          {derived.completedCoreLessons} / {derived.totalCoreLessons} core
        </p>
      </div>

      {currentLesson && (
        <Link
          href={studyLessonPath(level.id, currentLesson.number)}
          className="course-path__resume"
        >
          <span className="course-path__resume-label">Continuar</span>
          <span className="course-path__resume-title">{currentLesson.title}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      <div className="course-path__units">
        {derived.units.map((u) => {
          const open = isUnitOpen(u.unit.id, u.defaultOpen);
          const ringLabel =
            u.status === "done" ? (
              <Check size={14} strokeWidth={2.5} aria-hidden />
            ) : u.status === "locked" ? (
              <Lock size={12} aria-hidden />
            ) : (
              `${u.progressPercent}%`
            );

          return (
            <div
              key={u.unit.id}
              className={cn(
                "course-path__unit",
                open && "course-path__unit--open",
                u.status === "active" && "course-path__unit--active",
                u.status === "done" && "course-path__unit--done",
                u.status === "locked" && "course-path__unit--locked",
                u.unit.isOptionalSection && "course-path__unit--optional-block"
              )}
            >
              <button
                type="button"
                className="course-path__urow"
                onClick={() => toggleUnit(u.unit.id)}
                aria-expanded={open}
                aria-controls={`unit-lessons-${u.unit.id}`}
              >
                <div
                  className="course-path__ring"
                  style={{ "--p": u.progressPercent } as React.CSSProperties}
                  aria-label={
                    u.status === "done"
                      ? "Completada"
                      : u.status === "locked"
                      ? "Bloqueada"
                      : `${u.progressPercent}% completado`
                  }
                  role="img"
                >
                  <div className="course-path__ring-inner" aria-hidden>{ringLabel}</div>
                </div>
                <div className="course-path__uinfo">
                  <div className="course-path__un">{u.unit.label}</div>
                  <div className="course-path__ut">{u.unit.title}</div>
                  <div className="course-path__um">{u.unit.lessons.length} cursos</div>
                </div>
                <ChevronRight className="course-path__chev" size={18} aria-hidden />
              </button>

              <div
                id={`unit-lessons-${u.unit.id}`}
                className="course-path__lessons"
                role="region"
                aria-label={u.unit.title}
              >
                <div>
                  {u.lessons.map((lesson) => (
                    <CoursePathLessonRow key={lesson.id} lesson={lesson} levelId={level.id} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
