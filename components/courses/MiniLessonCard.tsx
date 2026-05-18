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
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-base text-fg leading-snug">{lesson.title}</p>
        <Badge label={level.label} color={level.color} />
      </div>

      {/* Description */}
      <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">{lesson.body}</p>

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
