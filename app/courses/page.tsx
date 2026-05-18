import CoursesClient from "@/components/courses/CoursesClient";
import { getAllMiniLessons } from "@/lib/content/lessons";

export default async function CoursesPage() {
  const miniLessons = await getAllMiniLessons();
  return <CoursesClient miniLessons={miniLessons} />;
}
