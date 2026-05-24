export const dynamic = "force-dynamic";

import SectionHeader from "@/components/layout/SectionHeader";
import HomeHeader from "@/components/home/HomeHeader";
import PageLayout from "@/components/layout/PageLayout";
import HomeTodo from "@/components/home/HomeTodo";
import HomeAchievementsCard from "@/components/home/HomeAchievementsCard";
import HomeShadowingDrill from "@/components/home/HomeShadowingDrill";
import HomePracticeCard from "@/components/home/HomePracticeCard";
import HomeCoursesSection from "@/components/home/HomeCoursesSection";
import HomeWeakPhoneme from "@/components/home/HomeWeakPhoneme";
import HomeTheoryOfDay from "@/components/home/HomeTheoryOfDay";
import HomeWordsToReview from "@/components/home/HomeWordsToReview";
import HomeWordOfDay from "@/components/home/HomeWordOfDay";
import { getAchievements, type Achievement } from "@/lib/home/stats";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { getWordsDueForReview } from "@/lib/word-bank/server-queries";
import { getTodaysMiniLesson } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import type { MiniLesson } from "@/lib/content/schemas";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { DailyStreakResult } from "@/lib/daily/streak";

export default async function HomePage() {
  let userId: string | null = null;
  let achievements: Achievement[] = [];
  let dueWords: WordBankEntry[] = [];
  let todaysLesson: MiniLesson | null = null;
  let dailyStreak: DailyStreakResult | undefined;

  userId = await getSupabaseServerUserId();
  try {
    const [ach, words, lesson, streak] = await Promise.all([
      userId ? getAchievements(userId) : Promise.resolve([]),
      getWordsDueForReview(5),
      getTodaysMiniLesson(),
      userId ? getDailyStreak(userId) : Promise.resolve(undefined),
    ]);
    achievements = ach;
    dueWords = words;
    todaysLesson = lesson;
    dailyStreak = streak ?? undefined;
  } catch (error) {
    console.error("Error loading home stats:", error);
  }

  return (
    <PageLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main column */}
        <div className="flex flex-col gap-6 min-w-0">
          <HomeHeader />
          <HomeTodo dueWords={dueWords} streak={dailyStreak} />
          <HomeWordsToReview words={dueWords} dueCount={dueWords.length} />

          <section className="flex flex-col gap-3">
            <SectionHeader title="Your Courses" viewAllHref="/courses" />
            <HomeCoursesSection />
          </section>

          <HomePracticeCard />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <HomeWordOfDay />
          <HomeWeakPhoneme />
          <HomeTheoryOfDay lesson={todaysLesson} />
          <HomeShadowingDrill />
          <HomeAchievementsCard achievements={achievements} />
        </div>
      </div>
    </PageLayout>
  );
}
