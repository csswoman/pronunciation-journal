export const dynamic = "force-dynamic";

import PageLayout from "@/components/layout/PageLayout";
import HomeStatusHero from "@/components/home/HomeStatusHero";
import HomeTodaySection from "@/components/home/HomeTodaySection";
import HomeReviewsSection from "@/components/home/HomeReviewsSection";
import HomeLearnSection from "@/components/home/HomeLearnSection";
import HomeMobileView from "@/components/home/HomeMobileView";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import {
  getWordsDueForReview,
  countWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getLexiconRetentionStats } from "@/lib/lexicon/server-progress";
import { getTodaysMiniLesson, getTodaysLanguageConcept } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import { getTodayPracticeGoal, getWeakestPhonemeForHome, getSoundsDueForHome } from "@/lib/home/queries";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { DailyGoalProgress, WeakestPhonemeHome, SoundDueHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

const REVIEW_PREVIEW_LIMIT = 4;

export default async function HomePage() {
  let dueWords: WordBankEntry[] = [];
  let dueCount = 0;
  let soundsDue: SoundDueHome[] = [];
  let todaysLesson: MiniLesson | null = null;
  let todaysConcept: LanguageConcept | null = null;
  let dailyStreak: DailyStreakResult | undefined;
  let lexiconRetention: LexiconRetentionStats | null = null;
  let dailyGoal: DailyGoalProgress | null = null;
  let weakestPhoneme: WeakestPhonemeHome | null = null;

  const userId = await getSupabaseServerUserId();

  try {
    const [words, totalDue, sounds, lesson, concept, streak, lexicon, goal, weakSound] =
      await Promise.all([
        getWordsDueForReview(REVIEW_PREVIEW_LIMIT),
        countWordsDueForReview(),
        userId ? getSoundsDueForHome(userId) : Promise.resolve([]),
        getTodaysMiniLesson(),
        getTodaysLanguageConcept(),
        userId ? getDailyStreak(userId) : Promise.resolve(undefined),
        getLexiconRetentionStats(),
        userId ? getTodayPracticeGoal(userId) : Promise.resolve(null),
        userId ? getWeakestPhonemeForHome(userId) : Promise.resolve(null),
      ]);
    dueWords = words;
    dueCount = totalDue;
    soundsDue = sounds;
    todaysLesson = lesson;
    todaysConcept = concept;
    dailyStreak = streak ?? undefined;
    lexiconRetention = lexicon;
    dailyGoal = goal;
    weakestPhoneme = weakSound;
  } catch (error) {
    console.error("Error loading home stats:", error);
  }

  return (
    <PageLayout className="max-w-[1080px] mx-auto">
      {/* Mobile view */}
      <div className="md:hidden">
        <HomeMobileView
          streak={dailyStreak}
          wordsDueCount={dueCount}
          soundsDueCount={soundsDue.length}
          conceptLesson={
            todaysLesson
              ? { slug: todaysLesson.slug, title: todaysLesson.title, subtitle: todaysLesson.subtitle }
              : null
          }
        />
      </div>

      {/* Desktop/tablet view */}
      <div className="hidden md:block">
        <HomeStatusHero streak={dailyStreak} />
        <HomeTodaySection
          streak={dailyStreak}
          dailyGoal={dailyGoal}
          conceptLesson={
            todaysLesson
              ? { slug: todaysLesson.slug, title: todaysLesson.title, subtitle: todaysLesson.subtitle }
              : null
          }
        />
        <HomeReviewsSection
          words={dueWords}
          dueCount={dueCount}
          soundsDue={soundsDue}
          lexicon={lexiconRetention}
          weakestPhoneme={weakestPhoneme}
        />
        <HomeLearnSection lesson={todaysLesson} concept={todaysConcept} />
      </div>
    </PageLayout>
  );
}
