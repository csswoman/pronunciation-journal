import { notFound } from "next/navigation";
import GrammarStudyDeck from "@/components/courses/grammar-deck/GrammarStudyDeck";
import { getDeckForLesson } from "@/lib/courses/grammar-deck/decks";
import { getLessonByNumber, parseCoursePathTrackId } from "@/lib/courses/curriculumIndex";

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

  return (
    <GrammarStudyDeck
      deck={deck}
      backHref="/courses"
      backLabel="Volver a la ruta"
      courseTitle={lesson.title}
      levelId={trackId}
      lessonId={lesson.id}
    />
  );
}
