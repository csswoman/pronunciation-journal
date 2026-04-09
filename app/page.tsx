"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserStats, getTodayProgress, getProgressHistory } from "@/lib/db";
import { getAllLessons } from "@/lib/lesson-generator";
import type { UserStats, DailyProgress } from "@/lib/types";
import PageHero from "@/components/layout/PageHero";
import StatsSection from "@/components/layout/StatsSection";
import QuickActionCard, { QuickActionGrid } from "@/components/layout/QuickActionCard";
import LessonCard from "@/components/layout/LessonCard";
import SectionHeader from "@/components/layout/SectionHeader";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [progressHistory, setProgressHistory] = useState<DailyProgress[]>([]);

  const lessons = getAllLessons();

  useEffect(() => {
    async function load() {
      const [s, t, history] = await Promise.all([
        getUserStats(),
        getTodayProgress(),
        getProgressHistory(7),
      ]);
      setStats(s);
      setTodayProgress(t || null);
      setProgressHistory(history);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <PageHero
        eyebrow="AI-Powered Learning"
        title="Speak with"
        titleAccent="Confidence"
        description="Train your pronunciation with real-time AI feedback. Practice daily, track your progress, and master every sound."
        primaryCta={{
          label: "Start Practice",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          ),
          onClick: () => router.push("/practice"),
        }}
        secondaryCta={{
          label: "Continue Lesson",
          onClick: () => router.push("/practice"),
        }}
        illustration={
          <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="160" cy="100" r="70" fill="#F3F0FF" opacity="0.7"/>
            <rect x="103" y="130" width="4" height="40" rx="2" fill="#1A1033" opacity="0.15"/>
            <rect x="92" y="166" width="26" height="4" rx="2" fill="#1A1033" opacity="0.15"/>
            <rect x="97" y="95" width="16" height="34" rx="8" fill="#1A1033" opacity="0.85"/>
            <rect x="99" y="97" width="4" height="3" rx="1.5" fill="white" opacity="0.3"/>
            <rect x="99" y="102" width="4" height="2" rx="1" fill="white" opacity="0.2"/>
            <rect x="99" y="107" width="4" height="2" rx="1" fill="white" opacity="0.15"/>
            <ellipse cx="68" cy="158" rx="30" ry="14" fill="#1A1033" opacity="0.08"/>
            <path d="M48 120 Q38 140 40 165 Q55 170 68 168 Q82 170 96 165 Q98 140 88 120 Q78 110 68 110 Q58 110 48 120Z" fill="#1A1033" opacity="0.1"/>
            <path d="M50 122 Q38 142 40 163 Q55 168 68 166 Q82 168 96 163 Q98 142 86 122 Q78 114 68 114 Q58 114 50 122Z" fill="#EDE9FE"/>
            <path d="M62 114 L68 126 L74 114" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M86 130 Q100 122 103 115" stroke="#1A1033" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.15"/>
            <path d="M86 130 Q100 122 103 115" stroke="#F9FAFB" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <circle cx="104" cy="113" r="5" fill="#F9FAFB"/>
            <circle cx="104" cy="113" r="5" stroke="#1A1033" strokeWidth="1.5" opacity="0.2"/>
            <ellipse cx="68" cy="88" rx="22" ry="24" fill="#F9FAFB"/>
            <ellipse cx="68" cy="88" rx="22" ry="24" stroke="#1A1033" strokeWidth="1.5" opacity="0.15"/>
            <path d="M46 82 Q48 62 68 60 Q88 62 90 80 Q85 68 68 66 Q51 68 48 80Z" fill="#1A1033" opacity="0.8"/>
            <path d="M46 82 Q44 90 46 96" stroke="#1A1033" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <ellipse cx="46" cy="90" rx="4" ry="5" fill="#F9FAFB" stroke="#1A1033" strokeWidth="1" opacity="0.6"/>
            <ellipse cx="62" cy="88" rx="3" ry="3.5" fill="#1A1033" opacity="0.7"/>
            <ellipse cx="63" cy="87" rx="1" ry="1" fill="white" opacity="0.8"/>
            <path d="M68 93 Q70 97 67 98" stroke="#1A1033" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
            <path d="M62 103 Q68 107 74 103" stroke="#1A1033" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            <circle cx="122" cy="78" r="2.5" fill="#7C3AED" opacity="0.7"/>
            <circle cx="132" cy="72" r="2" fill="#7C3AED" opacity="0.5"/>
            <circle cx="140" cy="66" r="1.5" fill="#7C3AED" opacity="0.3"/>
            <g transform="translate(125, 90)">
              <rect x="0"  y="10" width="4" height="8"  rx="2" fill="#7C3AED" opacity="0.3"/>
              <rect x="7"  y="4"  width="4" height="20" rx="2" fill="#7C3AED" opacity="0.6"/>
              <rect x="14" y="0"  width="4" height="28" rx="2" fill="#7C3AED" opacity="0.9"/>
              <rect x="21" y="6"  width="4" height="16" rx="2" fill="#7C3AED" opacity="0.7"/>
              <rect x="28" y="10" width="4" height="8"  rx="2" fill="#7C3AED" opacity="0.4"/>
              <rect x="35" y="4"  width="4" height="20" rx="2" fill="#7C3AED" opacity="0.6"/>
              <rect x="42" y="8"  width="4" height="12" rx="2" fill="#7C3AED" opacity="0.35"/>
            </g>
            <text x="170" y="50" fontSize="12" fill="#A78BFA" opacity="0.8">✦</text>
            <text x="188" y="130" fontSize="8" fill="#7C3AED" opacity="0.5">✦</text>
            <text x="115" y="42" fontSize="7" fill="#A78BFA" opacity="0.6">✦</text>
          </svg>
        }
      />

      {/* Stats Section */}
      <StatsSection
        stats={stats}
        todayProgress={todayProgress}
        progressHistory={progressHistory}
      />

      {/* Quick Actions */}
      <section>
        <SectionHeader title="Quick Actions" />
        <QuickActionGrid>
          <QuickActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            }
            name="Lessons"
            description="Practice with structured lessons"
            onClick={() => router.push("/practice")}
          />
          <QuickActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            }
            name="IPA Sounds"
            description="Master 100+ phonetic sounds"
            onClick={() => router.push("/ipa")}
          />
          <QuickActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            }
            name="Progress"
            description="Track your improvement"
            onClick={() => router.push("/progress")}
          />
          <QuickActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            }
            name="AI Practice"
            description="Chat with your AI tutor"
            onClick={() => router.push("/ai-practice")}
          />
        </QuickActionGrid>
      </section>

      {/* Available Lessons */}
      <section>
        <SectionHeader 
          title="Available Lessons"
          viewAll={() => router.push("/practice")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.slice(0, 3).map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              description={lesson.description}
              difficulty={lesson.difficulty as "easy" | "medium" | "hard"}
              onStart={() => router.push(`/practice/lesson/${lesson.id}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
