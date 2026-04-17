import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonInCourse, getCourses, getCourseWithLessons } from "@/lib/notion/courses";
import { NotionBlockRenderer } from "@/components/lessons/NotionToggleList";
import LessonCompleteButton from "@/components/courses/LessonCompleteButton";

const illustrationFiles = [
  "/illustrations/lesson/brain.svg",
  "/illustrations/lesson/headset.svg",
  "/illustrations/lesson/jigsaw.svg",
  "/illustrations/lesson/mic.svg",
  "/illustrations/lesson/paper.svg",
  "/illustrations/lesson/sound.svg",
  "/illustrations/lesson/voice.svg",
];

function getCourseIllustration(title: string) {
  return illustrationFiles[title.length % illustrationFiles.length];
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const courses = await getCourses();
    const params: { courseSlug: string; lessonSlug: string }[] = [];

    for (const course of courses) {
      try {
        const full = await getCourseWithLessons(course.slug);
        if (!full) continue;
        for (const lesson of full.lessons) {
          params.push({ courseSlug: course.slug, lessonSlug: lesson.slug });
        }
      } catch {
        // Skip courses that fail to load — pages will render on-demand
      }
    }

    return params;
  } catch {
    return [];
  }
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
      <div className="max-w-3xl mx-auto px-4">
        <nav className="flex items-center gap-1.5 text-sm mb-8 pt-10">
          <Link
            href="/courses"
            className="text-[var(--text-secondary)] hover:text-[var(--deep-text)] underline-offset-2 hover:underline transition-colors duration-150 active:opacity-60"
          >
            Courses
          </Link>
          <span className="text-[var(--text-tertiary)] select-none">›</span>
          <Link
            href={`/courses/${courseSlug}`}
            className="text-[var(--text-secondary)] hover:text-[var(--deep-text)] underline-offset-2 hover:underline transition-colors duration-150 active:opacity-60 truncate max-w-[160px]"
          >
            {course.title}
          </Link>
          <span className="text-[var(--text-tertiary)] select-none">›</span>
          <span className="text-[var(--deep-text)] font-medium truncate">{lesson.title}</span>
        </nav>

        <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] overflow-hidden shadow-[0_1px_3px_var(--line-divider)] mb-10">
          <header>
            <div
              className="relative w-full h-64 rounded-t-2xl overflow-hidden flex flex-col justify-end"
              style={{
                background: `linear-gradient(135deg, oklch(.45 .18 250) 0%, oklch(.55 .14 290) 100%)`,
              }}
            >
              {course.coverImageUrl ? (
                <Image
                  src={course.coverImageUrl}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_60%)]" />
                  <Image
                    src={getCourseIllustration(course.title)}
                    alt=""
                    width={90}
                    height={90}
                    className="absolute right-6 top-1/2 -translate-y-1/2 opacity-90 drop-shadow-md"
                  />
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="relative z-10 px-5 pb-4">
                {course.level && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white/90 mb-2 inline-block backdrop-blur-sm">
                    {course.level}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white leading-tight">
                  {lesson.title}
                </h1>
                <p className="text-xs text-white/60 mt-1">
                  {course.title} · Updated {new Date(lesson.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </header>

          <article className="prose prose-neutral dark:prose-invert max-w-none px-5 py-8">
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

          <div className="flex justify-end px-5 pb-6 border-t border-[var(--line-divider)] pt-5">
            <LessonCompleteButton courseSlug={courseSlug} lessonSlug={lessonSlug} />
          </div>
        </div>

        <nav className="flex items-stretch gap-4 pb-10">
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
