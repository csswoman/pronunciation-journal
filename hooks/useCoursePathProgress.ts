"use client";

import { useCallback, useEffect, useState } from "react";
import { db, markLessonComplete } from "@/lib/db";
import type { CoursePathTrackId } from "@/lib/courses/types";
import { lessonProgressKey } from "@/lib/courses/progress";

export function useCoursePathProgress(levelId: CoursePathTrackId) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await db.completedLessons.where("courseSlug").equals(levelId).toArray();
      if (cancelled) return;
      setCompletedIds(new Set(rows.map((r) => lessonProgressKey(levelId, r.lessonSlug))));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  const markComplete = useCallback(
    async (lessonId: string) => {
      await markLessonComplete(levelId, lessonId);
      setCompletedIds((prev) => new Set(prev).add(lessonProgressKey(levelId, lessonId)));
    },
    [levelId]
  );

  const isComplete = useCallback(
    (lessonId: string) => completedIds.has(lessonProgressKey(levelId, lessonId)),
    [completedIds, levelId]
  );

  return { completedIds, ready, markComplete, isComplete };
}
