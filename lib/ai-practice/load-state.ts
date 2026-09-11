"use client";

import Dexie from "dexie";
import { db, getUserStats, getFavorites, getNeedsPracticeWords } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getWordBankSourceRefs } from "@/lib/word-bank/domain-queries";
import { deriveDomainProfile, emptyDomainProfile } from "@/lib/lexicon/domain-profile";
import { getWordCategoryIndex } from "@/lib/lexicon/word-index-client";
import { createEmptyState, type UserLearningState } from "./learning-state";
import { aggregateTopicRatings, mergeWeakTopics, type WeakTopic } from "./srs-weak-topics";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; state: UserLearningState }>();
const inflight = new Map<string, Promise<UserLearningState>>();

/** Test-only: drops the in-memory TTL cache so each case starts clean. */
export function __clearLearningStateCache(): void {
  cache.clear();
  inflight.clear();
}

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

/**
 * The persisted snapshot in `db.learningState`, or null when there is none.
 *
 * This row is the ONLY home of the fields no live source can recompute:
 * `grammar.weakTopics`, `lastSessions`, `theory.concepts`, `focus` and
 * `errorRecurrence`. Reading it here is what lets the coach remember what it
 * already taught — without it, every read reset those to empty and the
 * "repasa lo que fallaste" starter could never fire.
 */
async function readStoredState(userId: string): Promise<UserLearningState | null> {
  try {
    const row = await db.learningState.get(userId);
    return row?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Weak topics derived from graded practice answers (`topic_srs`).
 *
 * The coach only ever tracked exercises it ran itself, so failing a topic
 * repeatedly in practice never changed what it offered. Reading the local
 * rating-event mirror closes that gap and keeps working offline.
 */
async function fetchSrsWeakTopics(userId: string): Promise<WeakTopic[]> {
  try {
    const events = await db.srsRatingEvents
      .where("[userId+entityType+topic]")
      .between([userId, "topic_srs", Dexie.minKey], [userId, "topic_srs", Dexie.maxKey])
      .toArray();
    return aggregateTopicRatings(events);
  } catch {
    return [];
  }
}

async function buildUserLearningState(userId: string): Promise<UserLearningState> {
  const deviceId = getOrCreateDeviceId();
  const stored = await readStoredState(userId);
  // Stored fields win for accumulated history; live sources below overwrite
  // everything that is cheaper to recompute than to keep in sync.
  const base: UserLearningState = {
    ...createEmptyState(userId, deviceId),
    ...(stored ?? {}),
    userId,
    deviceId,
  };

  try {
    const [stats, favorites, practiceWords, soundProgress, domainProfile, srsWeakTopics] =
      await Promise.allSettled([
        getUserStats(userId),
        getFavorites(userId),
        getNeedsPracticeWords(userId),
        fetchSoundProgress(userId),
        fetchDomainProfile(userId),
        fetchSrsWeakTopics(userId),
      ]);

    const resolvedStats = stats.status === "fulfilled" ? stats.value : null;
    const resolvedFavs = favorites.status === "fulfilled" ? favorites.value : [];
    const resolvedPractice = practiceWords.status === "fulfilled" ? practiceWords.value : [];
    const resolvedSounds = soundProgress.status === "fulfilled" ? soundProgress.value : [];
    const resolvedDomainProfile =
      domainProfile.status === "fulfilled" ? domainProfile.value : emptyDomainProfile();
    const resolvedSrsWeakTopics =
      srsWeakTopics.status === "fulfilled" ? srsWeakTopics.value : [];

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
      // An assessed level (stored) beats one guessed from raw accuracy: the
      // assessment asked real questions, `accuracyToCEFR` only sees a percentage.
      level: stored?.level
        ? { ...stored.level, confidence: Math.max(stored.level.confidence, confidence) }
        : { cefrEstimate, confidence },
      vocabulary: {
        knownCount: resolvedStats?.totalWords ?? 0,
        strugglingWords,
        savedWords,
      },
      // Practice failures now reach the coach. Its own rows win on conflict —
      // see mergeWeakTopics.
      grammar: {
        weakTopics: mergeWeakTopics(base.grammar.weakTopics, resolvedSrsWeakTopics),
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
