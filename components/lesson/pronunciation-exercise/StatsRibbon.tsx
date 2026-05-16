"use client";

import type { AttemptScore } from "./exercise-types";

const DOT_COLOR: Record<AttemptScore, string> = {
  excellent:  "bg-score-excellent",
  acceptable: "bg-score-acceptable",
  poor:       "bg-score-poor",
};

const DOT_LABEL: Record<AttemptScore, string> = {
  excellent:  "Excellent",
  acceptable: "Acceptable",
  poor:       "Poor",
};

interface Props {
  attempts: readonly AttemptScore[];
  bestToday: number;
  soundLabel: string;
}

export default function StatsRibbon({ attempts, bestToday, soundLabel }: Props) {
  return (
    <div className="shrink-0 h-11 flex items-center justify-between px-space-8 bg-surface-sunken border-t border-border-subtle">
      {/* Last-N attempt dots */}
      <div className="flex items-center gap-space-2">
        <span className="text-caption text-fg-subtle mr-space-1">Last attempts:</span>
        {attempts.map((score, i) => (
          <span
            key={i}
            title={DOT_LABEL[score]}
            className={`w-2 h-2 rounded-full ${DOT_COLOR[score]} transition-opacity animate-fadeIn`}
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Best today */}
      <div className="flex items-baseline gap-space-1">
        <span className="font-[family-name:var(--font-heading)] text-body-lg font-semibold text-fg">
          Best today: {bestToday}%
        </span>
        <span className="text-caption text-fg-subtle">
          of {soundLabel} sound
        </span>
      </div>
    </div>
  );
}
