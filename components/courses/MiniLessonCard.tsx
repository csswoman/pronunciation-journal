// Planned structure:
// <MiniLessonCard>
//   <CardHeader />   — label + duration + level badge
//   <CardBody />     — title, description, examples, tip
//   <CardFooter />   — "Read full lesson →"
// </MiniLessonCard>

import Link from "next/link";
import type { MiniLesson } from "@/lib/mini-lessons";
import Badge, { BadgeColor } from "@/components/ui/Badge";

const levelBadge: Record<string, { label: string; color: BadgeColor }> = {
  basic:        { label: "Basic",        color: "emerald" },
  intermediate: { label: "Intermediate", color: "amber"   },
  advanced:     { label: "Advanced",     color: "red"     },
};

export default function MiniLessonCard({ lesson }: { lesson: MiniLesson }) {
  const level = levelBadge[lesson.level] ?? levelBadge.basic;

  return (
    <Link
      href={`/courses/mini-lessons/${lesson.slug}`}
      className="group flex flex-col h-full w-full rounded-xl border border-border-subtle bg-surface-raised p-4 gap-3 transition-all duration-200 hover:border-border-default hover:-translate-y-px"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          {lesson.subtitle}
          <span className="font-normal text-fg-subtle normal-case tracking-normal">
            {" "}· {lesson.duration} min
          </span>
        </p>
        <Badge label={level.label} color={level.color} />
      </div>

      {/* Title */}
      <p className="font-bold text-base text-fg leading-snug">{lesson.title}</p>

      {/* Body */}
      <p className="text-sm text-fg-muted leading-relaxed">{lesson.body}</p>

      {/* Examples */}
      {lesson.examples.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {lesson.examples.map((ex, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-fg">{ex.word}</span>
              {ex.ipa && (
                <span className="font-mono text-xs text-primary">{ex.ipa}</span>
              )}
              {ex.translation && (
                <span className="text-xs italic text-fg-subtle">{ex.translation}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Tip */}
      {lesson.tip && (
        <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2">
          <span className="text-base leading-none mt-px shrink-0">💡</span>
          <p className="text-xs text-fg-muted leading-relaxed">{lesson.tip}</p>
        </div>
      )}

      {/* Footer */}
      <span
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition-all duration-150 group-hover:gap-1.5"
      >
        Read full lesson
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
