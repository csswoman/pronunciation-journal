"use client";

import { getUserStats, getFavorites, getNeedsPracticeWords } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getWordBankSourceRefs } from "@/lib/word-bank/domain-queries";
import { deriveDomainProfile, emptyDomainProfile } from "@/lib/lexicon/domain-profile";
import { getWordCategoryIndex } from "@/lib/lexicon/word-index-client";
import { createEmptyState, type UserLearningState } from "./learning-state";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; state: UserLearningState }>();
const inflight = new Map<string, Promise<UserLearningState>>();

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
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.state;
  }

  const pending = inflight.get(userId);
  if (pending) return pending;

  const promise = buildUserLearningState(userId)
    .then((state) => {
      cache.set(userId, { state, expiresAt: Date.now() + CACHE_TTL_MS });
      return state;
    })
    .finally(() => {
      inflight.delete(userId);
    });

  inflight.set(userId, promise);
  return promise;
}

async function buildUserLearningState(userId: string): Promise<UserLearningState> {
  const deviceId = getOrCreateDeviceId();
  const base = createEmptyState(userId, deviceId);

  try {
    const [stats, favorites, practiceWords, soundProgress, domainProfile] =
      await Promise.allSettled([
        getUserStats(userId),
        getFavorites(userId),
        getNeedsPracticeWords(userId),
        fetchSoundProgress(userId),
        fetchDomainProfile(userId),
      ]);

    const resolvedStats = stats.status === "fulfilled" ? stats.value : null;
    const resolvedFavs = favorites.status === "fulfilled" ? favorites.value : [];
    const resolvedPractice = practiceWords.status === "fulfilled" ? practiceWords.value : [];
    const resolvedSounds = soundProgress.status === "fulfilled" ? soundProgress.value : [];
    const resolvedDomainProfile =
      domainProfile.status === "fulfilled" ? domainProfile.value : emptyDomainProfile();

    const avgAccuracy = resolvedStats?.averageAccuracy ?? 0;
    const cefrEstimate = accuracyToCEFR(avgAccuracy);
    const confidence = Math.min(1, (resolvedStats?.totalAttempts ?? 0) / 100);

    const savedWords = resolvedFavs.map(f => ({ word: f.word, ipa: f.ipa }));

    const strugglingWords = resolvedPractice.map(p => ({
      word: p.word,
      bestAccuracy: p.bestAccuracy,
      attempts: p.attempts,
      lastSeen: new Date().toISOString(),
    }));

    const strugglingSounds = resolvedSounds
      .map(s => ({
        ipa: s.ipa,
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
      domainProfile: resolvedDomainProfile,
    };
  } catch {
    return base;
  }
}

async function fetchDomainProfile(userId: string) {
  const [entries, wordIndex] = await Promise.all([
    getWordBankSourceRefs(userId),
    getWordCategoryIndex(),
  ]);
  return deriveDomainProfile(entries, wordIndex);
}

async function fetchSoundProgress(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("user_contrast_progress")
    .select("contrast_id, total_attempts, correct_answers")
    .eq("user_id", userId)
    .gt("total_attempts", 0)
    .order("correct_answers", { ascending: true })
    .limit(20);

  return (data ?? []).map(r => ({
    contrast_id: r.contrast_id,
    ipa: r.contrast_id.split("|")[0],
    total_attempts: r.total_attempts,
    correct_answers: r.correct_answers,
  }));
}
