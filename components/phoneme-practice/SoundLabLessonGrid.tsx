"use client";

import { useState } from "react";
import { SoundLabLessonCard } from "./SoundLabLessonCard";
import Button from "@/components/ui/Button";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";

// Planned structure:
// <SoundLabLessonGrid>
//   <LoadingSkeleton /> (when loading)
//   <EmptyState /> (when 0 lessons match filter)
//   <SectionList>
//     <SectionHeader> (Title + count badge + toggle button when expanded)
//     <GridContainer> (4-col responsive grid)
//       <SoundLabLessonCard /> ... (up to 7 cards when collapsed)
//       <RestOfGroupCard /> (8th slot when collapsed and >8 lessons)
//     </GridContainer>
//   </SectionList>
// </SoundLabLessonGrid>

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

const MAX_COLLAPSED_SLOTS = 8;

function getProgress(lesson: Lesson, map: Map<string, number>): number | undefined {
  if (!lesson.id.startsWith("sound-")) return undefined;
  const ipa = ipaFromLessonTitle(lesson.title);
  if (ipa) return map.get(ipa);
  return undefined;
}

interface RestOfGroupCardProps {
  remainingLessons: Lesson[];
  onExpand: () => void;
  staggerIndex?: number;
}

function RestOfGroupCard({ remainingLessons, onExpand, staggerIndex = 0 }: RestOfGroupCardProps) {
  const count = remainingLessons.length;
  const delayMs = Math.min(staggerIndex * 20, 300);

  const ipaChips = remainingLessons
    .map((l) => ipaFromLessonTitle(l.title))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <article
      className="sound-lab__card group relative flex flex-col justify-between transition-all duration-200 h-full"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="rounded-3xl p-5 sm:p-6 bg-paper border border-ink/10 shadow-xs flex flex-col justify-between h-full min-h-[220px]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 block">
            RESTO DEL GRUPO
          </span>

          <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight mb-3">
            +{count} {count === 1 ? "sonido" : "sonidos"}
          </h3>

          {ipaChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4" role="group" aria-label="Vista previa de sonidos restantes">
              {ipaChips.map((ipa, idx) => (
                <span
                  key={idx}
                  className="bg-ink/5 border border-ink/10 rounded-full px-2.5 py-1 text-sm font-bold text-ink inline-flex items-center"
                >
                  {ipa}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onExpand}
          className="bg-ink/5 hover:bg-ink/10 active:scale-95 border border-ink/15 text-ink text-body-sm font-bold px-4 py-2 rounded-full cursor-pointer transition-all inline-flex items-center gap-1.5 self-start mt-auto shadow-2xs"
        >
          Ver todos
        </button>
      </div>
    </article>
  );
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (isLoading) return <LoadingSkeleton />;

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  if (totalLessons === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="ts-body text-fg-muted">
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

  const toggleExpand = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  let cardIndex = 0;

  return (
    <div className="space-y-10">
      {sections.map((section, sectionIdx) => {
        const isExpanded = expandedSections.has(section.id);
        const totalSectionLessons = section.lessons.length;
        const needsTruncation = totalSectionLessons > MAX_COLLAPSED_SLOTS;

        const displayedLessons = !isExpanded && needsTruncation
          ? section.lessons.slice(0, MAX_COLLAPSED_SLOTS - 1)
          : section.lessons;

        const remainingLessons = !isExpanded && needsTruncation
          ? section.lessons.slice(MAX_COLLAPSED_SLOTS - 1)
          : [];

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
                <h2 className="ts-headline text-fg m-0">
                  {section.title}
                </h2>
                {section.count !== undefined && (
                  <span className="bg-surface-sunken border border-border text-fg-muted ts-badge rounded-full px-3 py-0.5 inline-flex items-center">
                    {section.count} {section.count === 1 ? "sonido" : "sonidos"}
                  </span>
                )}
                {section.subtitle ? (
                  <span className="ts-body-translation text-fg-muted m-0 font-normal">
                    {section.subtitle}
                  </span>
                ) : null}

                {isExpanded && needsTruncation && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(section.id)}
                    className="text-body-sm font-bold text-ink-muted hover:text-ink cursor-pointer ml-auto transition-colors"
                  >
                    Mostrar menos
                  </button>
                )}
              </div>
            ) : null}

            {/* 4-column responsive Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {displayedLessons.map((lesson) => {
                const progressPct = getProgress(lesson, soundProgressMap);
                const isWeak = progressPct !== undefined && progressPct > 0 && progressPct < 60;
                const index = cardIndex++;
                const ipa = ipaFromLessonTitle(lesson.title);
                const isTodaySound = ipa === "/ə/";

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

              {!isExpanded && remainingLessons.length > 0 && (
                <RestOfGroupCard
                  remainingLessons={remainingLessons}
                  onExpand={() => toggleExpand(section.id)}
                  staggerIndex={cardIndex++}
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
