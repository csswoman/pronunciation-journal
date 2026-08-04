// Planned structure:
// <HomeLearnRow>
//   <LearnChip /> × 1–2 real mini-lessons
//   OR explore fallback when none exist
// </HomeLearnRow>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { LessonCategory, LessonLevel, MiniLesson } from "@/lib/content/schemas";
import { cn } from "@/lib/cn";

interface HomeLearnRowProps {
  primary: MiniLesson | null;
  secondary?: MiniLesson | null;
  /** Single-column chip for the home aside (balances the right column). */
  compact?: boolean;
}

const CATEGORY_ES: Record<LessonCategory, string> = {
  pronunciation: "Pronunciación",
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  listening: "Comprensión",
  speaking: "Expresión oral",
  writing: "Escritura",
  idioms: "Expresiones",
  collocations: "Colocaciones",
};

const LEVEL_SHORT: Record<LessonLevel, string> = {
  basic: "A2",
  intermediate: "B1",
  advanced: "C1",
};

function categoryLabel(category: LessonCategory): string {
  return CATEGORY_ES[category] ?? "Mini lección";
}

/** Decision helper — duration + level, not a kicker echo. */
function lessonMeta(lesson: MiniLesson): string {
  return `${lesson.duration} min · ${LEVEL_SHORT[lesson.level]}`;
}

function LearnChip({
  lesson,
  title,
}: {
  lesson: MiniLesson;
  title: string;
}) {
  return (
    <Link
      href={`/mini-lessons/${lesson.slug}`}
      className="focus-ring group flex h-full flex-col gap-1.5 rounded-xl border border-border-subtle bg-transparent px-4 py-3 transition-colors hover:bg-surface-raised"
    >
      <span className="font-label text-fg">{title}</span>
      <span className="font-body-sm text-balance text-fg-muted">{lesson.title}</span>
      <span className="font-caption text-pretty text-fg-subtle">
        {lessonMeta(lesson)}
      </span>
      <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
        Abrir lección <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

/** Footer learn cards — one or two real mini-lessons from public/mini-lessons. */
export default function HomeLearnRow({
  primary,
  secondary = null,
  compact = false,
}: HomeLearnRowProps) {
  if (!primary && !secondary) {
    return (
      <Link
        href="/mini-lessons"
        className="focus-ring group flex h-full flex-col gap-1.5 rounded-xl border border-border-subtle bg-transparent px-4 py-3 transition-colors hover:bg-surface-raised"
      >
        <span className="font-label text-fg">Mini lecciones</span>
        <span className="font-body-sm text-fg-muted">
          Gramática, pronunciación y vocabulario del día.
        </span>
        <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
          Explorar lecciones <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full gap-3",
        compact || !secondary ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {primary ? (
        <LearnChip
          lesson={primary}
          title={compact ? categoryLabel(primary.category) : "Mini lección"}
        />
      ) : null}
      {secondary ? (
        <LearnChip
          lesson={secondary}
          title={categoryLabel(secondary.category)}
        />
      ) : null}
    </div>
  );
}
