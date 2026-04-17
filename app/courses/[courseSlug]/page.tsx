import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { getCourseWithLessons, getCourses } from "@/lib/notion/courses";
import type { SubLesson } from "@/lib/notion/types";
import { LessonNumber } from "@/components/courses/LessonNumber";
import CourseHeroProgress from "@/components/courses/CourseHeroProgress";

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
      <div className="max-w-3xl mx-auto px-4">
        <nav className="flex items-center gap-1.5 text-sm mb-8">
          <Link
            href="/courses"
            className="text-[var(--text-secondary)] hover:text-[var(--deep-text)] underline-offset-2 hover:underline transition-colors duration-150 active:opacity-60"
          >
            Courses
          </Link>
          <span className="text-[var(--text-tertiary)] select-none">›</span>
          <span className="text-[var(--deep-text)] font-medium truncate">{course.title}</span>
        </nav>

        <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] overflow-hidden shadow-[0_1px_3px_var(--line-divider)]">
        <header className="mb-0">
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
                  width={100}
                  height={100}
                  className="absolute right-6 top-1/2 -translate-y-1/2 opacity-90 drop-shadow-md"
                />
              </>
            )}

            {/* Overlay gradient + text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 px-5 pb-4">
              {course.level && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white/90 mb-2 inline-block backdrop-blur-sm">
                  {course.level}
                </span>
              )}
              <h1 className="text-2xl font-bold text-white leading-tight">
                {course.title}
              </h1>
              <p className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
                <BookOpen size={11} className="opacity-80" />
                {course.lessons.length} {course.lessons.length === 1 ? "lesson" : "lessons"}
              </p>
              <CourseHeroProgress courseSlug={courseSlug} totalLessons={course.lessons.length} />
            </div>
          </div>

          {course.description && (
            <p className="text-sm text-[var(--text-secondary)] px-5 pt-4 pb-5 border-b border-[var(--line-divider)]">
              {course.description}
            </p>
          )}
        </header>

        <ol className="divide-y divide-[var(--line-divider)]">
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
        className="group flex items-center gap-4 px-5 py-4 hover:bg-[var(--btn-regular-bg)] transition-colors duration-150"
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
