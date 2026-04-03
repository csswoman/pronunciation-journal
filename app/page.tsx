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
    <div className="min-h-screen bg-page-bg">
      {/* Hero Header */}
      <header className="text-white" style={{backgroundColor: 'var(--card-bg)'}}>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-2">
            Pronunciation Journal
          </h1>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.9)'}}>
            Practice your English pronunciation with AI-powered feedback
          </p>

          {/* Quick Stats */}
          {stats && (
            <div className="flex gap-6 mt-6">
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.8)'}}>🔥 Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalXP}</p>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.8)'}}>⚡ XP</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.8)'}}>🎯 Accuracy</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Progress */}
        <section className="bg-card-bg rounded-2xl border border-line-divider p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Today&apos;s Progress
          </h2>
          {todayProgress ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold" style={{color: 'var(--primary)'}}>
                  {todayProgress.totalAttempts}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Attempts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold" style={{color: 'var(--admonitions-color-tip)'}}>
                  {todayProgress.averageAccuracy}%
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold" style={{color: 'var(--admonitions-color-warning)'}}>
                  +{todayProgress.xp}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">XP Earned</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-3 text-[var(--text-secondary)]">
                No practice today yet
              </p>
              <Link
                href="/lesson"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
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
            className="group flex items-center gap-4 p-5 bg-card-bg rounded-2xl border hover:shadow-lg transition-all"
            style={{
              borderColor: 'var(--line-divider)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admonitions-color-tip)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line-divider)')}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              🎤
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Lessons
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {lessons.length} lessons available
              </p>
            </div>
          </Link>

          <Link
            href="/ipa"
            className="group flex items-center gap-4 p-5 bg-card-bg rounded-2xl border hover:shadow-lg transition-all"
            style={{
              borderColor: 'var(--line-divider)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admonitions-color-important)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line-divider)')}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              🔊
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                IPA Sounds
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Master 100+ sounds
              </p>
            </div>
          </Link>

          <Link
            href="/progress"
            className="group flex items-center gap-4 p-5 bg-card-bg rounded-2xl border hover:shadow-lg transition-all"
            style={{
              borderColor: 'var(--line-divider)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admonitions-color-warning)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line-divider)')}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              📊
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Progress
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Track your improvement
              </p>
            </div>
          </Link>

          <Link
            href="/ai-practice"
            className="group flex items-center gap-4 p-5 bg-card-bg rounded-2xl border hover:shadow-lg transition-all"
            style={{
              borderColor: 'var(--line-divider)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admonitions-color-caution)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line-divider)')}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner" style={{
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              🤖
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                AI Practice
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Chat with your tutor
              </p>
            </div>
          </Link>
        </section>

        {/* Favorites */}
        {favorites.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              ❤️ Favorites
            </h2>
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/lesson/${fav.lessonId}`}
                  className="flex items-center gap-2 px-3 py-2 bg-card-bg rounded-xl border transition-colors"
                  style={{
                    borderColor: 'var(--admonitions-color-caution)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <span className="font-medium text-[var(--text-primary)]">{fav.word}</span>
                  {fav.ipa && (
                    <span className="text-xs font-mono" style={{color: 'var(--primary)'}}>{fav.ipa}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Needs Practice */}
        {needsPractice.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              💪 Necesito practicar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {needsPractice.slice(0, 8).map((item) => (
                <Link
                  key={item.word}
                  href={`/lesson/${item.lessonId}`}
                  className="p-3 bg-card-bg rounded-xl border transition-colors"
                  style={{
                    borderColor: 'var(--admonitions-color-warning)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <p className="font-medium text-[var(--text-primary)]">{item.word}</p>
                  <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{color: 'var(--admonitions-color-warning)'}}>
                      Mejor: {item.bestAccuracy}%
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {item.attempts}x
                    </span>
                  </div>
                  <div className="mt-1.5 w-full bg-btn-regular rounded-full h-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.bestAccuracy}%`,
                        backgroundColor: 'var(--admonitions-color-warning)',
                      }}
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Available Lessons
            </h2>
            <Link
              href="/lesson"
              className="text-sm font-medium"
              style={{color: 'var(--primary)'}}
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lessons.slice(0, 3).map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="group p-4 bg-card-bg rounded-xl border hover:shadow-md transition-all"
                style={{
                  borderColor: 'var(--line-divider)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line-divider)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 className="font-medium text-[var(--text-primary)] transition-colors" style={{
                  '--default-color': 'gray',
                } as any}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--deep-text)')}
                >
                  {lesson.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                  {lesson.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {lesson.words.length} words
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lesson.difficulty === "easy"
                      ? "" 
                      : lesson.difficulty === "medium"
                      ? ""
                      : ""
                  }`}
                  style={{
                    backgroundColor: lesson.difficulty === "easy" 
                      ? 'var(--btn-regular-bg)'
                      : lesson.difficulty === "medium"
                      ? 'var(--btn-regular-bg)'
                      : 'var(--btn-regular-bg)',
                    color: lesson.difficulty === "easy" 
                      ? 'var(--primary)'
                      : lesson.difficulty === "medium"
                      ? 'var(--primary)'
                      : 'var(--primary)',
                  }}
                  >
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