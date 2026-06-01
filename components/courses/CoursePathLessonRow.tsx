import Link from "next/link";
import { Check, Play, ArrowRight } from "lucide-react";
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

  const className = cn(
    "course-path__lesson",
    isPriority && "course-path__lesson--pri",
    lesson.priority === 2 && "course-path__lesson--pri-max",
    lesson.isOptional && "course-path__lesson--optional",
    isDone && "course-path__lesson--done",
    isCurrent && "course-path__lesson--current",
    isLocked && "course-path__lesson--locked"
  );

  const titleEl = canOpen ? (
    <Link href={href} className="course-path__lt course-path__lt--link">
      {lesson.title}
    </Link>
  ) : (
    <span className="course-path__lt">{lesson.title}</span>
  );

  return (
    <div className={className}>
      <CoursePathPriorityMarks priority={lesson.priority} />
      <div className="course-path__st">
        {isDone ? (
          <Check size={12} strokeWidth={2.5} aria-hidden />
        ) : isCurrent ? (
          <Play size={10} className="fill-current" aria-hidden />
        ) : (
          <CoursePathLessonStateDot available={isAvailable} />
        )}
      </div>
      {titleEl}
      {lesson.soundLab && <CoursePathSoundLabLink />}
      {isCurrent && canOpen && (
        <Link href={href} className="course-path__lk">
          Continuar
          <ArrowRight size={14} aria-hidden />
        </Link>
      )}
    </div>
  );
}
