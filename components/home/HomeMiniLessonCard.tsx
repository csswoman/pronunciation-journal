import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeMiniLessonCardProps {
  lesson: MiniLesson;
}

export default function HomeMiniLessonCard({ lesson }: HomeMiniLessonCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <p className="text-xs text-[var(--text-tertiary)]">
        {lesson.duration} min · {lesson.subtitle}
      </p>

      <h4
        className="text-lg font-medium leading-snug text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {lesson.title}
      </h4>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
        {lesson.body}
      </p>

      <Link href={`/mini-lessons/${lesson.slug}`} className="mt-auto">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          icon={<ArrowRight size={14} />}
          iconPosition="right"
          className="justify-center"
        >
          Read lesson
        </Button>
      </Link>
    </div>
  );
}
