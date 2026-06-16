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
        <h3>Continue learning</h3>
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
                className="words-lexicon__cont-dot"
                style={{ background: lesson.color }}
                aria-hidden
              />
              <div className="words-lexicon__cont-info">
                <div className="words-lexicon__cont-title">{lesson.title}</div>
                <div className="words-lexicon__cont-bar" aria-hidden>
                  <span
                    className="words-lexicon__cont-bar-fill"
                    style={{ width: `${lesson.progress}%`, background: lesson.color }}
                  />
                </div>
                <div className="words-lexicon__cont-meta">
                  {lesson.wordsCompleted} / {lesson.totalWords} words
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
