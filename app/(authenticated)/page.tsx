export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PageLayout from "@/components/layout/PageLayout";
import HomeLayout from "@/components/home/HomeLayout";
import HomePageSkeleton from "@/components/home/HomePageSkeleton";
import { getSupabaseServerUserId } from "@/lib/supabase/session";
import { getVocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import { getHomeMiniLessons } from "@/lib/content/lessons";
import { getDailyStreak } from "@/lib/daily/streak";
import {
  getTodayPracticeGoal,
  getUserProfileLevel,
  getWeakestPhonemeForHome,
} from "@/lib/home/queries";
import { getReviewQueueSummary } from "@/lib/home/review-queue";
import { getHomePlacementState, type HomePlacementState } from "@/lib/home/placement-state";
import {
  getHomePronunciationDiagnosticState,
  type HomePronunciationDiagnosticState,
} from "@/lib/home/pronunciation-diagnostic-state";
import type { MiniLesson } from "@/lib/content/schemas";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";

/** Isolate each fetch so one failure does not blank the whole home. */
async function settled<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    const details = error instanceof Error
      ? { name: error.name, message: error.message, cause: error.cause }
      : error;
    console.error(`Error loading home ${label}:`, details);
    return fallback;
  }
}

/**
 * Sync shell: AppShell + fallback flush before home data finishes.
 * Cuts document TTFB vs awaiting all Supabase reads in the page root.
 */
export default function HomePage() {
  return (
    <PageLayout archetype="dashboard">
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageContent />
      </Suspense>
    </PageLayout>
  );
}

async function HomePageContent() {
  const emptyQueue: ReviewQueueSummary = { total: 0, newAvailable: 0, sources: [], preview: [] };
  const emptyLessons = { primary: null, secondary: null } as {
    primary: MiniLesson | null;
    secondary: MiniLesson | null;
  };
  const hiddenPlacementPrompt: HomePlacementState = {
    hasPlacement: true,
    hasMeaningfulProgress: true,
  };
  const hiddenPronunciationPrompt: HomePronunciationDiagnosticState = {
    hasPronunciationDiagnostic: true,
  };

  // Start user-independent I/O before auth resolves (avoid userId waterfall).
  const userIdPromise = getSupabaseServerUserId();
  const lessonsPromise = settled(getHomeMiniLessons(), emptyLessons, "mini lessons");
  const vocabularyPromise = settled(
    getVocabularyProgressSeed(),
    null as VocabularyProgressSeed | null,
    "vocabulary",
  );

  const userId = await userIdPromise;

  const [
    queue,
    homeLessons,
    streak,
    vocabulary,
    goal,
    weakSound,
    profileLevel,
    placementState,
    pronunciationDiagnosticState,
  ] = await Promise.all([
    settled(getReviewQueueSummary(userId), emptyQueue, "review queue"),
    lessonsPromise,
    settled(
      userId ? getDailyStreak(userId) : Promise.resolve(undefined),
      undefined as DailyStreakResult | undefined,
      "streak",
    ),
    vocabularyPromise,
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
    settled(
      userId ? getUserProfileLevel(userId) : Promise.resolve(null),
      null as string | null,
      "profile level",
    ),
    settled(
      userId ? getHomePlacementState(userId) : Promise.resolve(hiddenPlacementPrompt),
      hiddenPlacementPrompt,
      "placement state",
    ),
    settled(
      userId
        ? getHomePronunciationDiagnosticState(userId)
        : Promise.resolve(hiddenPronunciationPrompt),
      hiddenPronunciationPrompt,
      "pronunciation diagnostic state",
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
    <HomeLayout
      streak={streak}
      profileLevel={profileLevel}
      wordsDueCount={queue.sources.find((s) => s.id === "vocabulary")?.count ?? 0}
      soundsDueCount={queue.sources.find((s) => s.id === "sounds")?.count ?? 0}
      conceptLesson={conceptLesson}
      dailyGoal={goal}
      weakestPhoneme={weakSound}
      vocabularyProgress={vocabulary}
      todaysLesson={homeLessons.primary}
      secondaryLesson={homeLessons.secondary}
      placementState={placementState}
      pronunciationDiagnosticState={pronunciationDiagnosticState}
    />
  );
}
