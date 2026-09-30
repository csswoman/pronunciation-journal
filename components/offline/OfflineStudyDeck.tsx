"use client";

// Planned structure:
// <OfflineStudyDeck>
//   <GrammarStudyDeck />
// </OfflineStudyDeck>

import dynamic from "next/dynamic";
import type { CoursePathTrackId } from "@/lib/courses/types";
import type { DownloadedLessonRecord } from "@/lib/db";
import { OfflineLoadingState } from "./OfflineLoadingState";

const GrammarStudyDeck = dynamic(
  () => import("@/components/courses/grammar-deck/GrammarStudyDeck"),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState
        message="Abriendo la lección descargada…"
        error={error}
        retry={retry}
      />
    ),
  },
);

export function OfflineStudyDeck({ lesson }: { lesson: DownloadedLessonRecord }) {
  return (
    <div className="min-h-screen">
      <GrammarStudyDeck
        deck={lesson.deck}
        backHref="/offline"
        backLabel="Volver a mis descargas"
        courseTitle={lesson.title}
        levelId={lesson.trackId as CoursePathTrackId}
        lessonId={String(lesson.lessonNumber)}
        deckSlug={lesson.slug}
      />
    </div>
  );
}
