"use client";

import {
  Layers,
  Code2,
  Component,
  Briefcase,
  FileText,
  Server,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LessonViewModel } from "@/lib/lexicon/types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ux-design": Layers,
  "frontend-dev": Code2,
  "design-systems": Component,
  professional: Briefcase,
  "technical-writing": FileText,
  "backend-infra": Server,
};

interface LexiconExploreSectionProps {
  lessons: LessonViewModel[];
  onLessonClick: (id: string) => void;
  onViewAll?: () => void;
}

export function LexiconExploreSection({
  lessons,
  onLessonClick,
  onViewAll,
}: LexiconExploreSectionProps) {
  return (
    <>
      <div className="words-lexicon__sechead">
        <span className="words-lexicon__sechead-num">02</span>
        <h3>Explore by area</h3>
        {onViewAll ? (
          <button type="button" className="words-lexicon__sechead-all" onClick={onViewAll}>
            View all →
          </button>
        ) : null}
      </div>
      {lessons.length === 0 ? (
        <p className="words-lexicon__empty">You&apos;ve started every category — great work.</p>
      ) : (
        <div className="words-lexicon__explore grid grid-cols-1 sm:grid-cols-2 min-[820px]:grid-cols-3 gap-3.5">
          {lessons.map((lesson) => {
            const Icon = CATEGORY_ICONS[lesson.id] ?? BookOpen;
            const tags = lesson.tags.slice(0, 3);

            return (
              <button
                key={lesson.id}
                type="button"
                className="words-lexicon__tile"
                onClick={() => onLessonClick(lesson.id)}
              >
                <span className="words-lexicon__tile-ghost" aria-hidden>
                  {lesson.totalWords}
                </span>
                <div
                  className="words-lexicon__tile-ic"
                  style={{
                    background: `color-mix(in srgb, ${lesson.color} 15%, var(--surface-sunken))`,
                    color: lesson.color,
                  }}
                >
                  <Icon size={20} />
                </div>
                <h4>{lesson.title}</h4>
                <div className="words-lexicon__tile-tags flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="words-lexicon__tile-foot">
                  <span>{lesson.totalWords} words · not started</span>
                  <span className="words-lexicon__tile-go">Start →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
