import Link from "next/link";
import { cn } from "@/lib/cn";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import {
  CoursePathLessonStateDot,
  CoursePathPriorityMarks,
  CoursePathSoundLabLink,
} from "@/components/courses/CoursePathIcons";
import type { CoursePathLesson, CoursePathTrackId, LessonProgressState } from "@/lib/courses/types";

interface CoursePathLessonRowProps {
  lesson: CoursePathLesson & { state: LessonProgressState };
  levelId: CoursePathTrackId;
}

export default function CoursePathLessonRow({ lesson, levelId }: CoursePathLessonRowProps) {
  const href = studyLessonPath(levelId, lesson.number);
  const isPriority = lesson.priority > 0;

  return (
    <div
      className={cn(
        "course-path__lesson",
        isPriority && "course-path__lesson--pri",
        lesson.priority === 2 && "course-path__lesson--pri-max",
        lesson.isOptional && "course-path__lesson--optional",
        lesson.state === "current" && "course-path__lesson--current"
      )}
    >
      <CoursePathPriorityMarks priority={lesson.priority} />
      <div className="course-path__st" role="img" aria-label="Available">
        <CoursePathLessonStateDot available />
      </div>
      <Link href={href} className="course-path__lt course-path__lt--link" title={lesson.title}>
        {lesson.title}
      </Link>
      {lesson.soundLab && <CoursePathSoundLabLink />}
      {lesson.state === "current" && (
        <Link href={href} className="course-path__lk">
          Continue
        </Link>
      )}
    </div>
  );
}
