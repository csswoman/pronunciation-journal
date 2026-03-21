"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserStats, getTodayProgress, getFavorites, getNeedsPracticeWords } from "@/lib/db";
import { getAllLessons } from "@/lib/lesson-generator";
import type { UserStats, DailyProgress, FavoriteWord } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [needsPractice, setNeedsPractice] = useState<{ word: string; lessonId: string; bestAccuracy: number; attempts: number }[]>([]);

  const lessons = getAllLessons();

  useEffect(() => {
    async function load() {
      const [s, t, favs, needs] = await Promise.all([
        getUserStats(),
        getTodayProgress(),
        getFavorites(),
        getNeedsPracticeWords(),
      ]);
      setStats(s);
      setTodayProgress(t || null);
      setFavorites(favs);
      setNeedsPractice(needs);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <header className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-2">
            Pronunciation Journal
          </h1>
          <p className="text-indigo-200 text-sm">
            Practice your English pronunciation with AI-powered feedback
          </p>

          {/* Quick Stats */}
          {stats && (
            <div className="flex gap-6 mt-6">
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-indigo-300">🔥 Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalXP}</p>
                <p className="text-xs text-indigo-300">⚡ XP</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
                <p className="text-xs text-indigo-300">🎯 Accuracy</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Progress */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Today&apos;s Progress
          </h2>
          {todayProgress ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {todayProgress.totalAttempts}
                </p>
                <p className="text-xs text-gray-500">Attempts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {todayProgress.averageAccuracy}%
                </p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  +{todayProgress.xp}
                </p>
                <p className="text-xs text-gray-500">XP Earned</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No practice today yet
              </p>
              <Link
                href="/lesson"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                🎤 Start Practicing
              </Link>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/lesson"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              🎤
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Lessons
              </p>
              <p className="text-xs text-gray-500">
                {lessons.length} lessons available
              </p>
            </div>
          </Link>

          <Link
            href="/ipa"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              🔊
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                IPA Sounds
              </p>
              <p className="text-xs text-gray-500">
                Master 100+ sounds
              </p>
            </div>
          </Link>

          <Link
            href="/progress"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              📊
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Progress
              </p>
              <p className="text-xs text-gray-500">
                Track your improvement
              </p>
            </div>
          </Link>

          <Link
            href="/ai-practice"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
              🤖
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                AI Practice
              </p>
              <p className="text-xs text-gray-500">
                Chat with your tutor
              </p>
            </div>
          </Link>
        </section>

        {/* Favorites */}
        {favorites.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ❤️ Favorites
            </h2>
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/lesson/${fav.lessonId}`}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{fav.word}</span>
                  {fav.ipa && (
                    <span className="text-xs text-indigo-500 dark:text-indigo-400 font-mono">{fav.ipa}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Needs Practice */}
        {needsPractice.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💪 Necesito practicar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {needsPractice.slice(0, 8).map((item) => (
                <Link
                  key={item.word}
                  href={`/lesson/${item.lessonId}`}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.word}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Mejor: {item.bestAccuracy}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.attempts}x
                    </span>
                  </div>
                  <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${item.bestAccuracy}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available Lessons Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Available Lessons
            </h2>
            <Link
              href="/lesson"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lessons.slice(0, 3).map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {lesson.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {lesson.words.length} words
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lesson.difficulty === "easy"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : lesson.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {lesson.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}