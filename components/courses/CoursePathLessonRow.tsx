import Link from "next/link";
import { Check, Play, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import {
  CoursePathPriorityMarks,
  CoursePathSoundLabLink,
  CoursePathLessonStateDot,
} from "@/components/courses/CoursePathIcons";
import type { CoursePathLesson, CoursePathTrackId, LessonProgressState } from "@/lib/courses/types";

interface CoursePathLessonRowProps {
  lesson: CoursePathLesson & { state: LessonProgressState };
  levelId: CoursePathTrackId;
}

export default function CoursePathLessonRow({ lesson, levelId }: CoursePathLessonRowProps) {
  const href = studyLessonPath(levelId, lesson.number);
  const isLocked = lesson.state === "locked";
  const isCurrent = lesson.state === "current";
  const isDone = lesson.state === "done";
  const isAvailable = lesson.state === "available";
  const canOpen = !isLocked;
  const isPriority = lesson.priority > 0;

  const stateLabel = isDone
    ? "Completed"
    : isCurrent
    ? "In progress"
    : isLocked
    ? "Locked"
    : "Available";

  const className = cn(
    "course-path__lesson",
    isPriority && "course-path__lesson--pri",
    lesson.priority === 2 && "course-path__lesson--pri-max",
    lesson.isOptional && "course-path__lesson--optional",
    isDone && "course-path__lesson--done",
    isCurrent && "course-path__lesson--current",
    isLocked && "course-path__lesson--locked"
  );

  const lockDescId = isLocked ? `lock-desc-${lesson.id}` : undefined;

  const titleContent = canOpen ? (
    <Link href={href} className="course-path__lt course-path__lt--link" title={lesson.title}>
      {lesson.title}
      {isDone && <Check size={11} strokeWidth={2.5} className="course-path__lt-check" aria-hidden />}
    </Link>
  ) : (
    <span className="course-path__lt" title={lesson.title}>
      {lesson.title}
      {isDone && <Check size={11} strokeWidth={2.5} className="course-path__lt-check" aria-hidden />}
    </span>
  );

  return (
    <div className={className} aria-describedby={lockDescId}>
      <CoursePathPriorityMarks priority={lesson.priority} />
      <div className="course-path__st" role="img" aria-label={stateLabel}>
        {isCurrent ? (
          <Play size={10} className="fill-current" aria-hidden />
        ) : isLocked ? (
          <Lock size={10} strokeWidth={2} aria-hidden />
        ) : !isDone ? (
          <CoursePathLessonStateDot available={isAvailable} />
        ) : null}
      </div>
      {titleContent}
      {lesson.soundLab && <CoursePathSoundLabLink />}
      {isLocked && (
        <>
          <span className="course-path__locked-label" aria-hidden>Locked</span>
          <span id={lockDescId} className="sr-only">Complete earlier lessons to unlock</span>
        </>
      )}
      {isCurrent && canOpen && (
        <Link href={href} className="course-path__lk">
          Continue
          <ArrowRight size={12} aria-hidden />
        </Link>
      )}
    </div>
  );
}
