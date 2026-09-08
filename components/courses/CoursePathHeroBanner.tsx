/*
 * Planned subcomponents:
 * - CoursePathHeroBanner (featured hero lesson banner card)
 *   - HeroHeader (CEFR level and category kicker)
 *   - HeroContent (lesson title and pedagogical summary)
 *   - HeroProgress (track, unit completed count and duration)
 *   - HeroAction (pill CTA button "Continuar ->" / "Comenzar ->")
 *   - CourseHeroIllustration (stylized London Big Ben vector scene)
 */

import Link from "next/link";
import { ArrowRight, Timer } from "@/components/icons";
import CourseHeroIllustration from "@/components/courses/CourseHeroIllustration";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import type { CoursePathLesson, CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathHeroBannerProps {
  levelId: CoursePathTrackId;
  levelTitle?: string;
  levelSpineLabel?: string;
  firstLesson?: CoursePathLesson;
  currentLesson?: CoursePathLesson;
  hasProgress: boolean;
  unitCompletedCount?: number;
  unitTotalCount?: number;
}

export default function CoursePathHeroBanner({
  levelId,
  levelTitle,
  levelSpineLabel,
  firstLesson,
  currentLesson,
  hasProgress,
  unitCompletedCount,
  unitTotalCount,
}: CoursePathHeroBannerProps) {
  const lesson = hasProgress && currentLesson ? currentLesson : firstLesson;
  if (!lesson) return null;

  const spine = (levelSpineLabel ?? levelId).toUpperCase();
  const categoryRaw = levelTitle
    ? levelTitle.replace(new RegExp(spine, "i"), "").trim()
    : "FUNDAMENTOS";
  const category = categoryRaw.length > 0 ? categoryRaw.toUpperCase() : "FUNDAMENTOS";
  const kicker = `${spine} · ${category}`;

  const actionText = !hasProgress ? "Comenzar" : "Continuar";
  const href = studyLessonPath(levelId, lesson.number);

  const total = unitTotalCount ?? 6;
  const completed = unitCompletedCount ?? (hasProgress ? Math.max(1, lesson.number - 1) : 0);
  const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const duration = lesson.duration ?? "6 min";

  const description =
    lesson.description ??
    (lesson.keywords
      ? `Aprende y practica: ${lesson.keywords}`
      : "Aprende a comunicarte y a formar tus primeras frases en inglés.");

  return (
    <Link
      href={href}
      className="course-path__hero-banner group"
      aria-label={`${actionText}: ${lesson.title}`}
    >
      <div className="course-path__hero-content">
        <span className="course-path__hero-kicker">{kicker}</span>
        <h2 className="course-path__hero-title">{lesson.title}</h2>
        <p className="course-path__hero-desc">{description}</p>

        <div className="course-path__hero-progress">
          <div
            className="course-path__hero-progress-track"
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`Progreso de unidad: ${completed} de ${total} completadas`}
          >
            <div
              className="course-path__hero-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="course-path__hero-progress-meta">
            <span>{`${completed} / ${total} completadas`}</span>
            <span className="course-path__hero-progress-duration">
              <Timer size={14} className="text-fg-muted" aria-hidden />
              <span>{duration}</span>
            </span>
          </div>
        </div>

        <div className="course-path__hero-action">
          <span className="course-path__hero-action-pill">
            <span>{actionText}</span>
            <ArrowRight size={16} aria-hidden />
          </span>
        </div>
      </div>

      <div className="course-path__hero-illustration-box" aria-hidden="true">
        <CourseHeroIllustration />
      </div>
    </Link>
  );
}
