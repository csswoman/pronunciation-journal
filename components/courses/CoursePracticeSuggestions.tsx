// Planned structure:
// <CoursePracticeSuggestions>
//   <heading "Practica este nivel" />
//   <current lesson card (primary CTA)>
//   <done lessons list (up to 2, for review)>
// </CoursePracticeSuggestions>

import Link from "next/link";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { deriveLevelView } from "@/lib/courses/progress";
import { studyLessonPath } from "@/lib/courses/curriculumIndex";
import type { CoursePathLevel, CoursePathTrackId } from "@/lib/courses/types";

interface CoursePracticeSuggestionsProps {
  level: CoursePathLevel;
  levelId: CoursePathTrackId;
  completedIds: Set<string>;
}

export default function CoursePracticeSuggestions({
  level,
  levelId,
  completedIds,
}: CoursePracticeSuggestionsProps) {
  const view = deriveLevelView(level, completedIds);
  const allLessons = view.units.flatMap((u) => u.lessons);

  const current = allLessons.find((l) => l.state === "current" && l.slug);
  const done = allLessons
    .filter((l) => l.state === "done" && l.slug)
    .slice(-2)
    .reverse();

  if (!current && done.length === 0) return null;

  return (
    <section className="course-path__practice-suggestions" aria-label="Práctica sugerida">
      <h2 className="course-path__practice-suggestions-heading">Practica este nivel</h2>

      {current && (
        <Link
          href={studyLessonPath(levelId, current.number)}
          className="course-path__practice-current"
        >
          <span className="course-path__practice-current-icon" aria-hidden>
            <Play size={14} className="fill-current" />
          </span>
          <span className="course-path__practice-current-body">
            <span className="course-path__practice-current-label">Tu lección actual</span>
            <span className="course-path__practice-current-title">{current.title}</span>
          </span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}

      {done.length > 0 && (
        <div className="course-path__practice-review">
          <span className="course-path__practice-review-label">Repasar</span>
          <ul className="course-path__practice-review-list">
            {done.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={studyLessonPath(levelId, lesson.number)}
                  className="course-path__practice-review-item"
                >
                  <RotateCcw size={13} aria-hidden />
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
