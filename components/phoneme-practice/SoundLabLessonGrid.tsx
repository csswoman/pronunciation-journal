import { SoundLabLessonCard } from "./SoundLabLessonCard";
import type { Lesson } from "@/lib/types";

export interface LessonSection {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  category?: string;
  lessons: Lesson[];
}

interface Props {
  sections: LessonSection[];
  heroLessonId: string | undefined;
  soundProgressMap: Map<number, number>;
  isLoading: boolean;
}

function getProgress(lesson: Lesson, map: Map<number, number>): number | undefined {
  if (!lesson.id.startsWith("sound-")) return undefined;
  return map.get(Number(lesson.id.replace("sound-", "")));
}


function LoadingSkeleton() {
  return (
    <div className="space-y-space-10">
      {[1, 2].map((s) => (
        <div key={s}>
          <div className="mb-space-4 h-5 w-36 animate-pulse rounded bg-border-subtle" />
          <div className="grid grid-cols-2 gap-space-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[168px] rounded-xl border border-border-subtle bg-surface p-space-5 shadow-sm">
                <div className="mb-space-3 h-4 w-10 animate-pulse rounded-md bg-border-subtle" />
                <div className="mb-space-3 h-8 w-12 animate-pulse rounded bg-border-subtle" />
                <div className="mb-space-2 h-4 w-3/4 animate-pulse rounded bg-border-subtle" />
                <div className="h-3 w-full animate-pulse rounded bg-border-subtle" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SoundLabLessonGrid({
  sections,
  heroLessonId,
  soundProgressMap,
  isLoading,
}: Props) {
  if (isLoading) return <LoadingSkeleton />;

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  if (totalLessons === 0) {
    return (
      <p className="py-space-16 text-center text-body-sm text-fg-muted">
        No lessons match this filter.
      </p>
    );
  }

  return (
    <div className="space-y-space-10">
      {sections.map((section) => (
        <section key={section.id}>
          {/* Section header */}
          <div className="mb-space-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-space-3">
              <h2 className="text-h3 text-fg">{section.title}</h2>
              {section.count !== undefined && (
                <span className="text-body-sm text-fg-muted">{section.count} sounds</span>
              )}
            </div>
            {section.subtitle && (
              <span className="text-body-sm text-fg-subtle">{section.subtitle}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-space-4 sm:grid-cols-3 lg:grid-cols-5">
            {section.lessons.map((lesson) => {
              const progressPct = getProgress(lesson, soundProgressMap);
              const isWeak =
                progressPct !== undefined && progressPct > 0 && progressPct < 60;
              return (
                <SoundLabLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progressPct={progressPct}
                  isContinuing={lesson.id === heroLessonId}
                  isWeak={isWeak}
                  category={section.category}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
