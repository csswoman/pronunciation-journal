import Link from "next/link";
import { cn } from "@/lib/cn";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import {
  CoursePathLessonStateDot,
  CoursePathSoundLabLink,
} from "@/components/courses/CoursePathIcons";
import { TrackingSaveButton } from "@/components/tracking/TrackingSaveButton";
import type { CoursePathLesson, CoursePathTrackId, LessonProgressState } from "@/lib/courses/types";

// Planned structure:
// <CoursePathLessonRow>
//   <StateDot />
//   <LessonTitleLink />
//   <SoundLabLink? />
//   <TrackingHeartButton? />
//   <StartButton? />
// </CoursePathLessonRow>

interface CoursePathLessonRowProps {
  lesson: CoursePathLesson & { state: LessonProgressState };
  levelId: CoursePathTrackId;
}

export default function CoursePathLessonRow({ lesson, levelId }: CoursePathLessonRowProps) {
  const href = studyLessonPath(levelId, lesson.number);

  return (
    <div
      id={lesson.slug ? `lesson-${lesson.slug}` : undefined}
      className={cn( "course-path__lesson", lesson.isOptional && "course-path__lesson--optional", lesson.state === "done" && "course-path__lesson--done", lesson.state === "current" && "course-path__lesson--current" )}
    >
      <div
        className="course-path__st"
        role="img"
        aria-label={lesson.state === "done" ? "Completada" : lesson.state === "current" ? "En progreso: siguiente lección" : "Pendiente"}
      >
        <CoursePathLessonStateDot state={lesson.state} />
      </div>
      <Link href={href} className="course-path__lt course-path__lt--link" title={lesson.title}>
        {lesson.title}
      </Link>
      {lesson.soundLab && <CoursePathSoundLabLink />}
      {lesson.slug && (
        <TrackingSaveButton
          kind="lesson"
          reference={lesson.slug}
          title={lesson.title}
          payload={{ href }}
          variant="heart"
        />
      )}
      {lesson.state === "current" && (
        <Link href={href} className="course-path__lk">
          Empezar lección
        </Link>
      )}
    </div>
  );
}
