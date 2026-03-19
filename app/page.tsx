"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserStats, getTodayProgress } from "@/lib/db";
import { getAllLessons } from "@/lib/lesson-generator";
import type { UserStats, DailyProgress } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);

  const lessons = getAllLessons();

  useEffect(() => {
    async function load() {
      const [s, t] = await Promise.all([getUserStats(), getTodayProgress()]);
      setStats(s);
      setTodayProgress(t || null);
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/lesson"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
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
            href="/progress"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
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
            href="/"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📖
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Word Journal
              </p>
              <p className="text-xs text-gray-500">
                Your saved words
              </p>
            </div>
          </Link>
        </section>

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