import Link from "next/link";
import { ArrowRight, MicVocal } from "lucide-react";
import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import { CoursePathLegendIconDisplay } from "@/components/courses/CoursePathIcons";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import type { CefrLevelId } from "@/lib/courses/types";
import { cn } from "@/lib/cn";

const DEFAULT_LEVEL: CefrLevelId = "a1";

interface CoursePathPageProps {
  levelParam?: string;
}

export default function CoursePathPage({ levelParam }: CoursePathPageProps) {
  const selectedLevelId = parseCefrLevelId(levelParam) ?? DEFAULT_LEVEL;
  const hasExplicitLevel = parseCefrLevelId(levelParam) !== null;
  const selectedLevel =
    COURSE_PATH_CURRICULUM.levels.find((level) => level.id === selectedLevelId) ??
    COURSE_PATH_CURRICULUM.levels[0];

  return (
    <div className="course-path">
      <CoursePathAutoLevelSync
        hasExplicitLevel={hasExplicitLevel}
        levels={COURSE_PATH_CURRICULUM.levels.map((level) => ({
          id: level.id as CefrLevelId,
          lessonIds: level.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
        }))}
      />
      <div className="course-path__wrap">
        <header className="course-path__hero">
          <h1 className="course-path__title">Tu ruta de inglés</h1>
          <p className="course-path__intro">
            Elige tu nivel y avanza por lo esencial. Las lecciones con estrella van primero;
            el resto profundiza cuando tengas ganas. La pronunciación corre en paralelo en Sound Lab.
          </p>
        </header>

        <nav className="course-path__spine" aria-label="CEFR level">
          {COURSE_PATH_CURRICULUM.levels.map((level) => {
            const isActive = level.id === selectedLevelId;
            const href =
              level.id === DEFAULT_LEVEL
                ? "/courses#course-level-a1"
                : `/courses?level=${level.id}#course-level-${level.id}`;

            return (
              <Link
                key={level.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn("course-path__level", isActive && "course-path__level--on")}
              >
                <div className="course-path__level-lv">{level.spineLabel}</div>
              </Link>
            );
          })}
        </nav>

        <section
          id={`course-level-${selectedLevel.id}`}
          className="course-path__panel-enter course-path__panel-enter--selected"
          aria-label={selectedLevel.title}
        >
          <CoursePathLevelPanel
            level={selectedLevel}
            electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
          />
        </section>

        <details className="course-path__why" open>
          <summary className="course-path__why-summary">
            <span>{COURSE_PATH_CURRICULUM.why.title}</span>
          </summary>
          <div className="course-path__why-body">
            {COURSE_PATH_CURRICULUM.why.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <Link href="/practice/sounds" className="course-path__sound-lab-cta">
              <MicVocal size={16} strokeWidth={2} aria-hidden />
              Ir a Sound Lab
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </details>

        <div className="course-path__legend" role="list" aria-label="Icon legend">
          {COURSE_PATH_CURRICULUM.legend.map((item) => (
            <div key={item.icon} className="course-path__lg" role="listitem">
              <CoursePathLegendIconDisplay icon={item.icon} />
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
