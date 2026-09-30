/*
 * Planned subcomponents:
 * - CoursePathPage (root course catalog layout)
 *   - CoursePathAutoLevelSync (background level router)
 *   - PageHeader (Aprender / Cursos title block)
 *   - CoursePathLevelPicker (CEFR level and optional tabs with progress bars and counts)
 *   - CoursePathSearch (level search bar)
 *   - CoursePathLevelPanel (units, inline achievement block and aside progress)
 */

import CoursePathAutoLevelSync from "@/components/courses/CoursePathAutoLevelSync";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import CoursePathLevelPicker from "@/components/courses/CoursePathLevelPicker";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import type { CefrLevelId, CoursePathLevel } from "@/lib/courses/types";

import type { ImmersionLesson } from "@/lib/immersion/types";

const DEFAULT_LEVEL: CefrLevelId = "a1";

const OPTIONAL_LEVEL: CoursePathLevel = {
  id: "opcionales",
  spineLabel: "Opcionales",
  spineSubtitle: "Rutas y temas",
  title: "Temas opcionales",
  description: "Rutas especializadas y temas opcionales para profundizar tu aprendizaje.",
  units: COURSE_PATH_CURRICULUM.electiveTracks.flatMap((t) => t.units),
};

interface CoursePathPageProps {
  levelParam?: string;
  topicImmersionMap?: Record<string, ImmersionLesson>;
}

export default function CoursePathPage({ levelParam, topicImmersionMap }: CoursePathPageProps) {
  const isOptionalView =
    levelParam === "opcionales" ||
    levelParam === "electivas" ||
    levelParam === "optional" ||
    COURSE_PATH_CURRICULUM.electiveTracks.some((track) => track.id === levelParam);

  const requestedLevel = parseCefrLevelId(levelParam);
  const selectedLevelId = isOptionalView ? "opcionales" : (requestedLevel ?? DEFAULT_LEVEL);
  const hasExplicitLevel = requestedLevel !== null || isOptionalView;
  const selectedLevel = isOptionalView
    ? OPTIONAL_LEVEL
    : (COURSE_PATH_CURRICULUM.levels.find((level) => level.id === selectedLevelId) ??
       COURSE_PATH_CURRICULUM.levels[0]);

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
          subtitle="Organizados por nivel, a tu ritmo."
          actions={
            <CoursePathLevelPicker
              levels={COURSE_PATH_CURRICULUM.levels}
              electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
              selectedLevelId={selectedLevelId}
            />
          }
        />

        <div className="course-path__wrap course-path__wrap--shell">
          <section
            key={selectedLevel.id}
            id={`course-level-${selectedLevel.id}`}
            className="course-path__panel-enter course-path__panel-enter--selected"
            aria-label={`Curso: ${selectedLevel.title}`}
          >
            <CoursePathLevelPanel
              level={selectedLevel}
              compactHead
              electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
              topicImmersionMap={topicImmersionMap}
            />
          </section>
        </div>
      </PageLayout>
    </div>
  );
}
