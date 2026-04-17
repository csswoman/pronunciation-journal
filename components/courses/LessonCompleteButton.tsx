"use client";

import { useCompletedLesson } from "@/hooks/useCompletedLessons";

interface Props {
  courseSlug: string;
  lessonSlug: string;
}

export default function LessonCompleteButton({ courseSlug, lessonSlug }: Props) {
  const { completed, loading, toggle } = useCompletedLesson(courseSlug, lessonSlug);

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200"
      style={
        completed
          ? {
              background: "oklch(.92 .08 150)",
              color: "oklch(.35 .14 150)",
              border: "1px solid oklch(.82 .10 150)",
            }
          : {
              background: "var(--btn-regular-bg)",
              color: "var(--text-secondary)",
              border: "1px solid var(--line-divider)",
            }
      }
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] transition-all duration-200"
        style={
          completed
            ? { background: "oklch(.55 .16 150)", color: "white" }
            : { background: "var(--line-divider)", color: "transparent" }
        }
      >
        ✓
      </span>
      {completed ? "Lesson completed" : "Mark as complete"}
    </button>
  );
}
