export const dynamic = "force-dynamic";

import PageLayout from "@/components/layout/PageLayout";
import HomeLayout from "@/components/home/HomeLayout";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { getVocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import { getHomeMiniLessons } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import { getTodayPracticeGoal, getWeakestPhonemeForHome } from "@/lib/home/queries";
import { getReviewQueueSummary } from "@/lib/home/review-queue";
import type { MiniLesson } from "@/lib/content/schemas";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";

/** Isolate each fetch so one failure does not blank the whole home. */
async function settled<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`Error loading home ${label}:`, error);
    return fallback;
  }
}

export default async function HomePage() {
  const userId = await getSupabaseServerUserId();

  const emptyQueue: ReviewQueueSummary = { total: 0, newAvailable: 0, sources: [], preview: [] };
  const emptyLessons = { primary: null, secondary: null } as {
    primary: MiniLesson | null;
    secondary: MiniLesson | null;
  };

  const [queue, homeLessons, streak, vocabulary, goal, weakSound] = await Promise.all([
    settled(getReviewQueueSummary(userId), emptyQueue, "review queue"),
    settled(getHomeMiniLessons(), emptyLessons, "mini lessons"),
    settled(
      userId ? getDailyStreak(userId) : Promise.resolve(undefined),
      undefined as DailyStreakResult | undefined,
      "streak",
    ),
    settled(getVocabularyProgressSeed(), null as VocabularyProgressSeed | null, "vocabulary"),
    settled(
      userId ? getTodayPracticeGoal(userId) : Promise.resolve(null),
      null as DailyGoalProgress | null,
      "daily goal",
    ),
    settled(
      userId ? getWeakestPhonemeForHome(userId) : Promise.resolve(null),
      null as WeakestPhonemeHome | null,
      "weak phoneme",
    ),
  ]);

  const conceptLesson = homeLessons.primary
    ? {
        slug: homeLessons.primary.slug,
        title: homeLessons.primary.title,
        subtitle: homeLessons.primary.subtitle,
      }
    : null;

  return (
    <PageLayout>
      <HomeLayout
        streak={streak}
        wordsDueCount={queue.sources.find((s) => s.id === "vocabulary")?.count ?? 0}
        soundsDueCount={queue.sources.find((s) => s.id === "sounds")?.count ?? 0}
        conceptLesson={conceptLesson}
        dailyGoal={goal}
        weakestPhoneme={weakSound}
        reviewQueue={queue}
        vocabularyProgress={vocabulary}
        todaysLesson={homeLessons.primary}
        secondaryLesson={homeLessons.secondary}
      />
    </PageLayout>
  );
}
