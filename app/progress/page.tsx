"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserStats, getProgressHistory } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserStats, DailyProgress } from "@/lib/types";

interface RecentAttempt {
  word: string
  isCorrect: boolean
  timestamp: string
}

async function getRecentAttemptsFromSupabase(limit: number): Promise<RecentAttempt[]> {
  const supabase = getSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('answer_history')
    .select('target_word, is_correct, answered_at')
    .eq('user_id', user.id)
    .order('answered_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(r => ({
    word: r.target_word ?? '—',
    isCorrect: r.is_correct,
    timestamp: r.answered_at ?? new Date().toISOString(),
  }))
}

export default function ProgressPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);

  useEffect(() => {
    async function load() {
      const [s, h, a] = await Promise.all([
        getUserStats(),
        getProgressHistory(7),
        getRecentAttemptsFromSupabase(20),
      ]);
      setStats(s);
      setHistory(h);
      setRecentAttempts(a);
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{
          borderColor: 'var(--line-divider)',
          borderTopColor: 'transparent',
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <header className="bg-card-bg border-b border-line-divider">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-btn-plain-hover transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
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
            color="text-warning"
          />
          <StatCard
            icon="⚡"
            value={stats.totalXP}
            label="Total XP"
            color="text-warning"
          />
          <StatCard
            icon="🎯"
            value={`${stats.averageAccuracy}%`}
            label="Avg Accuracy"
            color="text-success"
          />
          <StatCard
            icon="📚"
            value={stats.totalAttempts}
            label="Total Attempts"
            color="text-info"
          />
        </div>

        {/* Weekly Activity */}
        <div className="bg-card-bg rounded-2xl border border-line-divider p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
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
                      <span className="text-xs text-[var(--text-secondary)] mb-1">
                        {dayData.totalAttempts}
                      </span>
                    )}
                    <div
                      className="w-full max-w-[40px] rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        background: dayData
                          ? 'linear-gradient(to top, var(--primary), var(--title-active))'
                          : 'var(--btn-regular-bg)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="bg-card-bg rounded-2xl border border-line-divider p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Recent Attempts
          </h2>
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-center py-8 text-[var(--text-secondary)]">
              No attempts yet. Start a lesson to see your progress!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAttempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-btn-regular"
                >
                  <div className="flex items-center gap-3">
                    <span>{attempt.isCorrect ? "✅" : "❌"}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {attempt.word}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {new Date(attempt.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
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
    <div className="bg-card-bg rounded-2xl border border-line-divider p-4 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs mt-1 text-[var(--text-secondary)]">{label}</p>
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
