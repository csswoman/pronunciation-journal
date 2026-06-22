import CourseLessonView from "@/components/courses/CourseLessonView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ level?: string; lesson?: string }>;
}

export default async function CourseLessonPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { level, lesson } = await searchParams;

  const levelId =
    level === "a1" ||
    level === "a2" ||
    level === "b1" ||
    level === "b2" ||
    level === "c1" ||
    level === "purposes" ||
    level === "business"
      ? level
      : undefined;

  return <CourseLessonView slug={slug} levelId={levelId} lessonId={lesson} />;
}
