/*
 * Planned subcomponents:
 * - CoursePathLessonGroup (collapsible accordion for a subgroup of lessons)
 *   - LessonGroupSummary (title, lesson count / here status, chevron)
 *   - LessonGroupBody (list of CoursePathLessonRow items)
 */

import { ChevronRight } from "@/components/icons";
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
}

export default function CoursePathLessonGroup({
  id,
  title,
  lessons,
  levelId,
  open,
  onToggle,
  completed,
}: CoursePathLessonGroupProps) {
  const currentLesson = lessons.find((lesson) => lesson.state === "current");

  return (
    <details
      className={cn("course-path__lesson-group", completed && "course-path__lesson-group--completed")}
      open={open}
      onToggle={(event) => onToggle(id, event.currentTarget.open)}
    >
      <summary className="course-path__lesson-group-summary">
        <span className="course-path__lesson-group-heading">
          <span className="course-path__lesson-group-title">{title}</span>
          <span className="course-path__lesson-group-meta">
            {currentLesson ? "Aquí vas" : `${lessons.length} ${lessons.length === 1 ? "lección" : "lecciones"}`}
          </span>
        </span>
        <ChevronRight className="course-path__lesson-group-chevron" size={16} aria-hidden />
      </summary>
      <div className="course-path__lesson-group-body">
        {lessons.map((lesson) => (
          <CoursePathLessonRow key={lesson.id} lesson={lesson} levelId={levelId} />
        ))}
      </div>
    </details>
  );
}
