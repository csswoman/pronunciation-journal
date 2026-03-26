"use client";

import { useState, useEffect } from "react";
import { getAllLessons } from "@/lib/lesson-generator";
import { getFavorites, getNeedsPracticeWords } from "@/lib/db";
import Link from "next/link";
import type { Lesson, FavoriteWord } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  basics: "Basics",
  "common-words": "Common Words",
  "difficult-sounds": "Difficult Sounds",
};

const categoryFilters = ["All", "Basics", "Sounds", "Phrases"];

const difficultyBadge: Record<string, { label: string; className: string }> = {
  easy: { label: "EASY", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  medium: { label: "MEDIUM", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  hard: { label: "ADVANCED", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" },
};

const categoryIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
  basics: {
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    icon: (
      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  "common-words": {
    bg: "bg-green-100 dark:bg-green-900/40",
    icon: (
      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  "difficult-sounds": {
    bg: "bg-rose-100 dark:bg-rose-900/40",
    icon: (
      <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
};

function estimateMinutes(wordCount: number) {
  return Math.max(1, Math.round((wordCount * 20) / 60));
}

function FeaturedCard({ lesson, continued = false }: { lesson: Lesson; continued?: boolean }) {
  const badge = difficultyBadge[lesson.difficulty];
  const icon = categoryIcon[lesson.category] ?? categoryIcon["basics"];

  return (
    <Link href={`/lesson/${lesson.id}`} className="block h-full">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${icon.bg}`}>
            {icon.icon}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{lesson.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{lesson.description}</p>
        <button className={`text-sm font-medium px-4 py-2 rounded-lg w-full transition-colors ${
          continued
            ? "border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        }`}>
          {continued ? "Continue" : "Start"}
        </button>
      </div>
    </Link>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const icon = categoryIcon[lesson.category] ?? categoryIcon["basics"];
  const minutes = estimateMinutes(lesson.words.length);
  const progressColor =
    lesson.difficulty === "easy"
      ? "bg-green-500"
      : lesson.difficulty === "medium"
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <Link href={`/lesson/${lesson.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${icon.bg}`}>
            {icon.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {lesson.title}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {lesson.words.length} words
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {minutes} min
              </span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full ${progressColor}`} style={{ width: "30%" }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RightSidebar({
  needsPractice,
  favorites,
}: {
  needsPractice: { word: string; lessonId: string; bestAccuracy: number; attempts: number }[];
  favorites: FavoriteWord[];
}) {
  return (
    <aside className="w-72 flex-shrink-0 space-y-4">
      {/* Review Required */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Review Required</p>
              <p className="text-red-200 text-xs">
                {needsPractice.length > 0
                  ? `${needsPractice.length} critical mistake${needsPractice.length !== 1 ? "s" : ""}`
                  : "All good!"}
              </p>
            </div>
          </div>
          <p className="text-red-100 text-xs mt-2">
            Fix recurring errors before they become permanent habits.
          </p>
        </div>

        {needsPractice.length > 0 ? (
          <div className="p-3 space-y-2">
            {needsPractice.slice(0, 4).map((item) => (
              <Link
                key={item.word}
                href={`/lesson/${item.lessonId}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 capitalize">
                  {item.word}
                </span>
                <span className="text-xs text-rose-500 font-semibold">{item.bestAccuracy}%</span>
              </Link>
            ))}
            {needsPractice.length > 4 && (
              <p className="text-xs text-center text-gray-400 pt-1">
                +{needsPractice.length - 4} more words
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-400">
            No words to review yet.
          </div>
        )}

        <div className="px-3 pb-3">
          <button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Review Now
          </button>
        </div>
      </div>

      {/* Your Words / Saved */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-semibold">Your Words</p>
            <span className="text-indigo-300 text-xs">{favorites.length} saved</span>
          </div>

          {favorites.length > 0 ? (
            <div className="mt-3 space-y-2">
              {favorites.slice(0, 5).map((fav) => (
                <div key={fav.id ?? fav.word} className="bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-white text-sm font-medium capitalize">{fav.word}</p>
                  {fav.ipa && (
                    <div className="mt-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: "60%" }} />
                    </div>
                  )}
                </div>
              ))}
              {favorites.length > 5 && (
                <p className="text-indigo-300 text-xs text-center pt-1">
                  +{favorites.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-indigo-300 text-sm mt-3">
              No saved words yet. Star words during lessons to save them here.
            </p>
          )}

          <Link
            href="/vocabulary"
            className="mt-4 block text-center text-indigo-200 hover:text-white text-sm font-medium transition-colors"
          >
            View Vocabulary →
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function LessonsPage() {
  const lessons = getAllLessons();
  const [activeFilter, setActiveFilter] = useState("All");
  const [needsPractice, setNeedsPractice] = useState<
    { word: string; lessonId: string; bestAccuracy: number; attempts: number }[]
  >([]);
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);

  useEffect(() => {
    async function load() {
      const [practice, favs] = await Promise.all([
        getNeedsPracticeWords(),
        getFavorites(),
      ]);
      setNeedsPractice(practice);
      setFavorites(favs);
    }
    load();
  }, []);

  const categories = [...new Set(lessons.map((l) => l.category))];
  const featured = lessons.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F2F0FB] dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Lessons</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Improve your pronunciation with structured practice
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {categoryFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Recommended for you */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recommended for you</h2>
                <Link href="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View all
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featured.map((lesson, i) => (
                  <FeaturedCard key={lesson.id} lesson={lesson} continued={i === 0} />
                ))}
              </div>
            </section>

            {/* Categories */}
            {categories.map((category) => {
              const categoryLessons = lessons.filter((l) => l.category === category);
              const label = categoryLabels[category] ?? category.replace(/-/g, " ");
              return (
                <section key={category} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{label}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryLessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block">
            <RightSidebar needsPractice={needsPractice} favorites={favorites} />
          </div>
        </div>
      </div>
    </div>
  );
}
