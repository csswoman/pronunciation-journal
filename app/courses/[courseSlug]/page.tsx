import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseWithLessons, getCourses } from "@/lib/notion/courses";
import type { SubLesson } from "@/lib/notion/types";
import { LessonNumber } from "@/components/courses/LessonNumber";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const courses = await getCourses();
    return courses.map((c) => ({ courseSlug: c.slug }));
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export default async function CourseIndexPage({ params }: Props) {
  const { courseSlug } = await params;
  const course = await getCourseWithLessons(courseSlug);
  if (!course) notFound();

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8">
          <Link href="/courses" className="hover:text-[var(--primary)] transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span className="text-[var(--deep-text)]">{course.title}</span>
        </nav>

        <header className="mb-10 pb-8 border-b border-[var(--line-divider)]">
          {course.level && (
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--primary)] mb-4 inline-block">
              {course.level}
            </span>
          )}
          <h1 className="text-4xl font-bold text-[var(--deep-text)] mb-2">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-[var(--text-secondary)]">{course.description}</p>
          )}
          <p className="text-sm text-[var(--text-tertiary)] mt-2">
            {course.lessons.length} {course.lessons.length === 1 ? "lesson" : "lessons"}
          </p>
        </header>

        <ol className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={index}
              courseSlug={courseSlug}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  courseSlug,
}: {
  lesson: SubLesson;
  index: number;
  courseSlug: string;
}) {
  return (
    <li>
      <Link
        href={`/courses/${courseSlug}/lesson/${lesson.slug}`}
        className="group flex items-center gap-4 p-4 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:shadow-sm transition-all duration-150"
      >
        <LessonNumber courseSlug={courseSlug} lessonSlug={lesson.slug} index={index} />
        <span className="flex-1 font-medium text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors">
          {lesson.title}
        </span>
        <svg
          className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </li>
  );
}
