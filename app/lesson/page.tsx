"use client";

import { getAllLessons } from "@/lib/lesson-generator";
import LessonCard from "@/components/lesson/LessonCard";
import Link from "next/link";

export default function LessonsPage() {
  const lessons = getAllLessons();

  const categories = [...new Set(lessons.map((l) => l.category))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Pronunciation Lessons
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a lesson to practice your pronunciation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Lessons Grid */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 capitalize">
              {category.replace(/-/g, " ")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons
                .filter((l) => l.category === category)
                .map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
