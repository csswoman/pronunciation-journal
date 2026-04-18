"use client";

import { useEffect, useState } from "react";
import { getCompletedCountByCourse } from "@/lib/db";

interface Props {
  courseSlug: string;
  totalLessons: number;
}

export default function CourseHeroProgress({ courseSlug, totalLessons }: Props) {
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    getCompletedCountByCourse().then((counts) => {
      setCompleted(counts[courseSlug] ?? 0);
    });
  }, [courseSlug]);

  if (completed === null || totalLessons === 0) return null;

  const progress = Math.min(100, Math.round((completed / totalLessons) * 100));
  const isCompleted = completed >= totalLessons;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: isCompleted ? `oklch(.75 .18 150)` : `rgba(255,255,255,0.85)`,
          }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-white/70 shrink-0">
        {completed}/{totalLessons}
      </span>
    </div>
  );
}
