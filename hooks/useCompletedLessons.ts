"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isLessonComplete,
  markLessonComplete,
  markLessonIncomplete,
} from "@/lib/db";

export function useCompletedLesson(courseSlug: string, lessonSlug: string) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isLessonComplete(courseSlug, lessonSlug).then((v) => {
      setCompleted(v);
      setLoading(false);
    });
  }, [courseSlug, lessonSlug]);

  const toggle = useCallback(async () => {
    if (completed) {
      await markLessonIncomplete(courseSlug, lessonSlug);
      setCompleted(false);
    } else {
      await markLessonComplete(courseSlug, lessonSlug);
      setCompleted(true);
    }
  }, [completed, courseSlug, lessonSlug]);

  return { completed, loading, toggle };
}
