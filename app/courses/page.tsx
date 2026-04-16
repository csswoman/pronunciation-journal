import { getCourses } from "@/lib/notion/courses";
import CoursesClient from "@/components/courses/CoursesClient";

export const revalidate = 3600;

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CoursesClient courses={courses} />;
}
