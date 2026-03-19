"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/types";

interface LessonCardProps {
  lesson: Lesson;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-200 dark:border-yellow-800",
    gradient: "from-yellow-500/10 to-amber-500/10",
  },
  hard: {
    label: "Hard",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    gradient: "from-red-500/10 to-rose-500/10",
  },
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const config = difficultyConfig[lesson.difficulty];

  return (
    <Link href={`/lesson/${lesson.id}`}>
      <div
        className={`
          group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 p-6
          hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-600
          transition-all duration-300 cursor-pointer
          hover:-translate-y-1
        `}
      >
        {/* Gradient background on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {lesson.title}
            </h3>
            <span
              className={`
                px-2.5 py-0.5 rounded-full text-xs font-medium
                ${config.bg} ${config.color} ${config.border} border
              `}
            >
              {config.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {lesson.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {lesson.words.length} words
            </span>

            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
