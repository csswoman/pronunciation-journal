"use client";

import type { Tables } from "@/lib/supabase/types";

type Entry = Tables<"entries">;

interface StudyProgressBarProps {
  queue: Entry[];
  currentIndex: number;
}

export function StudyProgressBar({ queue, currentIndex }: StudyProgressBarProps) {
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-1">
        {queue.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                i < currentIndex
                  ? "var(--primary)"
                  : i === currentIndex
                  ? "var(--accent, #f59e0b)"
                  : "var(--line-divider)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
