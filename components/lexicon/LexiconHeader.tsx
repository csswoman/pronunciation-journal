interface LexiconHeaderProps {
  wordsLearned: number;
  totalWords: number;
  percentageDone: number;
}

export function LexiconHeader({ wordsLearned, totalWords, percentageDone }: LexiconHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2">
        <h1 className="text-4xl font-heading font-bold text-fg">
          <span className="text-primary">Lex</span><span className="text-fg">icon</span>
        </h1>
      </div>
      <p className="text-fg-muted mt-1 text-sm">10,000 curated words · track your journey</p>

      <div className="mt-6 flex items-end gap-8">
        <div>
          <p className="text-sm text-fg-muted mb-2">Progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-fg">{wordsLearned}</span>
            <span className="text-lg text-fg-muted">of {totalWords} learned</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6"
                strokeDasharray={`${percentageDone * 2.827} 282.7`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-fg">{percentageDone.toFixed(1)}%</p>
                <p className="text-xs text-fg-muted">done</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
