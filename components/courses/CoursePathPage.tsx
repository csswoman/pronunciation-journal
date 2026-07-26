import Link from "next/link";
import { ArrowRight, MicVocal } from "@/components/icons";
import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import { CoursePathLegendIconDisplay } from "@/components/courses/CoursePathIcons";
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
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
      <PageLayout>
        <div className="course-path__wrap course-path__wrap--shell">
          <div className="course-path__orientation">
            <PageHeader
              className="course-path__page-header"
              kicker="Curso"
              title="Ruta de aprendizaje"
              subtitle="Avanza por lecciones prácticas y entrena la pronunciación en Sound Lab."
            />
            <div className="course-path__assessment-links">
              <span className="course-path__assessment-prompt">¿No sabes tu nivel?</span>
              <Link href="/assessment">Haz la prueba</Link>
              <span aria-hidden className="course-path__assessment-sep">
                ·
              </span>
              <Link href="/courses/pronunciation">Ruta de pronunciación</Link>
            </div>
          </div>

          <div className="course-path__desktop-layout">
            <main className="course-path__main">
              <section className="course-path__level-picker" aria-labelledby="course-level-picker-title">
                <div className="course-path__level-picker-head">
                  <div>
                    <p className="course-path__level-picker-kicker">Tu nivel</p>
                    <h2 id="course-level-picker-title" className="course-path__level-picker-title">
                      Nivel de inicio
                    </h2>
                  </div>
                  <Link
                    href={`/assessment?mode=checkpoint&level=${selectedLevelId}`}
                    className="course-path__checkpoint-link"
                  >
                    Comprobar este nivel
                  </Link>
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

              <details className="course-path__legend-disclosure">
                <summary className="course-path__legend-summary">Cómo leer la ruta</summary>
                <div className="course-path__legend" role="list" aria-label="Qué significan los iconos">
                  {COURSE_PATH_CURRICULUM.legend.map((item) => (
                    <div key={item.icon} className="course-path__lg" role="listitem">
                      <CoursePathLegendIconDisplay icon={item.icon} />
                      <span>{item.description}</span>
                    </div>
                  ))}
                </div>
              </details>
            </main>

            <aside className="course-path__aside" aria-label="Contexto del nivel">
              {selectedLevel.realLife && selectedLevel.realLife.length > 0 && (
                <CoursePathRealLife scenarios={selectedLevel.realLife} />
              )}

              <section className="course-path__aside-section course-path__aside-section--intro">
                <div className="course-path__aside-heading">
                  <p className="course-path__aside-kicker">Resumen del nivel</p>
                  <span className="course-path__aside-level">{selectedLevel.spineLabel}</span>
                </div>
                <dl className="course-path__aside-facts">
                  <div>
                    <dt>Duración estimada</dt>
                    <dd>{selectedLevel.hours ?? "A tu ritmo"}</dd>
                  </div>
                  <div>
                    <dt>Lecciones</dt>
                    <dd>{selectedLevelLessonCount}</dd>
                  </div>
                </dl>
                <div className="course-path__aside-pronunciation">
                  <div>
                    <p className="course-path__aside-kicker">Pronunciación</p>
                    <p className="course-path__aside-copy">
                      Sigue una ruta de sonidos a frases, o entrena contrastes en Sound Lab.
                    </p>
                  </div>
                  <Link href="/courses/pronunciation" className="course-path__aside-link">
                    <MicVocal size={16} aria-hidden />
                    Abrir ruta de pronunciación
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                  <Link href="/practice/sounds" className="course-path__aside-link">
                    Abrir Sound Lab
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              </section>
            </aside>
          </div>

          <details className="course-path__why">
            <summary className="course-path__why-summary">
              <span>{COURSE_PATH_CURRICULUM.why.title}</span>
            </summary>
            <div className="course-path__why-body">
              {COURSE_PATH_CURRICULUM.why.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </details>

      </div>
      </PageLayout>
    </div>
  );
}
