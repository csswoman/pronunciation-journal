// Planned structure:
// <MiniLessonCard>
//   <TopAccentBar />
//   <CardHeader>
//     <CategoryAvatarIcon />
//     <BadgesGroup />
//   </CardHeader>
//   <CardContent>
//     <CategoryKicker />
//     <Title />
//     <BodyExcerpt />
//   </CardContent>
//   <CardFooter>
//     <DurationAndMeta />
//     <ArrowLink />
//   </CardFooter>
// </MiniLessonCard>

import Link from "next/link";
import Card from "@/components/layout/Card";
import Badge from "@/components/ui/Badge";
import { ArrowRight } from "@/components/icons";
import { CategoryIcon } from "@/components/mini-lessons/CategoryIcon";
import type { MiniLesson } from "@/lib/content/schemas";
import {
  MINI_LESSON_CATEGORY_LABELS,
  MINI_LESSON_LEVEL_LABELS,
} from "@/lib/content/mini-lesson-labels";
import { cn } from "@/lib/cn";

interface MiniLessonCardProps {
  lesson: MiniLesson;
  isSpanning?: boolean;
}

export function MiniLessonCard({ lesson, isSpanning = false }: MiniLessonCardProps) {
  const hasIpa =
    lesson.category === "pronunciation" || lesson.examples?.some((e) => Boolean(e.ipa));
  const hasExamples = lesson.examples && lesson.examples.length > 0;

  return (
    <Link
      href={`/mini-lessons/${lesson.slug}`}
      className={cn(
        "group block h-full no-underline",
        isSpanning && "md:col-span-2"
      )}
    >
      <Card
        variant="interactive"
        className={cn(
          "relative flex flex-col h-full gap-3 overflow-hidden border-border-subtle hover:border-primary/40",
          isSpanning && "md:p-6"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Category Icon Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-sunken border border-border-subtle text-fg-muted group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-200">
            <CategoryIcon category={lesson.category} size="md" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge label={MINI_LESSON_LEVEL_LABELS[lesson.level]} variant="default" />
            {hasIpa && <Badge label="IPA" variant="info" />}
            {hasExamples && <Badge label="Ejercicios" variant="success" />}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-kicker text-fg-subtle uppercase tracking-wider">
            {MINI_LESSON_CATEGORY_LABELS[lesson.category]}
          </span>
          <h2
            className={cn(
              "font-semibold text-fg group-hover:text-primary transition-colors leading-snug",
              isSpanning ? "text-h3" : "text-h4"
            )}
          >
            {lesson.title}
          </h2>
        </div>

        <p
          className={cn(
            "text-body-sm text-fg-muted leading-relaxed",
            isSpanning ? "line-clamp-4" : "line-clamp-3"
          )}
        >
          {lesson.body}
        </p>

        <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-caption text-fg-subtle">
          <span>{lesson.duration} min</span>
          <ArrowRight
            className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform duration-200"
            aria-hidden
          />
        </div>
      </Card>
    </Link>
  );
}
