"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";
import { deriveLevelView } from "@/lib/courses/progress";
import { countPriorityLessons } from "@/lib/courses/buildCurriculum";
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
  const { completedIds, ready } = useCoursePathProgress(level.id);

  const derived = useMemo(
    () => (ready ? deriveLevelView(level, completedIds) : null),
    [level, completedIds, ready]
  );

  const toggleUnit = (unitId: string) => {
    setOpenUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isUnitOpen = (unitId: string, defaultOpen: boolean) => openUnits[unitId] ?? defaultOpen;

  const nPriority = countPriorityLessons(level);

  if (!ready || !derived) {
    return <p className="text-sm text-fg-muted py-6">Cargando progreso…</p>;
  }

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
              >
                <div
                  className="course-path__ring"
                  style={{ "--p": u.progressPercent } as React.CSSProperties}
                >
                  <div className="course-path__ring-inner">{ringLabel}</div>
                </div>
                <div className="course-path__uinfo">
                  <div className="course-path__un">{u.unit.label}</div>
                  <div className="course-path__ut">{u.unit.title}</div>
                  <div className="course-path__um">{u.unit.lessons.length} cursos</div>
                </div>
                <ChevronRight className="course-path__chev" size={18} aria-hidden />
              </button>

              <div className="course-path__lessons">
                {u.lessons.map((lesson) => (
                  <CoursePathLessonRow key={lesson.id} lesson={lesson} levelId={level.id} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
