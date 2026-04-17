import { getCoursesWithLessonCount } from "@/lib/notion/courses";
import CoursesClient from "@/components/courses/CoursesClient";

export const revalidate = 3600;

export default async function CoursesPage() {
  const courses = await getCoursesWithLessonCount();

  return <CoursesClient courses={courses} />;
}
