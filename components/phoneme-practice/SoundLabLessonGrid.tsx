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
  soundProgressMap: Map<string, number>;
  isLoading: boolean;
  onClearFilters?: () => void;
}

function getProgress(lesson: Lesson, map: Map<string, number>): number | undefined {
  if (!lesson.id.startsWith("sound-")) return undefined;
  // Extract IPA from title like "/iː/ — sheep" or fall back to numeric id lookup
  const ipaMatch = lesson.title.match(/^(\/[^/]+\/)/)
  if (ipaMatch) return map.get(ipaMatch[1]);
  return undefined;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((s) => (
        <div key={s} className="sound-lab__group">
          <div className="mb-3.5 h-5 w-36 animate-pulse rounded bg-surface-sunken" />
          <div className="sound-lab__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-lg bg-surface-raised"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SoundLabLessonGrid({
  sections,
  soundProgressMap,
  isLoading,
  onClearFilters,
}: Props) {
  if (isLoading) return <LoadingSkeleton />;

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  if (totalLessons === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-[color:var(--text-secondary)]">
          No sounds match this filter.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="sound-lab__chip sound-lab__chip--on"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  let cardIndex = 0;

  return (
    <>
      {sections.map((section, sectionIdx) => (
        <section
          key={section.id}
          className={[
            "flex flex-col gap-4 last:mb-0",
            sectionIdx > 0 ? "sound-lab__section-divider" : "mb-10",
          ].join(" ")}
        >
          {section.title ? (
            <div className="flex items-baseline gap-3">
              <h2 className="sound-lab__group-title m-0">{section.title}</h2>
              {section.count !== undefined && (
                <span className="text-[12px] text-[color:var(--text-tertiary)]">
                  {section.count} {section.count === 1 ? "sound" : "sounds"}
                </span>
              )}
            </div>
          ) : null}
          <div className="sound-lab__grid">
            {section.lessons.map((lesson) => {
              const progressPct = getProgress(lesson, soundProgressMap);
              const isWeak =
                progressPct !== undefined && progressPct > 0 && progressPct < 60;
              const index = cardIndex++;
              return (
                <SoundLabLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progressPct={progressPct}
                  isWeak={isWeak}
                  staggerIndex={index}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
