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
import { KoboyoSlot } from "@/components/illustrations/KoboyoSlot";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import type { CoursePathLesson, CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathHeroBannerProps {
  levelId: CoursePathTrackId;
  trackId?: CoursePathTrackId;
  levelTitle?: string;
  levelSpineLabel?: string;
  firstLesson?: CoursePathLesson;
  currentLesson?: CoursePathLesson;
  hasProgress: boolean;
  unitCompletedCount?: number;
  unitTotalCount?: number;
}

function getHeroIllustrationName(levelId: string): string {
  const normalized = levelId.toLowerCase();
  if (normalized === "a1") return "pupil reading aloud";
  if (normalized === "a2") return "practising a skill";
  if (normalized === "b1") return "teaching a friend";
  if (normalized === "b2") return "writing in a notebook";
  if (normalized === "c1") return "adult learning a language";
  if (normalized === "c2") return "professional english";
  if (normalized === "opcionales" || normalized.includes("elective")) return "adult learning a language";
  return "pupil reading aloud";
}

export default function CoursePathHeroBanner({
  levelId,
  trackId,
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
    : "Fundamentos";
  const category = categoryRaw.length > 0 ? categoryRaw : "Fundamentos";

  const actionText = !hasProgress ? "Comenzar" : "Continuar";
  const href = studyLessonPath(trackId ?? levelId, lesson.number);

  const total = unitTotalCount ?? 28;
  const completed = unitCompletedCount ?? (hasProgress ? Math.max(1, lesson.number - 1) : 0);
  const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const duration = lesson.duration ?? "5 min";
  const illustrationName = getHeroIllustrationName(levelId);

  const description =
    lesson.description ??
    (lesson.keywords
      ? `Aprende y practica: ${lesson.keywords.replace(/,/g, " ·")}`
      : "Aprende y practica: estrategias · hábitos · estudio");

  return (
    <Link
      href={href}
      className="course-path__hero-banner group"
      aria-label={`${actionText}: ${lesson.title}`}
    >
      <div className="course-path__hero-content">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-[var(--ink)] text-white font-bold px-3.5 py-1 rounded-full text-xs tracking-wide">
            {spine}
          </span>
          <span className="border border-[var(--ink)] text-[var(--ink)] px-3.5 py-1 rounded-full text-xs font-semibold">
            {category}
          </span>
        </div>

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
              <Timer size={14} className="text-[var(--ink)]/80" aria-hidden />
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
        <KoboyoSlot name={illustrationName} variant="closing" className="w-44 h-44 sm:w-56 sm:h-56 select-none" />
      </div>
    </Link>
  );
}
