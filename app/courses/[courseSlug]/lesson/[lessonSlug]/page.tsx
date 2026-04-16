import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonInCourse, getCourses, getCourseWithLessons } from "@/lib/notion/courses";
import { NotionBlockRenderer } from "@/components/lessons/NotionToggleList";

export const revalidate = 3600;

export async function generateStaticParams() {
  const courses = await getCourses();
  const params: { courseSlug: string; lessonSlug: string }[] = [];

  for (const course of courses) {
    const full = await getCourseWithLessons(course.slug);
    if (!full) continue;
    for (const lesson of full.lessons) {
      params.push({ courseSlug: course.slug, lessonSlug: lesson.slug });
    }
  }

  return params;
}

interface Props {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;
  const result = await getLessonInCourse(courseSlug, lessonSlug);
  if (!result) notFound();

  const { lesson, course, prev, next } = result;

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8 flex-wrap">
          <Link href="/courses" className="hover:text-[var(--primary)] transition-colors">
            Courses
          </Link>
          <span>/</span>
          <Link
            href={`/courses/${courseSlug}`}
            className="hover:text-[var(--primary)] transition-colors"
          >
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-[var(--deep-text)]">{lesson.title}</span>
        </nav>

        <header className="mb-10 pb-8 border-b border-[var(--line-divider)]">
          <h1 className="text-3xl font-bold text-[var(--deep-text)] mb-2">
            {lesson.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Updated {new Date(lesson.updatedAt).toLocaleDateString()}
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none mb-16">
          {lesson.content.length > 0 ? (
            lesson.content.map((block) => (
              <NotionBlockRenderer key={block.id} block={block} />
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">
              This lesson has no content yet.
            </p>
          )}
        </article>

        <nav className="flex items-stretch gap-4 border-t border-[var(--line-divider)] pt-8">
          {prev ? (
            <Link
              href={`/courses/${courseSlug}/lesson/${prev.slug}`}
              className="flex-1 flex flex-col gap-1 p-4 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:bg-[var(--btn-plain-bg-hover)] transition-all text-left group"
            >
              <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                ← Previous
              </span>
              <span className="text-sm font-medium text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {next ? (
            <Link
              href={`/courses/${courseSlug}/lesson/${next.slug}`}
              className="flex-1 flex flex-col gap-1 p-4 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:bg-[var(--btn-plain-bg-hover)] transition-all text-right group"
            >
              <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                Next →
              </span>
              <span className="text-sm font-medium text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors">
                {next.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </div>
    </div>
  );
}
