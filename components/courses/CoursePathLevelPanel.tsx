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
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  openUnits?: Record<string, boolean>;
  onToggleUnit?: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  electiveTracks?: CoursePathLevel[];
}

export default function CoursePathLevelPanel({ level, compactHead, openUnits: openUnitsProp, onToggleUnit, electiveTracks }: CoursePathLevelPanelProps) {
  const [localOpenUnits, setLocalOpenUnits] = useState<Record<string, boolean>>({});
  const openUnits = openUnitsProp ?? localOpenUnits;
  const { completedIds, ready, error, retry } = useCoursePathProgress(level.id);

  const derived = useMemo(
    () => (ready ? deriveLevelView(level, completedIds) : null),
    [level, completedIds, ready]
  );

  const toggleUnit = (unitId: string) => {
    const updater = (prev: Record<string, boolean>) => ({ ...prev, [unitId]: !prev[unitId] });
    if (onToggleUnit) {
      onToggleUnit(updater);
    } else {
      setLocalOpenUnits(updater);
    }
  };

  const isUnitOpen = (unitId: string, defaultOpen: boolean) => openUnits[unitId] ?? defaultOpen;

  const nPriority = countPriorityLessons(level);

  if (error) {
    return (
      <div className="course-path__load-error">
        <p>Couldn't load your progress. Check your connection and try again.</p>
        <button type="button" className="course-path__load-retry" onClick={retry}>
          Try again
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

  const firstLesson = derived.units[0]?.lessons[0];

  return (
    <>
      <div className={cn("course-path__head", compactHead && "course-path__head--compact")}>
        <h2>{derived.level.title}</h2>
        <div className="course-path__prog">
          <b className="course-path__prog-pct">{derived.progressPercent}%</b>
          <div className="course-path__prog-meta">
            {derived.completedCoreLessons} / {derived.totalCoreLessons} core
            {derived.level.hours && <span>{derived.level.hours}</span>}
            <CoursePathPriorityCount count={nPriority} className="course-path__prog-star" />
          </div>
        </div>
      </div>

      {completedIds.size === 0 && !compactHead && firstLesson && (
        <Link
          href={studyLessonPath(level.id, firstLesson.number)}
          className="course-path__start-here"
        >
          <span className="course-path__start-label">Start here</span>
          <span className="course-path__start-title">{firstLesson.title}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      {completedIds.size > 0 && currentLesson && (
        <Link
          href={studyLessonPath(level.id, currentLesson.number)}
          className="course-path__resume"
        >
          <span className="course-path__resume-label">Continue</span>
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
                disabled={u.status === "locked"}
              >
                <div
                  className="course-path__ring"
                  style={{ "--p": u.progressPercent } as React.CSSProperties}
                  aria-label={
                    u.status === "done"
                      ? "Completed"
                      : u.status === "locked"
                      ? "Locked"
                      : `${u.progressPercent}% complete`
                  }
                  role="img"
                >
                  <div className="course-path__ring-inner" aria-hidden>{ringLabel}</div>
                </div>
                <div className="course-path__uinfo">
                  <div className="course-path__un">{u.unit.label}</div>
                  <div className="course-path__ut">{u.unit.title}</div>
                  <div className="course-path__um">
                    {u.unit.lessons.length} courses
                    {u.unit.isOptionalSection && (
                      <span className="course-path__optional-tag">Optional</span>
                    )}
                  </div>
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

      {level.realLife && level.realLife.length > 0 && (
        <CoursePathRealLife scenarios={level.realLife} />
      )}
      {level.id === "c1" && electiveTracks && electiveTracks.length > 0 && (
        <CoursePathC1Electives tracks={electiveTracks} />
      )}
    </>
  );
}
