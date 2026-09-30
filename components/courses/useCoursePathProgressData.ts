"use client";

import { useEffect, useMemo, useState } from "react";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { useLearnerLevelId } from "@/hooks/useLearnerLevelId";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { deriveLevelView, lessonProgressKey, type DerivedUnitView } from "@/lib/courses/progress";
import type { CefrLevelId, CoursePathLevel, CoursePathTrackId } from "@/lib/courses/types";

async function getOptionalUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function completionKey(userId: string, courseSlug: string, lessonSlug: string): string {
  return `${userId}:${courseSlug}:${lessonSlug}`;
}

export function useCoursePathProgressData(
  level: CoursePathLevel,
  electiveTracks?: CoursePathLevel[]
) {
  const loadingWords = useLoadingWords();
  const [completedIds, setCompletedIds] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const navigatedLevelId = level.id as CefrLevelId;
  const learnerLevelId = useLearnerLevelId(navigatedLevelId);
  const isNavigatingOwnLevel = learnerLevelId === navigatedLevelId;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`course-path:groups:${level.id}`);
      setExpandedGroups(saved ? (JSON.parse(saved) as Record<string, boolean>) : {});
    } catch {
      setExpandedGroups({});
    }
  }, [level.id]);

  const handleGroupToggle = (id: string, open: boolean) => {
    setExpandedGroups((previous) => {
      const next = { ...previous, [id]: open };
      try {
        window.localStorage.setItem(`course-path:groups:${level.id}`, JSON.stringify(next));
      } catch {
        // Storage unavailable fallback
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setCompletedIds(null);
    setLoadError(false);

    async function loadProgress() {
      const userId = await getOptionalUserId();

      if (!userId) {
        if (!cancelled) setCompletedIds(new Set());
        return;
      }

      const allLevels =
        level.id === "opcionales" && electiveTracks && electiveTracks.length > 0
          ? electiveTracks
          : [level];

      const keysToFetch = allLevels.flatMap((lvl) =>
        lvl.units.flatMap((unit) =>
          unit.lessons.map((lesson) => completionKey(userId, lvl.id, lesson.id))
        )
      );

      const rows = await db.completedLessons.bulkGet(keysToFetch);

      if (cancelled) return;

      setCompletedIds(
        new Set(
          rows
            .filter((row): row is NonNullable<typeof row> => Boolean(row))
            .map((row) => lessonProgressKey(row.courseSlug as CoursePathTrackId, row.lessonSlug))
        )
      );
    }

    loadProgress().catch(() => {
      if (!cancelled) {
        setCompletedIds(new Set());
        setLoadError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [level, retryKey, electiveTracks]);

  const derived = useMemo(() => {
    if (!completedIds) return null;
    if (level.id === "opcionales" && electiveTracks) {
      let totalCore = 0;
      let completedCore = 0;
      let assignedCurrent = false;

      const derivedUnits: DerivedUnitView[] = electiveTracks.flatMap((track) =>
        track.units.map((unit) => {
          const lessons = unit.lessons.map((lesson) => {
            const key = lessonProgressKey(track.id, lesson.id);
            const isDone = completedIds.has(key);
            totalCore++;
            if (isDone) {
              completedCore++;
              return { ...lesson, state: "done" as const };
            }
            if (!assignedCurrent) {
              assignedCurrent = true;
              return { ...lesson, state: "current" as const };
            }
            return { ...lesson, state: "available" as const };
          });
          const allDone = lessons.every((l) => l.state === "done");
          return {
            unit,
            status: allDone ? ("done" as const) : ("active" as const),
            progressPercent:
              lessons.length > 0
                ? Math.round(
                    (lessons.filter((l) => l.state === "done").length / lessons.length) * 100
                  )
                : 0,
            lessons,
            defaultOpen: false,
          };
        })
      );

      const percent = totalCore > 0 ? Math.round((completedCore / totalCore) * 100) : 0;
      return {
        level,
        progressPercent: percent,
        completedCoreLessons: completedCore,
        totalCoreLessons: totalCore,
        completedUnits: derivedUnits.filter((u) => u.status === "done").length,
        units: derivedUnits,
      };
    }
    return deriveLevelView(level, completedIds);
  }, [completedIds, level, electiveTracks]);

  const currentLesson = derived?.units
    .flatMap((unit) => unit.lessons)
    .find((lesson) => lesson.state === "current");
  const firstLesson = derived?.units[0]?.lessons[0];

  const downloadedRows = useLiveQuery(
    () =>
      level.id === "opcionales"
        ? db.downloadedLessons.toArray()
        : db.downloadedLessons.where("trackId").equals(level.id).toArray(),
    [level.id],
    []
  );
  const downloadedIds = useMemo(
    () => new Set((downloadedRows ?? []).map((row) => `${row.trackId}:${row.lessonNumber}`)),
    [downloadedRows]
  );

  return {
    loadingWords,
    completedIds,
    loadError,
    setRetryKey,
    expandedGroups,
    handleGroupToggle,
    learnerLevelId,
    isNavigatingOwnLevel,
    derived,
    firstLesson,
    currentLesson,
    downloadedIds,
  };
}
