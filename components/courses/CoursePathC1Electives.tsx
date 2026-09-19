"use client";

import { useEffect, useState } from "react";
import CoursePathAsideProgress from "@/components/courses/CoursePathAsideProgress";
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";
import CoursePathHeroBanner from "@/components/courses/CoursePathHeroBanner";
import CoursePathSearch from "@/components/courses/CoursePathSearch";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { CoursePathLevel } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
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

export default function CoursePathC1Electives({
  tracks,
  topicImmersionMap,
}: CoursePathC1ElectivesProps) {
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const userId = await getOptionalUserId();
      if (!userId) {
        if (!cancelled) setCompletedSet(new Set());
        return;
      }

      const allKeys = tracks.flatMap((track) =>
        track.units.flatMap((unit) =>
          unit.lessons.map((lesson) => completionKey(userId, track.id, lesson.id))
        )
      );

      const rows = await db.completedLessons.bulkGet(allKeys);
      if (cancelled) return;

      const set = new Set(
        rows
          .filter((row): row is NonNullable<typeof row> => Boolean(row))
          .map((row) => `${row.courseSlug}:${row.lessonSlug}`)
      );

      setCompletedSet(set);
    }

    loadProgress().catch(() => {
      if (!cancelled) setCompletedSet(new Set());
    });

    return () => {
      cancelled = true;
    };
  }, [tracks]);

  // Featured track for the top Hero Banner (Tech / Inglés para tu área)
  const featuredTrack = tracks[0];
  const firstLesson = featuredTrack?.units[0]?.lessons[0];
  const allElectiveLessons = tracks.flatMap((t) => t.units.flatMap((u) => u.lessons));

  const currentEntry = tracks
    .flatMap((track) =>
      track.units.flatMap((unit) =>
        unit.lessons.map((lesson) => ({ lesson, track }))
      )
    )
    .find(({ lesson, track }) => !completedSet.has(`${track.id}:${lesson.id}`));
  const currentLesson = currentEntry?.lesson;
  const currentUnit = currentEntry?.track.units.find((unit) =>
    unit.lessons.some((lesson) => lesson.id === currentLesson?.id)
  );
  const currentUnitCompletedCount = currentUnit && currentEntry
    ? currentUnit.lessons.filter((lesson) =>
        completedSet.has(`${currentEntry.track.id}:${lesson.id}`)
      ).length
    : 0;

  const totalElectiveCount = allElectiveLessons.length;
  const completedElectiveCount = tracks.reduce((sum, track) => {
    let c = 0;
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        if (completedSet.has(`${track.id}:${lesson.id}`)) c++;
      }
    }
    return sum + c;
  }, 0);

  const displayFeaturedTrack: CoursePathLevel = featuredTrack
    ? {
        ...featuredTrack,
        spineLabel: "Opcionales",
      }
    : {
        id: "purposes",
        spineLabel: "Opcionales",
        spineSubtitle: "Rutas Opcionales",
        title: "Rutas Opcionales",
        units: [],
      };

  return (
    <div className="course-path__client-layout">
      <div className="course-path__client-main">
        {firstLesson && currentEntry && (
          <CoursePathHeroBanner
            levelId={currentEntry.track.id}
            levelTitle={currentEntry.track.title}
            levelSpineLabel={currentEntry.track.spineLabel}
            firstLesson={firstLesson}
            currentLesson={currentLesson}
            hasProgress={completedSet.size > 0}
            unitCompletedCount={currentUnitCompletedCount}
            unitTotalCount={currentUnit?.lessons.length}
          />
        )}

        <div className="course-path__main-search mb-3 sm:mb-4">
          <CoursePathSearch />
        </div>

        <div className="course-path__rutas" aria-label="Rutas opcionales">
          {tracks.map((track, i) => (
            <CoursePathElectiveTrack
              key={track.id}
              level={track}
              defaultOpen={i === 0}
              topicImmersionMap={topicImmersionMap}
              hideHero
            />
          ))}
        </div>
      </div>

      <div className="course-path__client-aside mt-8 lg:mt-0">
        <CoursePathAsideProgress
          level={displayFeaturedTrack}
          selectedLevelId="purposes"
          completedCount={completedElectiveCount}
          totalCount={totalElectiveCount}
          showCheckpoint={false}
        />
      </div>
    </div>
  );
}
