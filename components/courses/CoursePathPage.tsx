import Link from "next/link";
import { ArrowRight, MicVocal } from "@/components/icons";
import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import PageLayout from "@/components/layout/PageLayout";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import type { CefrLevelId } from "@/lib/courses/types";
import { cn } from "@/lib/cn";

const DEFAULT_LEVEL: CefrLevelId = "a1";

interface CoursePathPageProps {
  levelParam?: string;
}

export default function CoursePathPage({ levelParam }: CoursePathPageProps) {
  const requestedLevel = parseCefrLevelId(levelParam);
  const selectedLevelId = requestedLevel ?? DEFAULT_LEVEL;
  const hasExplicitLevel = requestedLevel !== null;
  const selectedLevel =
    COURSE_PATH_CURRICULUM.levels.find((level) => level.id === selectedLevelId) ??
    COURSE_PATH_CURRICULUM.levels[0];
  const selectedLevelLessonCount = selectedLevel.units.reduce(
    (total, unit) => total + unit.lessons.length,
    0,
  );

  return (
    <div className="course-path">
      <CoursePathAutoLevelSync
        hasExplicitLevel={hasExplicitLevel}
        levels={COURSE_PATH_CURRICULUM.levels.map((level) => ({
          id: level.id as CefrLevelId,
          lessonIds: level.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
        }))}
      />
      <PageLayout archetype="catalog">
        <div className="course-path__wrap course-path__wrap--shell">
          <div className="course-path__desktop-layout">
            <main className="course-path__main">
              <section className="course-path__level-picker" aria-labelledby="course-level-picker-title">
                <div className="course-path__level-picker-head">
                  <h2 id="course-level-picker-title" className="course-path__level-picker-title">
                    Nivel
                  </h2>
                  <div className="course-path__level-picker-actions">
                    <Link href="/assessment" className="course-path__text-link">
                      Prueba de nivel
                    </Link>
                    <Link
                      href={`/assessment?mode=checkpoint&level=${selectedLevelId}`}
                      className="course-path__text-link"
                    >
                      Comprobar nivel
                    </Link>
                  </div>
                </div>
                <nav className="course-path__spine" aria-label="Niveles del curso">
                  {COURSE_PATH_CURRICULUM.levels.map((level) => {
                    const isActive = level.id === selectedLevelId;
                    const href = level.id === DEFAULT_LEVEL ? "/courses" : `/courses?level=${level.id}`;

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
              </section>

              <section
                id={`course-level-${selectedLevel.id}`}
                className="course-path__panel-enter course-path__panel-enter--selected"
                aria-label={`Curso: ${selectedLevel.title}`}
              >
                <CoursePathLevelPanel
                  level={selectedLevel}
                  electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
                />
              </section>
            </main>

            <aside className="course-path__aside" aria-label="Contexto del nivel">
              {selectedLevel.realLife && selectedLevel.realLife.length > 0 && (
                <CoursePathRealLife scenarios={selectedLevel.realLife} />
              )}

              <section className="course-path__aside-section" aria-label="Resumen del nivel">
                <div className="course-path__aside-heading">
                  <h3 className="course-path__aside-title course-path__aside-title--small">
                    Este nivel
                  </h3>
                  <span className="course-path__aside-level">{selectedLevel.spineLabel}</span>
                </div>
                <dl className="course-path__aside-facts">
                  <div>
                    <dt>Duración</dt>
                    <dd>{selectedLevel.hours ?? "A tu ritmo"}</dd>
                  </div>
                  <div>
                    <dt>Lecciones</dt>
                    <dd>{selectedLevelLessonCount}</dd>
                  </div>
                </dl>
              </section>

              <section className="course-path__aside-section" aria-label="Pronunciación">
                <p className="course-path__aside-kicker">Pronunciación</p>
                <Link href="/courses/pronunciation" className="course-path__aside-link">
                  <MicVocal size={16} aria-hidden />
                  Ruta de pronunciación
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}
