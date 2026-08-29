import Link from "next/link";
import Card from "@/components/layout/Card";
import Badge from "@/components/ui/Badge";
import type { MiniLesson } from "@/lib/content/schemas";
import { MINI_LESSON_LEVEL_LABELS } from "@/lib/content/mini-lesson-labels";

export function MiniLessonCard({ lesson }: { lesson: MiniLesson }) {
  const hasIpa =
    lesson.category === "pronunciation" || lesson.examples?.some((e) => Boolean(e.ipa));
  const hasExamples = lesson.examples && lesson.examples.length > 0;

  return (
    <Link href={`/mini-lessons/${lesson.slug}`} className="group block h-full no-underline">
      <Card variant="interactive" className="flex flex-col h-full gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge label={MINI_LESSON_LEVEL_LABELS[lesson.level]} variant="default" />
            {hasIpa && <Badge label="IPA" variant="info" />}
            {hasExamples && <Badge label="Ejercicios" variant="success" />}
          </div>
        </div>

        <h2 className="text-h4 font-semibold text-fg group-hover:text-primary transition-colors">
          {lesson.title}
        </h2>
        <p className="text-body-sm text-fg-muted line-clamp-3 leading-relaxed">
          {lesson.body}
        </p>

        <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-caption text-fg-subtle">
          <span>
            {lesson.duration} min • {lesson.subtitle}
          </span>
          <span
            className="text-primary font-bold group-hover:translate-x-1 transition-transform"
            aria-hidden
          >
            →
          </span>
        </div>
      </Card>
    </Link>
  );
}
