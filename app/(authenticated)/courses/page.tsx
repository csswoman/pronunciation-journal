import CoursePathPage from "@/components/courses/CoursePathPage";
import { fetchServerTopicImmersionMap } from "@/lib/immersion/server-queries";

interface CoursesPageProps {
  searchParams: Promise<{ level?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { level } = await searchParams;
  const topicImmersionMap = await fetchServerTopicImmersionMap().catch(() => ({}));

  return <CoursePathPage levelParam={level} topicImmersionMap={topicImmersionMap} />;
}
