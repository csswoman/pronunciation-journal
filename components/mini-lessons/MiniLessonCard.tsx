import Link from "next/link";
import type { MiniLesson } from "@/lib/content/schemas";
import {
  MINI_LESSON_CATEGORY_LABELS,
  MINI_LESSON_LEVEL_LABELS,
} from "@/lib/content/mini-lesson-labels";

export function MiniLessonCard({ lesson }: { lesson: MiniLesson }) {
  return (
    <Link href={`/mini-lessons/${lesson.slug}`} className="mini-lessons__card">
      <div className="mini-lessons__card-top">
        <div className="mini-lessons__card-meta">
          <span className="mini-lessons__pill mini-lessons__pill--level">
            {MINI_LESSON_LEVEL_LABELS[lesson.level]}
          </span>
          <span className="mini-lessons__pill mini-lessons__pill--category">
            {MINI_LESSON_CATEGORY_LABELS[lesson.category]}
          </span>
        </div>
        <span className="mini-lessons__card-duration">{lesson.duration} min</span>
      </div>

      <h2 className="mini-lessons__card-title">{lesson.title}</h2>
      <p className="mini-lessons__card-body">{lesson.body}</p>

      <div className="mini-lessons__card-foot">
        <span>{lesson.subtitle}</span>
        <span className="mini-lessons__card-arrow" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
