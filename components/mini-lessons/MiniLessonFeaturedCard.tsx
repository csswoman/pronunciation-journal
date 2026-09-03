// Planned structure:
// <MiniLessonFeaturedCard>
//   <TopAccentBar />
//   <FeaturedContainer>
//     <CategoryAvatarIcon />
//     <ContentGroup>
//       <MetaHeader />
//       <Title />
//       <Subtitle />
//     </ContentGroup>
//     <CtaLink />
//   </FeaturedContainer>
// </MiniLessonFeaturedCard>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CategoryIcon } from "@/components/mini-lessons/CategoryIcon";
import type { MiniLesson } from "@/lib/content/schemas";
import { MINI_LESSON_CATEGORY_LABELS } from "@/lib/content/mini-lesson-labels";

export function MiniLessonFeaturedCard({ lesson }: { lesson: MiniLesson }) {
  return (
    <Link
      href={`/mini-lessons/${lesson.slug}`}
      className="group relative block w-full no-underline rounded-lg border border-border-subtle bg-surface-raised p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start md:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 text-primary transition-transform duration-200 group-hover:scale-105">
            <CategoryIcon category={lesson.category} size="lg" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-caption text-primary font-semibold tracking-wider uppercase">
                Continúa donde lo dejaste
              </span>
              <span className="text-fg-subtle text-caption">•</span>
              <span className="text-caption text-fg-subtle">
                {lesson.duration} min
              </span>
            </div>

            <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors leading-tight">
              {lesson.title}
            </h2>

            <p className="text-body-sm text-fg-muted line-clamp-1">
              {MINI_LESSON_CATEGORY_LABELS[lesson.category]} · {lesson.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <span className="text-body-sm font-semibold text-primary group-hover:underline">
            Continuar lección
          </span>
          <ArrowRight
            className="w-4 h-4 text-primary transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
