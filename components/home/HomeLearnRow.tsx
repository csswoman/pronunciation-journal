// Planned structure:
// <HomeLearnRow>
//   <LearnChip /> (mini lesson)
//   <LearnChip /> (concept)
// </HomeLearnRow>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeLearnRowProps {
  lesson: MiniLesson | null;
  concept: LanguageConcept | null;
}

function LearnChip({
  kicker,
  title,
  href,
  description,
}: {
  kicker: string;
  title: string;
  href: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="home-card-lift focus-ring flex min-h-11 flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
    >
      <span className="font-kicker text-fg-muted">{kicker}</span>
      <span className="text-h4 text-balance text-fg">{title}</span>
      {description ? (
        <span className="font-body-sm text-pretty text-fg-muted line-clamp-2">{description}</span>
      ) : null}
      <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-label text-primary">
        Abrir <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

export default function HomeLearnRow({ lesson, concept }: HomeLearnRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {lesson ? (
        <LearnChip
          kicker="Mini lección"
          title={lesson.title}
          href={lesson.href || `/mini-lessons/${lesson.slug}`}
          description={lesson.subtitle}
        />
      ) : (
        <LearnChip
          kicker="Mini lección"
          title="Daily grammar bite"
          href="/mini-lessons"
          description="Short lessons on patterns you use every day."
        />
      )}
      {concept ? (
        <LearnChip
          kicker={concept.badge}
          title={concept.title}
          href={concept.href}
          description={concept.description}
        />
      ) : (
        <LearnChip
          kicker="Concepto"
          title="Irregular verbs"
          href="/words?tab=decks"
          description="Study deck: base · past · participle."
        />
      )}
    </div>
  );
}
