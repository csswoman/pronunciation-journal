"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/types";

interface LessonCardProps {
  lesson: Lesson;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    bgColor: "var(--admonitions-color-tip)",
    textColor: "white",
  },
  medium: {
    label: "Medium",
    bgColor: "var(--admonitions-color-warning)",
    textColor: "white",
  },
  hard: {
    label: "Hard",
    bgColor: "var(--admonitions-color-caution)",
    textColor: "white",
  },
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const config = difficultyConfig[lesson.difficulty];

  return (
    <Link href={lesson.href ?? `/lesson/${lesson.id}`}>
      <div
        className="group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--line-divider)',
        }}
      >
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold transition-colors" style={{
              color: 'var(--text-primary)',
            }}>
              {lesson.title}
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{
                backgroundColor: config.bgColor,
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm mb-4 line-clamp-2" style={{
            color: 'var(--text-secondary)',
          }}>
            {lesson.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{
              color: 'var(--text-secondary)',
            }}>
              {lesson.exerciseCount
                ? `${lesson.exerciseCount} exercises`
                : `${lesson.words.length} words`}
            </span>

            <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{
              color: 'var(--primary)',
            }}>
              Start lesson
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
