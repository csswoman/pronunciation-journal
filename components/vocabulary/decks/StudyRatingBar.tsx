"use client";

import type { DifficultyKey } from "./StudyDifficultyButtons";
import type { Tables } from "@/lib/supabase/types";

type Progress = Tables<"deck_entry_progress">;

interface StudyRatingBarProps {
  flipped: boolean;
  progress: Progress | null;
  onRate: (key: DifficultyKey) => void;
}

const RATING_BUTTONS: {
  key: DifficultyKey;
  label: string;
  keyNum: string;
  bgClass: string;
}[] = [
  {
    key: "again",
    label: "No me acordé",
    keyNum: "1",
    bgClass: "bg-[#f8b4a6] hover:bg-[#f6a190] text-stone-900 border-none",
  },
  {
    key: "hard",
    label: "Con esfuerzo",
    keyNum: "2",
    bgClass: "bg-[#fbe495] hover:bg-[#fad879] text-stone-900 border-none",
  },
  {
    key: "easy",
    label: "Muy bien",
    keyNum: "3",
    bgClass: "bg-[#a3e8ca] hover:bg-[#8ee1bc] text-stone-900 border-none",
  },
];

export function StudyRatingBar({ flipped, onRate }: StudyRatingBarProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-4 select-none">
      <p className="font-sans text-caption font-semibold text-fg-muted">
        Puntúa después de ver la respuesta
      </p>

      <div className="flex items-center justify-center gap-3 w-full max-w-xl flex-wrap">
        {RATING_BUTTONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => flipped && onRate(item.key)}
            disabled={!flipped}
            className={`focus-ring inline-flex items-center gap-2 rounded-full px-6 py-3 font-sans text-body-sm font-extrabold transition-all active:scale-95 shadow-2xs ${
              flipped
                ? `${item.bgClass} cursor-pointer opacity-100`
                : "bg-surface-sunken text-fg-subtle border border-border-default cursor-not-allowed opacity-50"
            }`}
          >
            <span>{item.label}</span>
            <span className="flex size-5 items-center justify-center rounded-full bg-black/15 text-stone-900 font-extrabold text-tiny">
              {item.keyNum}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
