export const dynamic = "force-dynamic";

import PageLayout from "@/components/layout/PageLayout";
import HomeLayout from "@/components/home/HomeLayout";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { getVocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import { getTodaysMiniLesson, getTodaysLanguageConcept } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import { getTodayPracticeGoal, getWeakestPhonemeForHome } from "@/lib/home/queries";
import { getReviewQueueSummary } from "@/lib/home/review-queue";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";

export default async function HomePage() {
  let reviewQueue: ReviewQueueSummary = { total: 0, newAvailable: 0, sources: [], preview: [] };
  let todaysLesson: MiniLesson | null = null;
  let todaysConcept: LanguageConcept | null = null;
  let dailyStreak: DailyStreakResult | undefined;
  let vocabularyProgress: VocabularyProgressSeed | null = null;
  let dailyGoal: DailyGoalProgress | null = null;
  let weakestPhoneme: WeakestPhonemeHome | null = null;

  const userId = await getSupabaseServerUserId();

  try {
    const [queue, lesson, concept, streak, vocabulary, goal, weakSound] =
      await Promise.all([
        getReviewQueueSummary(userId),
        getTodaysMiniLesson(),
        getTodaysLanguageConcept(),
        userId ? getDailyStreak(userId) : Promise.resolve(undefined),
        getVocabularyProgressSeed(),
        userId ? getTodayPracticeGoal(userId) : Promise.resolve(null),
        userId ? getWeakestPhonemeForHome(userId) : Promise.resolve(null),
      ]);
    reviewQueue = queue;
    todaysLesson = lesson;
    todaysConcept = concept;
    dailyStreak = streak ?? undefined;
    vocabularyProgress = vocabulary;
    dailyGoal = goal;
    weakestPhoneme = weakSound;
  } catch (error) {
    console.error("Error loading home stats:", error);
  }

  const conceptLesson = todaysLesson
    ? { slug: todaysLesson.slug, title: todaysLesson.title, subtitle: todaysLesson.subtitle }
    : null

  return (
    <PageLayout>
      <HomeLayout
        streak={dailyStreak}
        wordsDueCount={reviewQueue.sources.find((s) => s.id === "vocabulary")?.count ?? 0}
        soundsDueCount={reviewQueue.sources.find((s) => s.id === "sounds")?.count ?? 0}
        conceptLesson={conceptLesson}
        dailyGoal={dailyGoal}
        weakestPhoneme={weakestPhoneme}
        reviewQueue={reviewQueue}
        vocabularyProgress={vocabularyProgress}
        todaysLesson={todaysLesson}
        todaysConcept={todaysConcept}
      />
    </PageLayout>
  );
}
