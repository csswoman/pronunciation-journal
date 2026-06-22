import { notFound } from "next/navigation";
import GrammarStudyDeck from "@/components/courses/grammar-deck/GrammarStudyDeck";
import DeckUnavailable from "@/components/courses/grammar-deck/DeckUnavailable";
import { getDeckForLesson, getDerivedRelated } from "@/lib/courses/grammar-deck/decks";
import { getLessonByNumber, parseCoursePathTrackId } from "@/lib/courses/curriculumIndex";
import type { CefrLevel } from "@/lib/core-1000/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (!deck) {
    return <DeckUnavailable lessonTitle={lesson.title} />;
  }

  const CEFR_TRACKS = ["a1", "a2", "b1", "b2", "c1"] as const;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("user_profiles").select("cefr_level").eq("id", user.id).maybeSingle()
    : { data: null };
  const profileLevel = profile?.cefr_level as CefrLevel | null | undefined;

  // The course topic is freely explorable; practice difficulty follows the learner profile.
  const cefrLevel: CefrLevel = profileLevel ?? ((CEFR_TRACKS as readonly string[]).includes(trackId)
    ? (trackId.toUpperCase() as CefrLevel)
    : "A1");

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
