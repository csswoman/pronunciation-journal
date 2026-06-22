import CoursePathPage from "@/components/courses/CoursePathPage";

interface CoursesPageProps {
  searchParams: Promise<{ level?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { level } = await searchParams;

  return <CoursePathPage levelParam={level} />;
}
