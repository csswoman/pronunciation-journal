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

const RING_C = 2 * Math.PI * 24;

interface LexiconContinueSectionProps {
  lessons: LessonViewModel[];
  onLessonClick: (id: string) => void;
}

export function LexiconContinueSection({ lessons, onLessonClick }: LexiconContinueSectionProps) {
  if (lessons.length === 0) return null;

  return (
    <>
      <div className="words-lexicon__sechead">
        <span className="words-lexicon__sechead-num">01</span>
        <h3>Pick up where you left off</h3>
      </div>
      <div className="words-lexicon__continue">
        {lessons.map((lesson) => {
          const Icon = CATEGORY_ICONS[lesson.id] ?? BookOpen;
          const offset = RING_C - (RING_C * lesson.progress) / 100;
          const preview = lesson.tags.slice(0, 2).join(" · ");

          return (
            <button
              key={lesson.id}
              type="button"
              className="words-lexicon__cont"
              onClick={() => onLessonClick(lesson.id)}
            >
              <div className="words-lexicon__cont-ring">
                <svg width="56" height="56" aria-hidden>
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="var(--surface-sunken)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={lesson.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={offset}
                  />
                </svg>
                <span
                  className="words-lexicon__cont-ring-pct"
                  style={{ color: lesson.color }}
                >
                  {lesson.progress}%
                </span>
              </div>
              <div className="words-lexicon__cont-info">
                <div className="words-lexicon__cont-title">{lesson.title}</div>
                <div className="words-lexicon__cont-meta">
                  {lesson.wordsCompleted} / {lesson.totalWords} words
                </div>
                {preview ? (
                  <div className="words-lexicon__cont-next">Next up: {preview}</div>
                ) : null}
              </div>
              <Icon size={18} style={{ color: lesson.color, flexShrink: 0 }} aria-hidden />
            </button>
          );
        })}
      </div>
    </>
  );
}
