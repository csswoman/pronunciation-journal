/*
 * Planned subcomponents:
 * - CoursePathPage (root course catalog layout)
 *   - CoursePathAutoLevelSync (background level router)
 *   - PageHeader (Aprender / Cursos title block)
 *   - CoursePathLevelPicker (CEFR level tabs with progress bars and counts)
 *   - CoursePathLevelPanel (units and electives)
 *   - CoursePathSearch & Aside (search, real-life scenarios, pronunciation link)
 */

import Link from "next/link";
import { ArrowRight, MicVocal } from "@/components/icons";
import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import CoursePathLevelPicker from "@/components/courses/CoursePathLevelPicker";
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import CoursePathSearch from "@/components/courses/CoursePathSearch";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import type { CefrLevelId } from "@/lib/courses/types";

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
    0
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
        <PageHeader
          kicker="Aprender"
          title="Cursos"
          subtitle="Lecciones de pronunciación, gramática, vocabulario y más, organizadas por nivel para que avances a tu ritmo."
        />
        <div className="course-path__wrap course-path__wrap--shell">
          <div className="course-path__desktop-layout">
            <main className="course-path__main">
              <CoursePathLevelPicker
                levels={COURSE_PATH_CURRICULUM.levels}
                selectedLevelId={selectedLevelId}
              />

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
              <CoursePathSearch />

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
