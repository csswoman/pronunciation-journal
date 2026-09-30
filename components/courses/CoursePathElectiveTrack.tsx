"use client";

/*
 * Planned subcomponents:
 * - CoursePathElectiveTrack (collapsible course card with lesson spine)
 *   - TrackSummaryRow (icon, title, lesson count, status badge, chevron)
 *   - TrackSpineBody (spine-connected list of CoursePathLessonRow items)
 */

import { useState } from "react";
import { ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { CoursePathLesson, CoursePathLevel, LessonProgressState } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";
import { countPriorityLessons } from "@/lib/courses/buildCurriculum";
import { lessonProgressKey } from "@/lib/courses/progress";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import {
  CoursePathElectiveSpineIcon,
  CoursePathPriorityCount,
} from "@/components/courses/CoursePathIcons";

interface CoursePathElectiveTrackProps {
  level: CoursePathLevel;
  defaultOpen?: boolean;
  topicImmersionMap?: Record<string, ImmersionLesson>;
  completedIds?: Set<string>;
  downloadedIds?: Set<string>;
}

function getTrackTone(title: string): "lilac" | "butter" | "mint" | "coral" | "sky" {
  const lower = title.toLowerCase();
  if (lower.includes("gramática") || lower.includes("negocios") || lower.includes("business")) return "lilac";
  if (lower.includes("preguntas") || lower.includes("viajes") || lower.includes("travel")) return "butter";
  if (lower.includes("acciones") || lower.includes("vida") || lower.includes("tecnología")) return "mint";
  if (lower.includes("pronunciación") || lower.includes("entrevistas") || lower.includes("interview")) return "coral";
  return "sky";
}

export default function CoursePathElectiveTrack({
  level,
  defaultOpen,
  topicImmersionMap,
  completedIds,
  downloadedIds,
}: CoursePathElectiveTrackProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const tone = getTrackTone(level.title);
  const nPriority = countPriorityLessons(level);
  const allLessons = level.units.flatMap((u) => u.lessons);
  const totalCourses = allLessons.length;

  let assignedCurrent = false;
  const lessonsWithState: Array<CoursePathLesson & { state: LessonProgressState }> = allLessons.map((lesson) => {
    const isDone = completedIds?.has(lessonProgressKey(level.id, lesson.id)) ?? false;
    if (isDone) {
      return { ...lesson, state: "done" };
    }
    if (!assignedCurrent) {
      assignedCurrent = true;
      return { ...lesson, state: "current" };
    }
    return { ...lesson, state: "available" };
  });

  const completedCount = lessonsWithState.filter((l) => l.state === "done").length;
  const isFullyDone = completedCount === totalCourses && totalCourses > 0;
  const isInProgress = !isFullyDone && completedCount > 0;

  return (
    <div className={cn("course-path__ruta", open && "course-path__ruta--open")}>
      <button
        type="button"
        className="course-path__rrow cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={cn("course-path__lvb", `course-path__lvb--${tone}`)}>
          {level.spineIcon ? (
            <CoursePathElectiveSpineIcon icon={level.spineIcon} />
          ) : (
            level.spineLabel
          )}
        </div>
        <div className="course-path__rinfo">
          <div className="course-path__rt font-heading font-bold text-fg">{level.title}</div>
          <div className="course-path__rm text-body-sm text-fg-muted flex items-center flex-wrap gap-2">
            <span>{totalCourses} lecciones</span>
            {level.hours && <span>· {level.hours}</span>}
            <CoursePathPriorityCount count={nPriority} className="course-path__rm-star" />
            {isFullyDone && (
              <span className="course-path__meta-status course-path__meta-status--done">completada</span>
            )}
            {isInProgress && (
              <span className="course-path__meta-status course-path__meta-status--partial">
                {completedCount} de {totalCourses}
              </span>
            )}
            {!isFullyDone && !isInProgress && (
              <span className="course-path__meta-status course-path__meta-status--unstarted">sin empezar</span>
            )}
          </div>
        </div>
        <ChevronRight
          className={cn("course-path__rchev transition-transform duration-200", open && "rotate-90 text-primary")}
          size={18}
          aria-hidden
        />
      </button>

      <div className="course-path__ruta-body-wrap">
        <div className="course-path__ruta-body">
          <div className="course-path__spine-body p-1 sm:p-2">
            {lessonsWithState.map((lesson, index) => (
              <CoursePathLessonRow
                key={lesson.id}
                lesson={lesson}
                levelId={level.id}
                isDownloaded={downloadedIds?.has(`${level.id}:${lesson.number}`)}
                immersionLesson={lesson.slug ? topicImmersionMap?.[lesson.slug] : undefined}
                isLast={index === lessonsWithState.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
