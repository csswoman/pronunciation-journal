"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { recordLessonComplete } from "@/lib/practice/queries";
import type { CoursePathTrackId } from "@/lib/courses/types";
import { lessonProgressKey } from "@/lib/courses/progress";

export function useCoursePathProgress(levelId: CoursePathTrackId) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setReady(false);
    db.completedLessons.where("courseSlug").equals(levelId).toArray()
      .then((rows) => {
        setCompletedIds(new Set(rows.map((r) => lessonProgressKey(levelId, r.lessonSlug))));
        setReady(true);
      })
      .catch(() => setError(true));
  }, [levelId]);

  useEffect(() => { load(); }, [load]);

  const markComplete = useCallback(
    async (lessonId: string) => {
      await recordLessonComplete(levelId, lessonId);
      setCompletedIds((prev) => new Set(prev).add(lessonProgressKey(levelId, lessonId)));
    },
    [levelId]
  );

  const isComplete = useCallback(
    (lessonId: string) => completedIds.has(lessonProgressKey(levelId, lessonId)),
    [completedIds, levelId]
  );

  return { completedIds, ready, error, retry: load, markComplete, isComplete };
}
