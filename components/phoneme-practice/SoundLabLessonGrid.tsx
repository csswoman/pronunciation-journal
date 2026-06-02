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
}: Props) {
  if (isLoading) return <LoadingSkeleton />;

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  if (totalLessons === 0) {
    return (
      <p className="py-16 text-center text-sm text-fg-muted">
        Ningún sonido coincide con este filtro.
      </p>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <section key={section.id} className="sound-lab__group">
          {section.title ? (
            <div className="sound-lab__group-head">
              <h2>{section.title}</h2>
              {section.count !== undefined && (
                <span>
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
              return (
                <SoundLabLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progressPct={progressPct}
                  isWeak={isWeak}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
