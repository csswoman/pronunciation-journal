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

  // Generate an icon based on lesson title
  const getIcon = () => {
    const title = lesson.title.toLowerCase();
    if (title.includes("sound")) return "🔊";
    if (title.includes("vowel")) return "💬";
    if (title.includes("greeting")) return "👋";
    if (title.includes("restaurant")) return "🍽️";
    if (title.includes("intonation")) return "🎵";
    if (title.includes("r") || title.includes("l")) return "🎵";
    return "💡";
  };

  return (
    <Link href={lesson.href ?? `/lesson/${lesson.id}`}>
      <div
        className="group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer p-6 hover:shadow-lg"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--line-divider)',
        }}
      >
        <div className="relative z-10">
          {/* Icon and Difficulty */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">{getIcon()}</div>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white uppercase"
              style={{
                backgroundColor: config.bgColor,
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2 transition-colors" style={{
            color: 'var(--text-primary)',
          }}>
            {lesson.title}
          </h3>

          {/* Description */}
          <p className="text-sm mb-4 line-clamp-2" style={{
            color: 'var(--text-secondary)',
          }}>
            {lesson.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-xs" style={{
            color: 'var(--text-secondary)',
          }}>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.884 2 16.5S6.5 26.747 12 26.747s10-4.631 10-10.247S17.5 6.253 12 6.253z" />
              </svg>
              {lesson.words.length} words
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lesson.exerciseCount || lesson.words.length > 5 ? `${Math.ceil(lesson.words.length / 3)}` : "3"} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mb-4" style={{
            backgroundColor: 'var(--btn-regular-bg)',
          }}>
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: config.bgColor,
                width: '45%',
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{
              color: 'var(--primary)',
            }}>
              Start
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
