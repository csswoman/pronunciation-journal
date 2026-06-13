import CoursePathPage from "@/components/courses/CoursePathPage";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

export default function CoursesPage() {
  return <CoursePathPage curriculum={COURSE_PATH_CURRICULUM} />;
}
