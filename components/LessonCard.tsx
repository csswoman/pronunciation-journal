"use client";

import Link from "next/link";
import Image from "next/image";
import type { LessonListItem } from "@/lib/groupLessonsByLevel";

type LessonCardProps = {
  lesson: LessonListItem;
};

function toLabel(value: string | null): string {
  if (!value) return "General";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const href = lesson.slug ? `/lessons/${lesson.slug}` : `/lesson/${lesson.id}`;

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {lesson.image_url ? (
        <div className="relative h-36 w-full overflow-hidden bg-[var(--btn-regular-bg)]">
          <Image
            src={lesson.image_url}
            alt={lesson.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]">
          <span className="text-xs font-medium">No cover</span>
        </div>
      )}

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-[var(--deep-text)] transition group-hover:text-[var(--primary)]">
          {lesson.title}
        </h3>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--btn-regular-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            {toLabel(lesson.category)}
          </span>
          <span className="rounded-full bg-[var(--btn-regular-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            {lesson.level ?? "No level"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              lesson.is_system
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {lesson.is_system ? "System" : "Mine"}
          </span>
        </div>
      </div>
    </Link>
  );
}
