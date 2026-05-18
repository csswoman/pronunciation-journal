interface LexiconHeaderProps {
  wordsLearned: number;
  totalWords: number;
  percentageDone: number;
}

export function LexiconHeader({ wordsLearned, totalWords, percentageDone }: LexiconHeaderProps) {
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (percentageDone / 100) * circumference;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-fg">
            <span className="text-primary">Lex</span>icon
          </h1>
          <p className="text-fg-muted mt-2 text-sm">
            {totalWords.toLocaleString()} curated words · track your journey
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-fg tabular-nums">
              {wordsLearned.toLocaleString()}
              <span className="text-fg-muted font-normal text-base"> / {totalWords.toLocaleString()}</span>
            </p>
            <p className="text-xs text-fg-muted mt-0.5">words learned</p>
          </div>

          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-bold text-fg leading-none">{percentageDone.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
