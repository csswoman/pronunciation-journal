import MiniLessonsBrowser from "@/components/mini-lessons/MiniLessonsBrowser";
import { getAllMiniLessons } from "@/lib/content/lessons";

export default async function MiniLessonsPage() {
  const lessons = await getAllMiniLessons();
  return <MiniLessonsBrowser lessons={lessons} />;
}
