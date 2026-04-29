"use client";

import { Lock } from "lucide-react";
import { RATING_CONFIG, previewInterval } from "./study-utils";
import type { DifficultyKey } from "./StudyDifficultyButtons";
import type { Tables } from "@/lib/supabase/types";

type Progress = Tables<"deck_entry_progress">;

interface StudyRatingBarProps {
  flipped: boolean;
  progress: Progress | null;
  onRate: (key: DifficultyKey) => void;
}

export function StudyRatingBar({ flipped, progress, onRate }: StudyRatingBarProps) {
  return (
    <div className="border-t px-4 py-3" style={{ borderColor: "var(--line-divider)" }}>
      {!flipped && (
        <p className="text-center text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
          Rate after seeing the answer
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
        {(Object.entries(RATING_CONFIG) as [DifficultyKey, typeof RATING_CONFIG[DifficultyKey]][]).map(([key, cfg]) => {
          const timeLabel = previewInterval(progress, cfg.q);
          return (
            <button
              key={key}
              onClick={() => flipped && onRate(key)}
              disabled={!flipped}
              className="flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border transition-all active:scale-95"
              style={flipped ? {
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                cursor: "pointer",
                opacity: 1,
              } : {
                backgroundColor: "var(--btn-regular-bg)",
                borderColor: "var(--line-divider)",
                cursor: "not-allowed",
                opacity: 0.7,
              }}
            >
              {flipped ? (
                <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
              ) : (
                <Lock size={15} style={{ color: "var(--text-tertiary)" }} className="mb-0.5" />
              )}
              <span className="text-xs" style={{ color: flipped ? cfg.color : "var(--text-tertiary)" }}>
                {cfg.sublabel}
              </span>
              <span className="text-xs font-semibold" style={{ color: flipped ? cfg.color : "var(--text-tertiary)" }}>
                {flipped ? timeLabel : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
