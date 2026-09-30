"use client";

import { SoundLabLessonCard } from "./SoundLabLessonCard";
import Button from "@/components/ui/Button";
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
          <div className="mb-3.5 h-6 w-48 animate-pulse rounded bg-surface-sunken" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] animate-pulse rounded-3xl bg-surface-raised border border-border"
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
        <p className="text-body-sm text-fg-muted">
          Ningún sonido coincide con este filtro.
        </p>
        {onClearFilters && (
          <Button type="button" variant="secondary" size="sm" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    );
  }

  let cardIndex = 0;

  return (
    <div className="space-y-10">
      {sections.map((section, sectionIdx) => {
        // If a section has more than 7 items, we can split into main items + summary card if needed, or show all
        const lessonsToDisplay = section.lessons;
        
        return (
          <section
            key={section.id}
            className={[
              "flex flex-col gap-4 last:mb-0",
              sectionIdx > 0 ? "pt-6 border-t border-border/40" : "",
            ].join(" ")}
          >
            {section.title ? (
              <div className="flex flex-wrap items-baseline gap-2.5 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg m-0">
                  {section.title}
                </h2>
                {section.count !== undefined && (
                  <span className="bg-surface-sunken border border-border text-fg-muted font-medium text-xs rounded-full px-3 py-0.5 inline-flex items-center">
                    {section.count} {section.count === 1 ? "sonido" : "sonidos"}
                  </span>
                )}
                {section.subtitle ? (
                  <span className="text-body-sm text-fg-muted m-0 font-normal">
                    {section.subtitle}
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* 4-column responsive Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {lessonsToDisplay.map((lesson) => {
                const progressPct = getProgress(lesson, soundProgressMap);
                const isWeak = progressPct !== undefined && progressPct > 0 && progressPct < 60;
                const index = cardIndex++;
                const ipa = ipaFromLessonTitle(lesson.title);
                const isTodaySound = ipa === "/ə/"; // Accentuate today's sound

                return (
                  <SoundLabLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progressPct={progressPct}
                    isWeak={isWeak}
                    isContinuing={heroLessonId !== undefined && lesson.id === heroLessonId}
                    isToday={isTodaySound}
                    staggerIndex={index}
                    onSelect={onSelect ? () => onSelect(lesson) : undefined}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
