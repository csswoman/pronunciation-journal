/*
 * Planned subcomponents:
 * - CoursePathLessonRow (single lesson item in the spine-connected group list)
 *   - LessonNumber (01, 02 formatted monospace string, or StateDot when done/current)
 *   - LessonMain (title row + keywords subtitle)
 *     - LessonTitleRow (title link + hover save heart button)
 *   - LessonMetaEnd (tag badge + duration)
 *   - CoursePathContinueCta (promoted "Continuar" pill, current lesson only)
 */

import Link from "next/link";
import { ArrowRight, Check, Play } from "@/components/icons";
import { cn } from "@/lib/cn";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import { TrackingSaveButton } from "@/components/tracking/TrackingSaveButton";
import { LessonDownloadButton } from "@/components/courses/LessonDownloadButton";
import type { CoursePathLesson, CoursePathTrackId, LessonProgressState, LessonTag } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface CoursePathLessonRowProps {
  lesson: CoursePathLesson & { state: LessonProgressState };
  levelId: CoursePathTrackId;
  isDownloaded?: boolean;
  immersionLesson?: ImmersionLesson;
  /** Last row in the group — suppresses the connecting spine segment below the node. */
  isLast?: boolean;
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

export default function CoursePathLessonRow({
  lesson,
  levelId,
  isDownloaded,
  immersionLesson,
  isLast,
}: CoursePathLessonRowProps) {
  const href = studyLessonPath(levelId, lesson.number);
  const formattedNum = String(lesson.number).padStart(2, "0");
  const tagInfo = getTagStyle(lesson.tag, lesson.soundLab, lesson.isOptional);
  const durationText = lesson.duration ?? "5 min";
  const isCurrent = lesson.state === "current";

  return (
    <div
      id={lesson.slug ? `lesson-${lesson.slug}` : undefined}
      className={cn(
        "course-path__lesson",
        "course-path__spine-item",
        lesson.isOptional && "course-path__lesson--optional",
        lesson.state === "done" && "course-path__lesson--done",
        isCurrent && "course-path__lesson--current",
        isLast && "course-path__spine-item--last"
      )}
    >
      <div className="course-path__spine-node-col" aria-hidden="true">
        <div
          className={cn(
            "course-path__num-circle",
            lesson.state === "done" && "course-path__num-circle--done",
            isCurrent && "course-path__num-circle--current"
          )}
          role="img"
          aria-label={
            lesson.state === "done"
              ? "Completada"
              : isCurrent
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
        {!isLast && <div className="course-path__spine-line" />}
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
            <div className="course-path__lesson-heart flex items-center gap-0.5">
              <LessonDownloadButton
                trackId={levelId}
                lessonNumber={lesson.number}
                slug={lesson.slug}
                title={lesson.title}
                isDownloaded={isDownloaded}
              />
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
        {immersionLesson && (
          <div className="course-path__immersion-link mt-1.5 flex items-center">
            <Link
              href={`/practice/immersion/${immersionLesson.slug}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-raised px-2 py-0.5 text-caption font-medium text-fg-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
              title={`Clase en video: ${immersionLesson.title} (${immersionLesson.teacher})`}
            >
              <Play size={10} className="fill-current text-accent" aria-hidden />
              <span>Video: {immersionLesson.teacher} ({immersionLesson.durationMinutes} min)</span>
              <span className="font-mono text-[10px] text-accent/80">
                {immersionLesson.metadata?.relation === "exact" ? "· canónico" : "· apoyo"}
              </span>
            </Link>
          </div>
        )}
        {isCurrent && (
          <Link href={href} className="course-path__spine-continue">
            <span>Continuar</span>
            <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        )}
      </div>

      {!isCurrent && <span className="course-path__duration">{durationText}</span>}
    </div>
  );
}
