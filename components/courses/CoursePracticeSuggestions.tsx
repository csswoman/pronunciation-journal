import Link from "next/link";
import { RotateCcw } from "lucide-react";
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
  const allLessons = view.units.flatMap((unit) => unit.lessons);
  const done = allLessons.filter((lesson) => lesson.state === "done" && lesson.slug).slice(-2).reverse();

  if (done.length === 0) return null;

  return (
    <section className="course-path__practice-suggestions" aria-labelledby="course-review-heading">
      <div className="course-path__practice-heading">
        <h2 id="course-review-heading" className="course-path__practice-suggestions-heading">
          Para reforzar
        </h2>
        <p>Vuelve a una lección completada cuando quieras afianzarla.</p>
      </div>
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
    </section>
  );
}
