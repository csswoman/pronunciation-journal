"use client";

import { useCompletedLesson } from "@/hooks/useCompletedLessons";
import Button from "@/components/ui/Button";

interface Props {
  courseSlug: string;
  lessonSlug: string;
}

export default function LessonCompleteButton({ courseSlug, lessonSlug }: Props) {
  const { completed, loading, toggle } = useCompletedLesson(courseSlug, lessonSlug);

  if (loading) return null;

  return (
    <Button
      onClick={toggle}
      variant={completed ? "success" : "secondary"}
      size="md"
      icon={
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full text-tiny transition-all duration-200"
          style={completed ? { background: "var(--overlay-light)", color: "var(--on-primary)" } : { background: "var(--line-divider)", color: "transparent" }}
        >
          ✓
        </span>
      }
    >
      {completed ? "Lesson completed" : "Mark as complete"}
    </Button>
  );
}
