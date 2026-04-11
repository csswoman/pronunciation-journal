"use client";

import { useRouter } from "next/navigation";
import { getAllLessons } from "@/lib/lesson-generator";
import PageHero from "@/components/layout/PageHero";
import QuickActionCard, { QuickActionGrid } from "@/components/layout/QuickActionCard";
import LessonCard from "@/components/layout/LessonCard";
import SectionHeader from "@/components/layout/SectionHeader";
import ConversationIllustration from "@/components/illustrations/ConversationIllustration";
import DailyQuests from "@/components/home/DailyQuests";

export default function HomePage() {
  const router = useRouter();
  const lessons = getAllLessons();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <PageHero
        eyebrow="Daily Practice"
        title="Speak"
        titleAccent="Confidently"
        description="Practice fast, track progress, and improve with AI feedback."
        primaryCta={{
          label: "Practice Now",
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          ),
          onClick: () => router.push("/practice"),
        }}
        secondaryCta={{
          label: "Continue",
          onClick: () => router.push("/practice"),
        }}
        illustration={
          <ConversationIllustration className="w-[300px] xl:w-[340px]" />
        }
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

      {/* Daily Quests */}
      <DailyQuests />

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
