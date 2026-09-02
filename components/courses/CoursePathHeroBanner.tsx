/*
 * Planned subcomponents:
 * - CoursePathHeroBanner (featured hero lesson banner)
 *   - HeroIconBox (avatar / user icon container)
 *   - HeroContent (kicker + lesson title)
 *   - HeroAction (Comenzar lección -> link button)
 */

import Link from "next/link";
import { ArrowRight, User } from "@/components/icons";
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
  const lesson = hasProgress && currentLesson ? currentLesson : firstLesson;
  if (!lesson) return null;

  const label = !hasProgress ? "EMPIEZA AQUÍ" : "TU SIGUIENTE LECCIÓN";
  const actionText = !hasProgress ? "Comenzar lección" : "Continuar lección";
  const href = studyLessonPath(levelId, lesson.number);

  return (
    <Link href={href} className="course-path__hero-banner">
      <div className="course-path__hero-icon-box" aria-hidden="true">
        <User size={22} className="course-path__hero-icon" />
      </div>
      <div className="course-path__hero-content">
        <span className="course-path__hero-kicker">{label}</span>
        <h2 className="course-path__hero-title">{lesson.title}</h2>
      </div>
      <div className="course-path__hero-action" aria-hidden="true">
        <span className="course-path__hero-action-text">{actionText}</span>
        <span className="course-path__hero-action-icon">
          <ArrowRight size={16} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
