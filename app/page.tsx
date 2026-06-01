export const dynamic = "force-dynamic";

import PageLayout from "@/components/layout/PageLayout";
import HomeStatusHero from "@/components/home/HomeStatusHero";
import HomeTodaySection from "@/components/home/HomeTodaySection";
import HomeReviewsSection from "@/components/home/HomeReviewsSection";
import HomeLearnSection from "@/components/home/HomeLearnSection";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import {
  getWordsDueForReview,
  getVocabularyRetentionStats,
  countWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getLexiconRetentionStats } from "@/lib/lexicon/server-progress";
import { getTodaysMiniLesson, getTodaysLanguageConcept } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import { getTodayPracticeGoal, getWeakestPhonemeForHome } from "@/lib/home/queries";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { DailyGoalProgress, WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

const REVIEW_PREVIEW_LIMIT = 4;

export default async function HomePage() {
  let dueWords: WordBankEntry[] = [];
  let dueCount = 0;
  let todaysLesson: MiniLesson | null = null;
  let todaysConcept: LanguageConcept | null = null;
  let dailyStreak: DailyStreakResult | undefined;
  let wordBankTotal = 0;
  let lexiconRetention: LexiconRetentionStats | null = null;
  let dailyGoal: DailyGoalProgress | null = null;
  let weakestPhoneme: WeakestPhonemeHome | null = null;

  const userId = await getSupabaseServerUserId();

  try {
    const [words, totalDue, lesson, concept, streak, bankStats, lexicon, goal, weakSound] =
      await Promise.all([
        getWordsDueForReview(REVIEW_PREVIEW_LIMIT),
        countWordsDueForReview(),
        getTodaysMiniLesson(),
        getTodaysLanguageConcept(),
        userId ? getDailyStreak(userId) : Promise.resolve(undefined),
        getVocabularyRetentionStats(),
        getLexiconRetentionStats(),
        userId ? getTodayPracticeGoal(userId) : Promise.resolve(null),
        userId ? getWeakestPhonemeForHome(userId) : Promise.resolve(null),
      ]);
    dueWords = words;
    dueCount = totalDue;
    todaysLesson = lesson;
    todaysConcept = concept;
    dailyStreak = streak ?? undefined;
    wordBankTotal = bankStats.total;
    lexiconRetention = lexicon;
    dailyGoal = goal;
    weakestPhoneme = weakSound;
  } catch (error) {
    console.error("Error loading home stats:", error);
  }

  return (
    <PageLayout className="max-w-[1080px] mx-auto">
      <HomeStatusHero dueCount={dueCount} streak={dailyStreak} dailyGoal={dailyGoal} />
      <HomeTodaySection
        dueCount={dueCount}
        streak={dailyStreak}
        wordBankTotal={wordBankTotal}
      />
      <HomeReviewsSection
        words={dueWords}
        dueCount={dueCount}
        lexicon={lexiconRetention}
        weakestPhoneme={weakestPhoneme}
      />
      <HomeLearnSection lesson={todaysLesson} concept={todaysConcept} />
    </PageLayout>
  );
}
