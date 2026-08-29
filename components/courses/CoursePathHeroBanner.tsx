import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import type { CoursePathLesson, CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathHeroBannerProps {
  levelId: CoursePathTrackId;
  firstLesson?: CoursePathLesson;
  currentLesson?: CoursePathLesson;
  hasProgress: boolean;
}

export default function CoursePathHeroBanner({
  levelId,
  firstLesson,
  currentLesson,
  hasProgress,
}: CoursePathHeroBannerProps) {
  if (!hasProgress && firstLesson) {
    return (
      <Link href={studyLessonPath(levelId, firstLesson.number)} className="course-path__resume">
        <span className="course-path__resume-body">
          <span className="course-path__resume-label font-kicker">Empieza aquí</span>
          <span className="course-path__resume-title">{firstLesson.title}</span>
        </span>
        <span className="course-path__resume-action">Comenzar lección</span>
        <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }

  if (hasProgress && currentLesson) {
    return (
      <Link href={studyLessonPath(levelId, currentLesson.number)} className="course-path__resume">
        <span className="course-path__resume-body">
          <span className="course-path__resume-label font-kicker">Tu siguiente lección</span>
          <span className="course-path__resume-title">{currentLesson.title}</span>
        </span>
        <span className="course-path__resume-action">Continuar lección</span>
        <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }

  return null;
}
