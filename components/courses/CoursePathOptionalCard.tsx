"use client";

/*
 * Planned subcomponents:
 * - CoursePathOptionalCard (collapsible card for optional course units)
 *   - BookOpen icon box
 *   - Title & meta (lesson count, completion state, OPCIONAL badge)
 *   - ChevronRight icon
 *   - CoursePathLessonRow list
 */

import { BookOpen, ChevronRight } from "@/components/icons";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import type { DerivedUnitView } from "@/lib/courses/progress";
import type { CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathOptionalCardProps {
  unit: DerivedUnitView;
  levelId: CoursePathTrackId;
  isOpen: boolean;
  onToggle: (id: string, open: boolean) => void;
  downloadedIds: Set<string>;
}

export default function CoursePathOptionalCard({
  unit,
  levelId,
  isOpen,
  onToggle,
  downloadedIds,
}: CoursePathOptionalCardProps) {
  const optId = `${unit.unit.id}-optional-card`;
  const totalCount = unit.unit.lessons.length;
  const completedCount = unit.lessons.filter((lesson) => lesson.state === "done").length;

  return (
    <details
      className="course-path__optional-card"
      open={isOpen}
      onToggle={(e) => onToggle(optId, e.currentTarget.open)}
    >
      <summary className="course-path__optional-summary">
        <div className="course-path__optional-icon-box" aria-hidden="true">
          <BookOpen size={20} className="course-path__optional-icon" />
        </div>
        <div className="course-path__optional-heading">
          <span className="course-path__optional-title">{unit.unit.title}</span>
          <span className="course-path__optional-meta">
            {totalCount} {totalCount === 1 ? "lección" : "lecciones"} ·{" "}
            {completedCount === totalCount && totalCount > 0
              ? "completado"
              : completedCount > 0
                ? `${completedCount} de ${totalCount}`
                : "sin empezar"}{" "}
            <span className="course-path__optional-badge">OPCIONAL</span>
          </span>
        </div>
        <ChevronRight className="course-path__optional-chevron" size={16} aria-hidden />
      </summary>

      <div className="course-path__optional-body">
        {unit.lessons.map((lesson) => (
          <CoursePathLessonRow
            key={`${unit.unit.id}-${lesson.id}`}
            lesson={lesson}
            levelId={levelId}
            isDownloaded={downloadedIds.has(`${levelId}:${lesson.number}`)}
          />
        ))}
      </div>
    </details>
  );
}
