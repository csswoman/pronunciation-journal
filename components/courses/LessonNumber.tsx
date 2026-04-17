"use client";

import { useEffect, useState } from "react";
import { isLessonComplete } from "@/lib/db";

interface Props {
  courseSlug: string;
  lessonSlug: string;
  index: number;
}

export function LessonNumber({ courseSlug, lessonSlug, index }: Props) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    isLessonComplete(courseSlug, lessonSlug).then(setCompleted);
  }, [courseSlug, lessonSlug]);

  if (completed) {
    return (
      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-bold transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  return (
    <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border border-[var(--line-divider)] text-sm font-bold text-[var(--text-tertiary)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-colors">
      {index + 1}
    </span>
  );
}
