import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import CoursePathProgressClient from "@/components/courses/CoursePathProgressClient";
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import { deriveLevelView } from "@/lib/courses/progress";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  electiveTracks?: CoursePathLevel[];
}

export default function CoursePathLevelPanel({ level, compactHead, electiveTracks }: CoursePathLevelPanelProps) {
  const derived = deriveLevelView(level, new Set());

  return (
    <>
      <CoursePathProgressClient level={level} compactHead={compactHead} />

      <div className="course-path__units">
        {derived.units.map((unit) => (
          <details
            key={unit.unit.id}
            className="course-path__unit course-path__unit--active"
            open={unit.defaultOpen}
          >
            <summary className="course-path__urow">
              <div className="course-path__ring" style={{ "--p": 0 } as React.CSSProperties} role="img" aria-label="0% complete">
                <div className="course-path__ring-inner" aria-hidden>0%</div>
              </div>
              <div className="course-path__uinfo">
                <div className="course-path__un">{unit.unit.label}</div>
                <div className="course-path__ut">{unit.unit.title}</div>
                <div className="course-path__um">
                  0 / {unit.unit.lessons.length} completadas
                  {unit.unit.isOptionalSection && (
                    <span className="course-path__optional-tag">Extra</span>
                  )}
                </div>
              </div>
            </summary>

            <div className="course-path__lessons" role="region" aria-label={unit.unit.title}>
              <div>
                {unit.lessons.map((lesson) => (
                  <CoursePathLessonRow key={lesson.id} lesson={lesson} levelId={level.id} />
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      {level.realLife && level.realLife.length > 0 && (
        <CoursePathRealLife scenarios={level.realLife} />
      )}
      {level.id === "c1" && electiveTracks && electiveTracks.length > 0 && (
        <CoursePathC1Electives tracks={electiveTracks} />
      )}
    </>
  );
}
