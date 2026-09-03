/*
 * Planned subcomponents:
 * - CoursePathPage (root course catalog layout)
 *   - CoursePathAutoLevelSync (background level router)
 *   - PageHeader (Aprender / Cursos title block)
 *   - CoursePathLevelPicker (CEFR level tabs with progress bars and counts)
 *   - CoursePathSearch (level search bar)
 *   - CoursePathLevelPanel (units, inline achievement block and aside progress)
 */

import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import CoursePathLevelPicker from "@/components/courses/CoursePathLevelPicker";
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
          title="Cursos"
          subtitle="Lecciones de pronunciación, gramática, vocabulario y más, organizadas por nivel para que avances a tu ritmo."
        />
        <div className="course-path__wrap course-path__wrap--shell">
          <CoursePathLevelPicker
            levels={COURSE_PATH_CURRICULUM.levels}
            selectedLevelId={selectedLevelId}
          />

          <div className="course-path__main-search mb-4">
            <CoursePathSearch />
          </div>

          <section
            key={selectedLevel.id}
            id={`course-level-${selectedLevel.id}`}
            className="course-path__panel-enter course-path__panel-enter--selected"
            aria-label={`Curso: ${selectedLevel.title}`}
          >
            <CoursePathLevelPanel
              level={selectedLevel}
              electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
            />
          </section>
        </div>
      </PageLayout>
    </div>
  );
}
