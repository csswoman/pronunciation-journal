"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import type { CefrLevelId } from "@/lib/courses/types";

interface LevelProgressEntry {
  id: CefrLevelId;
  lessonIds: string[];
}

interface CoursePathAutoLevelSyncProps {
  hasExplicitLevel: boolean;
  levels: LevelProgressEntry[];
}

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

export default function CoursePathAutoLevelSync({
  hasExplicitLevel,
  levels,
}: CoursePathAutoLevelSyncProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hasExplicitLevel) return;

    let cancelled = false;

    async function syncLevel() {
      const userId = await getOptionalUserId();
      let activeLevelId: CefrLevelId | null = null;

      if (userId) {
        try {
          const counts = await Promise.all(
            levels.map(async (level) => {
              const rows = await db.completedLessons.bulkGet(
                level.lessonIds.map((lessonId) => completionKey(userId, level.id, lessonId))
              );

              return {
                id: level.id,
                count: rows.filter(Boolean).length,
              };
            })
          );

          if (cancelled) return;

          const activeLevel = [...counts].reverse().find((level) => level.count > 0);
          if (activeLevel) {
            activeLevelId = activeLevel.id;
          } else {
            const stateRow = await db.learningState?.get(userId);
            const userEst = stateRow?.state?.level?.cefrEstimate;
            if (userEst) {
              activeLevelId = parseCefrLevelId(userEst.toLowerCase());
            }
          }
        } catch {
          /* Fallback a nivel local de estudio */
        }
      }

      if (!activeLevelId) {
        activeLevelId = parseCefrLevelId(readGuestStudyLevel().toLowerCase());
      }

      if (cancelled) return;

      if (activeLevelId && activeLevelId !== "a1") {
        router.replace(`${pathname}?level=${activeLevelId}`, { scroll: false });
      }
    }

    syncLevel().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [hasExplicitLevel, levels, pathname, router]);

  return null;
}
