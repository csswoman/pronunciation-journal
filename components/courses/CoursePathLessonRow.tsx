/*
 * Planned subcomponents:
 * - CoursePathLessonRow (single lesson item in group list)
 *   - LessonNumber (01, 02 formatted monospace string)
 *   - StateDot (completion status indicator)
 *   - LessonMain (title row + keywords subtitle)
 *     - LessonTitleRow (title link + hover save heart button)
 *   - LessonMetaEnd (tag badge + duration)
 */

import Link from "next/link";
import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import { TrackingSaveButton } from "@/components/tracking/TrackingSaveButton";
import type { CoursePathLesson, CoursePathTrackId, LessonProgressState, LessonTag } from "@/lib/courses/types";

interface CoursePathLessonRowProps {
  lesson: CoursePathLesson & { state: LessonProgressState };
  levelId: CoursePathTrackId;
}

function getTagStyle(tag?: LessonTag, soundLab?: boolean, isOptional?: boolean): { label: string; className: string } {
  if (tag) {
    if (tag === "CONCEPTO") return { label: "concepto", className: "course-path__tag--concepto" };
    if (tag === "PRÁCTICA") return { label: "practica", className: "course-path__tag--practica" };
    if (tag === "PRONUNCIACIÓN") return { label: "pronunciacion", className: "course-path__tag--pronunciacion" };
    if (tag === "REPASO") return { label: "repaso", className: "course-path__tag--repaso" };
  }
  if (soundLab) return { label: "pronunciacion", className: "course-path__tag--pronunciacion" };
  if (isOptional) return { label: "practica", className: "course-path__tag--practica" };
  return { label: "concepto", className: "course-path__tag--concepto" };
}

export default function CoursePathLessonRow({ lesson, levelId }: CoursePathLessonRowProps) {
  const href = studyLessonPath(levelId, lesson.number);
  const formattedNum = String(lesson.number).padStart(2, "0");
  const tagInfo = getTagStyle(lesson.tag, lesson.soundLab, lesson.isOptional);
  const durationText = lesson.duration ?? "5 min";

  return (
    <div
      id={lesson.slug ? `lesson-${lesson.slug}` : undefined}
      className={cn(
        "course-path__lesson",
        lesson.isOptional && "course-path__lesson--optional",
        lesson.state === "done" && "course-path__lesson--done",
        lesson.state === "current" && "course-path__lesson--current"
      )}
    >
      <div
        className={cn(
          "course-path__num-circle",
          lesson.state === "done" && "course-path__num-circle--done",
          lesson.state === "current" && "course-path__num-circle--current"
        )}
        role="img"
        aria-label={
          lesson.state === "done"
            ? "Completada"
            : lesson.state === "current"
            ? "En progreso: siguiente lección"
            : "Pendiente"
        }
      >
        {lesson.state === "done" ? (
          <Check size={12} strokeWidth={2.5} aria-hidden />
        ) : (
          <span>{formattedNum}</span>
        )}
      </div>

      <div className="course-path__lesson-main">
        <div className="course-path__lesson-title-row">
          <Link href={href} className="course-path__lt course-path__lt--link" title={lesson.title}>
            {lesson.title}
          </Link>
          <span className={cn("course-path__tag", tagInfo.className)}>
            {tagInfo.label}
          </span>
          {lesson.slug && (
            <div className="course-path__lesson-heart">
              <TrackingSaveButton
                kind="lesson"
                reference={lesson.slug}
                title={lesson.title}
                payload={{ href }}
                variant="heart"
              />
            </div>
          )}
        </div>
        {lesson.keywords && (
          <span className="course-path__lesson-keywords">{lesson.keywords}</span>
        )}
      </div>

      <span className="course-path__duration">{durationText}</span>
    </div>
  );
}
