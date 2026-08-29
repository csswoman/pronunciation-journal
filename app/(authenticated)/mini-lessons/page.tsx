import MiniLessonsBrowser from "@/components/mini-lessons/MiniLessonsBrowser";
import PageLayout from "@/components/layout/PageLayout";
import { getAllMiniLessons } from "@/lib/content/lessons";

export default async function MiniLessonsPage() {
  const lessons = await getAllMiniLessons();
  return (
    <PageLayout archetype="catalog">
      <MiniLessonsBrowser lessons={lessons} />
    </PageLayout>
  );
}
