"use client";

import type { Course } from "@/lib/notion/types";
import LibraryItemCard from "@/components/courses/LibraryItemCard";
import {
  getCoverHue,
  getCoverVariant,
  getDurationLabel,
  getInitials,
  getLevelLabel,
} from "@/components/courses/libraryCardHelpers";

type CourseCardModel = Course & { completedLessons?: number };

type CourseCardProps = {
  course: CourseCardModel;
  priority?: boolean;
};

function getProgress(total: number, done: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export default function CourseCard({ course, priority = false }: CourseCardProps) {
  const total = course.lessonCount ?? 0;
  const done  = course.completedLessons ?? 0;
  const progress = getProgress(total, done);
  const isCompleted = total > 0 && done >= total;
  const inProgress = done > 0 && !isCompleted;

  return (
    <LibraryItemCard
      href={`/courses/${course.slug}`}
      badge="Course"
      eyebrow={course.level ? `Course · ${course.level}` : "Course"}
      title={course.title}
      description={course.description}
      initials={getInitials(course.title)}
      coverImageUrl={course.coverImageUrl}
      coverVariant={getCoverVariant(course.title, inProgress)}
      coverHue={getCoverHue(course.title)}
      lessons={total || undefined}
      durationLabel={getDurationLabel(total)}
      levelLabel={getLevelLabel(course.level)}
      progress={progress}
      inProgress={inProgress}
      priority={priority}
    />
  );
}
