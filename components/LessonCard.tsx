"use client";

import Link from "next/link";
import type { LessonListItem } from "@/lib/groupLessonsByLevel";
import LessonCover from "@/components/lesson-card/LessonCover";
import LessonBadges from "@/components/lesson-card/LessonBadges";
import LessonTitle from "@/components/lesson-card/LessonTitle";
import { getLessonHref } from "@/components/lesson-card/utils";

type LessonCardProps = {
  lesson: LessonListItem;
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const href = getLessonHref(lesson);

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <LessonCover imageUrl={lesson.image_url ?? null} title={lesson.title} />

      <div className="space-y-3 p-4">
        <LessonTitle title={lesson.title} />
        <LessonBadges
          category={lesson.category}
          level={lesson.level}
          isSystem={lesson.is_system}
        />
      </div>
    </Link>
  );
}
