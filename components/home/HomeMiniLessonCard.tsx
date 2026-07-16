import Link from "next/link";
import { ArrowRight, BookOpen } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeMiniLessonCardProps {
  lesson: MiniLesson;
}

export default function HomeMiniLessonCard({ lesson }: HomeMiniLessonCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <span className="flex items-center gap-2.5">
        <span className="icon-wrap-hue grid h-9 w-9 shrink-0 place-items-center rounded-lg text-primary">
          <BookOpen size={18} aria-hidden />
        </span>
        <p className="font-kicker text-fg-muted">
          {lesson.duration} min · {lesson.subtitle}
        </p>
      </span>

      <h4 className="text-h4 text-balance text-fg">
        {lesson.title}
      </h4>

      <p className="font-body-sm line-clamp-3 text-pretty leading-relaxed text-fg-muted">
        {lesson.body}
      </p>

      <Link href={`/mini-lessons/${lesson.slug}`} className="mt-auto">
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<ArrowRight size={18} />}
          iconPosition="right"
          className="justify-center"
        >
          Read lesson
        </Button>
      </Link>
    </div>
  );
}
