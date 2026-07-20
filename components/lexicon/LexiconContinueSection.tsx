"use client";

import type { LessonViewModel } from "@/lib/lexicon/types";

interface LexiconContinueSectionProps {
  lessons: LessonViewModel[];
  onLessonClick: (id: string) => void;
}

export function LexiconContinueSection({ lessons, onLessonClick }: LexiconContinueSectionProps) {
  if (lessons.length === 0) return null;

  return (
    <>
      <div className="words-lexicon__sechead">
        <div>
          <p className="words-lexicon__sechead-kicker">Tu progreso</p>
          <h2>Continúa aprendiendo</h2>
        </div>
      </div>
      <div className="words-lexicon__continue">
        {lessons.map((lesson) => {
          const preview = lesson.tags.slice(0, 2).join(" · ");

          return (
            <button
              key={lesson.id}
              type="button"
              className="words-lexicon__cont"
              onClick={() => onLessonClick(lesson.id)}
            >
              <span
                className="words-lexicon__cont-dot bg-primary-soft"
                aria-hidden
              />
              <div className="words-lexicon__cont-info">
                <div className="words-lexicon__cont-title">{lesson.title}</div>
                <div className="words-lexicon__cont-bar" aria-hidden>
                  <span
                    className="words-lexicon__cont-bar-fill bg-primary"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
                <div className="words-lexicon__cont-meta">
                  {lesson.wordsCompleted} / {lesson.totalWords} palabras
                  {preview ? <span className="words-lexicon__cont-tags"> · {preview}</span> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
