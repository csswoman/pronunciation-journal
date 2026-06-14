"use client";

import Link from "next/link";
import { PracticeButton } from "./PracticeButton";

interface LessonDetailHeaderProps {
  title: string;
  blurb: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  color: string;
  categoryId: string;
}

export function LessonDetailHeader({
  title,
  blurb,
  totalWords,
  wordsLearned,
  wordsReviewing,
  color,
  categoryId,
}: LessonDetailHeaderProps) {
  const learnedPct = totalWords > 0 ? (wordsLearned / totalWords) * 100 : 0;
  const reviewingPct = totalWords > 0 ? (wordsReviewing / totalWords) * 100 : 0;
  const wordsNew = Math.max(0, totalWords - wordsLearned - wordsReviewing);

  return (
    <header className="lexicon-area__head">
      <div>
        <nav className="lexicon-area__crumb" aria-label="Breadcrumb">
          <Link href="/words?tab=lexicon">Dictionary</Link>
          {" › "}
          <strong>{title}</strong>
        </nav>

        <h1 className="mt-1">
          <span className="lexicon-area__dot" style={{ background: color }} aria-hidden />
          <span className="lexicon-area__title">{title}</span>
        </h1>

        <p className="lexicon-area__sub">
          {totalWords.toLocaleString()} words · {blurb}
        </p>
      </div>

      <div className="lexicon-area__prog">
        <div className="lexicon-area__prog-top">
          <span className="lexicon-area__prog-num">{wordsLearned.toLocaleString()}</span>
          <span className="lexicon-area__prog-label">
            learned / {totalWords.toLocaleString()}
          </span>
        </div>

        <div className="lexicon-area__segbar" role="progressbar" aria-valuenow={wordsLearned} aria-valuemin={0} aria-valuemax={totalWords}>
          <i className="lexicon-area__segbar-learned" style={{ width: `${learnedPct}%` }} />
          <i className="lexicon-area__segbar-review" style={{ width: `${reviewingPct}%` }} />
        </div>

        <div className="lexicon-area__legend">
          <span className="lexicon-area__legend-item">
            <span className="lexicon-area__legend-dot" style={{ background: "var(--success)" }} />
            Learned
          </span>
          <span className="lexicon-area__legend-item">
            <span className="lexicon-area__legend-dot" style={{ background: "var(--warning)" }} />
            Reviewing
          </span>
          <span className="lexicon-area__legend-item">
            <span
              className="lexicon-area__legend-dot"
              style={{ background: "var(--text-tertiary)", opacity: 0.5 }}
            />
            New ({wordsNew.toLocaleString()})
          </span>
        </div>

        <div className="lexicon-area__hbtns">
          {wordsReviewing > 0 ? (
            <span className="lexicon-area__due">
              {wordsReviewing.toLocaleString()} due for review
            </span>
          ) : null}
          <PracticeButton categoryId={categoryId} />
        </div>
      </div>
    </header>
  );
}
