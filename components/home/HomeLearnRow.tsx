// Planned structure:
// <HomeLearnRow>
//   <LearnChip /> × 1–2 real mini-lessons
//   OR explore fallback when none exist
// </HomeLearnRow>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { LessonCategory, MiniLesson } from "@/lib/content/schemas";

interface HomeLearnRowProps {
  primary: MiniLesson | null;
  secondary?: MiniLesson | null;
}

const CATEGORY_ES: Record<LessonCategory, string> = {
  pronunciation: "Pronunciación",
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  listening: "Comprensión",
  speaking: "Speaking",
  writing: "Escritura",
  idioms: "Expresiones",
  collocations: "Collocations",
};

function categoryLabel(category: LessonCategory): string {
  return CATEGORY_ES[category] ?? "Mini lección";
}

function LearnChip({
  lesson,
  kicker,
}: {
  lesson: MiniLesson;
  kicker: string;
}) {
  return (
    <Link
      href={`/mini-lessons/${lesson.slug}`}
      className="home-card-lift focus-ring flex h-full flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
    >
      <span className="font-kicker text-fg-muted">{kicker}</span>
      <span className="text-h4 text-balance text-fg">{lesson.title}</span>
      {lesson.subtitle || lesson.body ? (
        <span className="font-body-sm text-pretty text-fg-muted line-clamp-2">
          {lesson.subtitle || lesson.body}
        </span>
      ) : null}
      <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-label text-primary">
        Abrir <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

/** Footer learn cards — one or two real mini-lessons from public/mini-lessons. */
export default function HomeLearnRow({
  primary,
  secondary = null,
}: HomeLearnRowProps) {
  if (!primary && !secondary) {
    return (
      <Link
        href="/mini-lessons"
        className="home-card-lift focus-ring flex h-full flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
      >
        <span className="font-kicker text-fg-muted">Mini lecciones</span>
        <span className="text-h4 text-fg">Explorar lecciones</span>
        <span className="font-body-sm text-fg-muted">
          Gramática, pronunciación y vocabulario del día.
        </span>
        <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-label text-primary">
          Abrir <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2">
      {primary ? (
        <LearnChip lesson={primary} kicker="Mini lección del día" />
      ) : null}
      {secondary ? (
        <LearnChip
          lesson={secondary}
          kicker={categoryLabel(secondary.category)}
        />
      ) : null}
    </div>
  );
}
