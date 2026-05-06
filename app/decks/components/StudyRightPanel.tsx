"use client";

import { DOT_COLORS, LEVEL_LABELS, LEVEL_NAMES, timeUntil } from "./study-utils";
import type { Tables } from "@/lib/supabase/types";

type Progress = Tables<"deck_entry_progress">;
type Entry = Tables<"entries">;

interface CardWithProgress extends Entry {
  progress: Progress | null;
}

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudyRightPanelProps {
  stats: SessionStats;
  upcomingCards: CardWithProgress[];
}

export function StudyRightPanel({ stats, upcomingCards }: StudyRightPanelProps) {
  return (
    <div className="hidden lg:flex flex-col gap-5 w-52 xl:w-60 shrink-0">

      {/* Today's progress */}
      <div>
        <p className="text-tiny font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--text-tertiary)" }}>Today's progress</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: stats.easy,  label: "easy",       color: "var(--success)" },
            { val: stats.again, label: "hard",        color: "var(--error)" },
            { val: stats.hard,  label: "medium",      color: "var(--warning)" },
            { val: stats.seen,  label: "total seen",  color: "var(--deep-text)" },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-xl border p-3 text-center"
              style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}>
              <p className="text-xl font-bold" style={{ color }}>{val}</p>
              <p className="text-tiny mt-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming cards */}
      {upcomingCards.length > 0 && (
        <div>
          <p className="text-tiny font-semibold tracking-widest uppercase mb-2"
            style={{ color: "var(--text-tertiary)" }}>Upcoming cards</p>
          <div className="space-y-1.5">
            {upcomingCards.map((card, i) => {
              const cardLevel = card.difficulty
                ? LEVEL_LABELS[Math.min((card.difficulty ?? 1) - 1, 5)]
                : null;
              return (
                <div key={card.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                  style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>
                      {card.word}
                    </p>
                    {cardLevel && (
                      <p className="text-tiny" style={{ color: "var(--text-tertiary)" }}>
                        {cardLevel} · {LEVEL_NAMES[cardLevel]}
                      </p>
                    )}
                  </div>
                  <span className="text-tiny shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {timeUntil(card.progress?.next_review_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
