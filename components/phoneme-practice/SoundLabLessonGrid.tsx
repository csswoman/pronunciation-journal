import { SoundLabLessonCard } from "./SoundLabLessonCard";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";

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
  onSelect?: (lesson: Lesson) => void;
}

function getProgress(lesson: Lesson, map: Map<string, number>): number | undefined {
  if (!lesson.id.startsWith("sound-")) return undefined;
  const ipa = ipaFromLessonTitle(lesson.title);
  if (ipa) return map.get(ipa);
  return undefined;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-[var(--layout-section-gap)]">
      {[1, 2].map((s) => (
        <div key={s} className="sound-lab__group">
          <div className="mb-3.5 h-5 w-36 animate-pulse rounded bg-surface-sunken" />
          <div className="sound-lab__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-xl bg-surface-raised"
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
  heroLessonId,
  soundProgressMap,
  isLoading,
  onClearFilters,
  onSelect,
}: Props) {
  if (isLoading) return <LoadingSkeleton />;

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  if (totalLessons === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-body-sm text-[color:var(--text-secondary)]">
          Ningún sonido coincide con este filtro.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-secondary"
          >
            Limpiar filtros
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
                <span className="text-tiny text-[color:var(--text-secondary)]">
                  {section.count} {section.count === 1 ? "sonido" : "sonidos"}
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
                  isContinuing={heroLessonId !== undefined && lesson.id === heroLessonId}
                  staggerIndex={index}
                  onSelect={onSelect ? () => onSelect(lesson) : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
