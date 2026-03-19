"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserStats, getProgressHistory, getRecentAttempts } from "@/lib/db";
import type { UserStats, DailyProgress, Attempt } from "@/lib/types";

export default function ProgressPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    async function load() {
      const [s, h, a] = await Promise.all([
        getUserStats(),
        getProgressHistory(7),
        getRecentAttempts(20),
      ]);
      setStats(s);
      setHistory(h);
      setRecentAttempts(a);
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              My Progress
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="🔥"
            value={stats.currentStreak}
            label="Day Streak"
            color="text-orange-500"
          />
          <StatCard
            icon="⚡"
            value={stats.totalXP}
            label="Total XP"
            color="text-yellow-500"
          />
          <StatCard
            icon="🎯"
            value={`${stats.averageAccuracy}%`}
            label="Avg Accuracy"
            color="text-green-500"
          />
          <StatCard
            icon="📚"
            value={stats.totalAttempts}
            label="Total Attempts"
            color="text-blue-500"
          />
        </div>

        {/* Weekly Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Weekly Activity
          </h2>
          <div className="flex items-end gap-2 h-32">
            {getLast7Days().map((day) => {
              const dayData = history.find((h) => h.date === day.date);
              const maxAttempts = Math.max(...history.map((h) => h.totalAttempts), 1);
              const height = dayData
                ? Math.max((dayData.totalAttempts / maxAttempts) * 100, 8)
                : 8;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-24">
                    {dayData && (
                      <span className="text-xs text-gray-500 mb-1">
                        {dayData.totalAttempts}
                      </span>
                    )}
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                        dayData
                          ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Attempts
          </h2>
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No attempts yet. Start a lesson to see your progress!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAttempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span>{attempt.isCorrect ? "✅" : "❌"}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {attempt.word}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(attempt.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      attempt.accuracy >= 80
                        ? "text-green-500"
                        : attempt.accuracy >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {attempt.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function getLast7Days(): { date: string; label: string }[] {
  const days = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: labels[d.getDay()],
    });
  }
  return days;
}
