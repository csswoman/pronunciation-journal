"use client";

import { useCallback, useEffect, useState } from "react";
import { isLessonComplete } from "@/lib/db";
import { recordLessonComplete } from "@/lib/practice/queries";

const COURSE_SLUG = "mini-lessons";

interface Props {
  slug: string;
}

export default function MiniLessonComplete({ slug }: Props) {
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    void isLessonComplete(COURSE_SLUG, slug).then(setCompleted);
  }, [slug]);

  const handleMarkRead = useCallback(async () => {
    if (completed || marking) return;
    setMarking(true);
    try {
      const already = await isLessonComplete(COURSE_SLUG, slug);
      if (already) {
        setCompleted(true);
        return;
      }
      await recordLessonComplete(COURSE_SLUG, slug);
      setCompleted(true);
    } finally {
      setMarking(false);
    }
  }, [completed, marking, slug]);

  if (completed) {
    return (
      <p className="mini-lessons__complete-note" role="status">
        Lesson marked as read
      </p>
    );
  }

  return (
    <button
      type="button"
      className="mini-lessons__btn"
      onClick={() => void handleMarkRead()}
      disabled={marking}
    >
      {marking ? "Saving…" : "Mark as read"}
    </button>
  );
}
