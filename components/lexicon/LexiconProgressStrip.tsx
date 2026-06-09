"use client";

import Link from "next/link";

interface LexiconProgressStripProps {
  percent: number;
  learned: number;
  inProgress: number;
  notStarted: number;
  dueForReview?: number;
}

export function LexiconProgressStrip({
  percent,
  learned,
  inProgress,
  notStarted,
  dueForReview = 0,
}: LexiconProgressStripProps) {
  const total = learned + inProgress + notStarted;
  const learnedPct = total > 0 ? (learned / total) * 100 : 0;
  const progressPct = total > 0 ? (inProgress / total) * 100 : 0;

  return (
    <div className="words-lexicon__strip flex flex-wrap items-center gap-4">
      <span className="words-lexicon__strip-pct">{percent}%</span>
      <div
        className="words-lexicon__segbar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lexicon progress"
      >
        <i className="words-lexicon__segbar-learned" style={{ width: `${learnedPct}%` }} />
        <i className="words-lexicon__segbar-progress" style={{ width: `${progressPct}%`, left: `${learnedPct}%` }} />
      </div>
      <div className="words-lexicon__strip-legend">
        <span className="words-lexicon__strip-dot words-lexicon__strip-dot--learned" />
        <b>{learned.toLocaleString()}</b> learned
      </div>
      <div className="words-lexicon__strip-legend">
        <span className="words-lexicon__strip-dot words-lexicon__strip-dot--progress" />
        <b>{inProgress.toLocaleString()}</b> in progress
      </div>
      <div className="words-lexicon__strip-legend">
        <span className="words-lexicon__strip-dot words-lexicon__strip-dot--not-started" />
        <b>{notStarted.toLocaleString()}</b> not started
      </div>
      {dueForReview > 0 && (
        <div className="words-lexicon__strip-review">
          <Link href="/review" className="words-lexicon__strip-pill">
            ↻ {dueForReview} to review today
          </Link>
        </div>
      )}
    </div>
  );
}
