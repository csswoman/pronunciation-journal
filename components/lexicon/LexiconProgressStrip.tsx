"use client";

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
}: LexiconProgressStripProps) {
  const total = learned + inProgress + notStarted;
  const learnedPct = total > 0 ? (learned / total) * 100 : 0;
  const progressPct = total > 0 ? (inProgress / total) * 100 : 0;

  if (total === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-raised/60 text-fg-muted text-body-sm">
        <span className="font-mono text-caption text-primary font-bold">0%</span>
        <span>Explora los mazos Anki a continuación para registrar tu progreso.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border-subtle/70 bg-surface-raised/70 shadow-xs">
      <div className="flex items-center gap-3 flex-1 min-w-[260px]">
        <span className="font-mono text-caption text-primary font-bold shrink-0">{percent}%</span>
        <div
          className="words-lexicon__segbar flex-1 h-2 rounded-full bg-surface-sunken overflow-hidden relative"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso en el diccionario"
        >
          <i className="words-lexicon__segbar-learned block h-full bg-primary transition-all duration-300" style={{ width: `${learnedPct}%` }} />
          <i className="words-lexicon__segbar-progress block h-full bg-primary-soft absolute top-0 transition-all duration-300" style={{ width: `${progressPct}%`, left: `${learnedPct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 text-body-sm text-fg-muted">
        <span>
          <strong className="text-fg font-semibold">{learned.toLocaleString()}</strong> dominadas
        </span>
        {inProgress > 0 && (
          <>
            <span className="text-fg-subtle">•</span>
            <span>
              <strong className="text-fg font-semibold">{inProgress.toLocaleString()}</strong> en curso
            </span>
          </>
        )}
      </div>
    </div>
  );
}
