import Link from "next/link";
import Image from "next/image";
import { getCourses } from "@/lib/notion/courses";
import type { Course } from "@/lib/notion/types";

export const revalidate = 3600;

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--deep-text)] mb-2">
            Courses
          </h1>
          <p className="text-[var(--text-secondary)]">
            Select a course to start learning
          </p>
        </header>

        {courses.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-center py-12">
            No courses found
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] overflow-hidden hover:border-[var(--primary)] hover:shadow-lg transition-all duration-200"
    >
      {course.coverImageUrl && (
        <div className="h-40 overflow-hidden">
          <Image
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            width={400}
            height={200}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          {course.level && (
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--primary)]">
              {course.level}
            </span>
          )}
          {course.lessonCount > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {course.lessonCount} lessons
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors">
          {course.title}
        </h2>
        {course.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
            {course.description}
          </p>
        )}
        <p className="text-sm font-medium text-[var(--primary)] mt-4">
          Start course →
        </p>
      </div>
    </Link>
  );
}
