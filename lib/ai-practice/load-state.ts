"use client";

import { getUserStats, getFavorites, getNeedsPracticeWords } from "@/lib/db";
import { getAIWords } from "@/lib/ai-db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createEmptyState, type UserLearningState } from "./learning-state";

function getOrCreateDeviceId(): string {
  const key = "ai_practice_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function accuracyToCEFR(accuracy: number): UserLearningState["level"]["cefrEstimate"] {
  if (accuracy <= 30) return "A1";
  if (accuracy <= 45) return "A2";
  if (accuracy <= 60) return "B1";
  if (accuracy <= 75) return "B2";
  if (accuracy <= 88) return "C1";
  return "C2";
}

export async function getUserLearningState(userId: string): Promise<UserLearningState> {
  const deviceId = getOrCreateDeviceId();
  const base = createEmptyState(userId, deviceId);

  try {
    const [stats, favorites, practiceWords, aiWords, soundProgress] = await Promise.allSettled([
      getUserStats(),
      getFavorites(),
      getNeedsPracticeWords(),
      getAIWords(50),
      fetchSoundProgress(userId),
    ]);

    const resolvedStats = stats.status === "fulfilled" ? stats.value : null;
    const resolvedFavs = favorites.status === "fulfilled" ? favorites.value : [];
    const resolvedPractice = practiceWords.status === "fulfilled" ? practiceWords.value : [];
    const resolvedAIWords = aiWords.status === "fulfilled" ? aiWords.value : [];
    const resolvedSounds = soundProgress.status === "fulfilled" ? soundProgress.value : [];

    const avgAccuracy = resolvedStats?.averageAccuracy ?? 0;
    const cefrEstimate = accuracyToCEFR(avgAccuracy);
    const confidence = Math.min(1, (resolvedStats?.totalAttempts ?? 0) / 100);

    const savedWords = [
      ...resolvedFavs.map(f => ({ word: f.word, ipa: f.ipa })),
      ...resolvedAIWords.map(w => ({ word: w.word })),
    ].filter((v, i, arr) => arr.findIndex(x => x.word === v.word) === i);

    const strugglingWords = resolvedPractice.map(p => ({
      word: p.word,
      bestAccuracy: p.bestAccuracy,
      attempts: p.attempts,
      lastSeen: new Date().toISOString(),
    }));

    const strugglingSounds = resolvedSounds
      .filter(s => s.status === "learning" || s.status === "review")
      .map(s => ({
        ipa: s.ipa ?? s.sound_id,
        avgAccuracy:
          s.total_attempts > 0
            ? Math.round((s.correct_answers / s.total_attempts) * 100)
            : 0,
        attempts: s.total_attempts,
      }))
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
      .slice(0, 10);

    return {
      ...base,
      level: { cefrEstimate, confidence },
      vocabulary: {
        knownCount: resolvedStats?.totalWords ?? 0,
        strugglingWords,
        savedWords,
      },
      pronunciation: {
        averageAccuracy: avgAccuracy,
        strugglingSounds,
      },
    };
  } catch {
    return base;
  }
}

async function fetchSoundProgress(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("user_sound_progress")
    .select("sound_id, total_attempts, correct_answers, status, sounds(ipa)")
    .eq("user_id", userId)
    .in("status", ["learning", "review"])
    .order("correct_answers", { ascending: true })
    .limit(20);

  return (data ?? []) as unknown as Array<{
    sound_id: string;
    ipa?: string;
    total_attempts: number;
    correct_answers: number;
    status: string;
  }>;
}
