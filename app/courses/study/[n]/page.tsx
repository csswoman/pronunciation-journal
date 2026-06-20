import { notFound } from "next/navigation";
import GrammarStudyDeck from "@/components/courses/grammar-deck/GrammarStudyDeck";
import { getDeckForLesson, getDerivedRelated } from "@/lib/courses/grammar-deck/decks";
import { getLessonByNumber, parseCoursePathTrackId } from "@/lib/courses/curriculumIndex";
import type { CefrLevel } from "@/lib/core-1000/types";

interface PageProps {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ level?: string }>;
}

export default async function CourseStudyPage({ params, searchParams }: PageProps) {
  const { n } = await params;
  const { level: levelParam } = await searchParams;

  const lessonNumber = Number.parseInt(n, 10);
  const trackId = parseCoursePathTrackId(levelParam);

  if (!trackId || !Number.isFinite(lessonNumber) || lessonNumber < 1) {
    notFound();
  }

  const lesson = getLessonByNumber(trackId, lessonNumber);
  if (!lesson) {
    notFound();
  }

  const deck = getDeckForLesson(lesson.slug);

  // CEFR tracks map straight to Core 1000 levels; elective tracks default to A1
  const CEFR_TRACKS = ['a1', 'a2', 'b1', 'b2', 'c1'] as const
  const cefrLevel: CefrLevel = (CEFR_TRACKS as readonly string[]).includes(trackId)
    ? (trackId.toUpperCase() as CefrLevel)
    : 'A1'

  // Use authored related links if present; otherwise derive from curriculum siblings
  const relatedLinks =
    deck.related && deck.related.length > 0
      ? deck.related
      : lesson.slug
        ? getDerivedRelated(trackId, lesson.slug, 3)
        : [];

  return (
    <GrammarStudyDeck
      deck={deck}
      backHref="/courses"
      backLabel="Volver a la ruta"
      courseTitle={lesson.title}
      levelId={trackId}
      lessonId={lesson.id}
      deckSlug={lesson.slug}
      cefrLevel={cefrLevel}
      relatedLinks={relatedLinks}
    />
  );
}
