/*
 * Planned subcomponents:
 * - CoursePathLessonGroup (styled accordion group row matching target design)
 *   - GroupIconBox (rounded icon square with status-driven colors)
 *   - GroupHeading (title + meta line with status text)
 *   - GroupChevron (expand/collapse indicator)
 *   - LessonGroupBody (list of CoursePathLessonRow items)
 */

import { Fragment } from "react";
import { BookOpen, ChevronRight, HelpCircle, MicVocal, User } from "@/components/icons";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import { cn } from "@/lib/cn";
import type { CoursePathLesson, CoursePathLevel, LessonProgressState } from "@/lib/courses/types";

export type LessonWithState = CoursePathLesson & { state: LessonProgressState };

interface CoursePathLessonGroupProps {
  id: string;
  title: string;
  lessons: LessonWithState[];
  levelId: CoursePathLevel["id"];
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  completed?: boolean;
  downloadedIds?: ReadonlySet<string>;
}

function getGroupIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("gramática")) return BookOpen;
  if (lower.includes("preguntas") || lower.includes("presente")) return HelpCircle;
  if (lower.includes("acciones") || lower.includes("vida") || lower.includes("rutina")) return User;
  if (lower.includes("pronunciación") || lower.includes("sonido") || lower.includes("escucha") || lower.includes("audio")) return MicVocal;
  return BookOpen;
}

export default function CoursePathLessonGroup({
  id,
  title,
  lessons,
  levelId,
  open,
  onToggle,
  completed,
  downloadedIds,
}: CoursePathLessonGroupProps) {
  const totalCount = lessons.length;
  const completedCount = lessons.filter((lesson) => lesson.state === "done").length;
  const isFullyDone = completed || (completedCount === totalCount && totalCount > 0);
  const isInProgress = !isFullyDone && (completedCount > 0 || lessons.some((lesson) => lesson.state === "current"));

  let statusClass = "unstarted";
  if (isFullyDone) statusClass = "done";
  else if (isInProgress) statusClass = "partial";

  const GroupIcon = getGroupIcon(title);

  let lastSubgroup: string | undefined = undefined;

  return (
    <details
      className={cn("course-path__lesson-group", `course-path__lesson-group--${statusClass}`)}
      open={open}
      onToggle={(event) => onToggle(id, event.currentTarget.open)}
    >
      <summary className="course-path__lesson-group-summary">
        <div className={cn("course-path__group-icon-box", `course-path__group-icon-box--${statusClass}`)} aria-hidden="true">
          <GroupIcon size={20} className="course-path__group-icon" />
        </div>
        <span className="course-path__lesson-group-heading">
          <span className="course-path__lesson-group-title">{title}</span>
          <span className="course-path__lesson-group-meta">
            {totalCount} {totalCount === 1 ? "lección" : "lecciones"} ·{" "}
            {isFullyDone && (
              <span className="course-path__meta-status course-path__meta-status--done">completado</span>
            )}
            {isInProgress && (
              <span className="course-path__meta-status course-path__meta-status--partial">
                {completedCount} {completedCount === 1 ? "completada" : "completadas"}
              </span>
            )}
            {!isFullyDone && !isInProgress && (
              <span className="course-path__meta-status course-path__meta-status--unstarted">sin empezar</span>
            )}
          </span>
        </span>
        <ChevronRight className="course-path__lesson-group-chevron" size={16} aria-hidden />
      </summary>
      <div className="course-path__lesson-group-body">
        {lessons.map((lesson) => {
          const showSubgroup = Boolean(lesson.subgroup && lesson.subgroup !== lastSubgroup);
          if (lesson.subgroup) {
            lastSubgroup = lesson.subgroup;
          }
          return (
            <Fragment key={lesson.id}>
              {showSubgroup && (
                <div className="course-path__subgroup-kicker">
                  {lesson.subgroup}
                </div>
              )}
              <CoursePathLessonRow
                lesson={lesson}
                levelId={levelId}
                isDownloaded={downloadedIds?.has(`${levelId}:${lesson.number}`)}
              />
            </Fragment>
          );
        })}
      </div>
    </details>
  );
}
