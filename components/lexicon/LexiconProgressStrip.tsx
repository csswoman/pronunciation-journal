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

  if (total === 0) {
    return (
      <div className="words-lexicon__strip flex items-center gap-2 text-fg-muted">
        <span className="words-lexicon__strip-pct">0%</span>
        <span>Start exploring to track your progress here.</span>
      </div>
    );
  }

  return (
    <div className="words-lexicon__strip flex flex-wrap items-center gap-3">
      <div
        className="words-lexicon__segbar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Dictionary progress"
      >
        <i className="words-lexicon__segbar-learned" style={{ width: `${learnedPct}%` }} />
        <i className="words-lexicon__segbar-progress" style={{ width: `${progressPct}%`, left: `${learnedPct}%` }} />
      </div>
      <span className="words-lexicon__strip-summary">
        <b>{learned.toLocaleString()}</b> learned
        {inProgress > 0 ? <> · <b>{inProgress.toLocaleString()}</b> in progress</> : null}
      </span>
      {dueForReview > 0 && (
        <Link href="/review" className="words-lexicon__strip-pill px-3 py-1">
          ↻ {dueForReview} to review
        </Link>
      )}
    </div>
  );
}
