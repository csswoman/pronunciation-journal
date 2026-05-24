import Dexie, { type Table } from "dexie";
import type { AIConversation, AISavedWord, Attempt, DailyProgress, FavoriteWord, SRSData, UserStats } from "../types";
import type { SyncOutboxEntry } from "../sync/types";
import type { UserLearningState } from "../ai-practice/learning-state";
import type { GenericExercise, GenericExerciseType, ExerciseSource } from "../exercises/types";
import type { ExerciseResult, PracticeExercise } from "../practice/types";

/**
 * Active in-progress practice session, persisted so the user can resume
 * after closing the tab, opening a new window, or losing offline state.
 * One row per (userId, soundId) — composite key `${userId}:${soundId}`.
 */
export interface PracticeSessionRecord {
  id: string;          // `${userId}:${soundId}`
  soundId: number;
  userId: string;
  exercises: PracticeExercise[];
  currentIndex: number;
  answers: ExerciseResult[];
  startedAt: string;   // ISO
  expiresAt: string;   // ISO — used to evict 24h+ stale sessions
}

export interface CachedExercise {
  /** Same deterministic id as GenericExercise.id. */
  id: string
  type: GenericExerciseType
  source: ExerciseSource
  /** ISO timestamp — used to invalidate stale cache entries. */
  generatedAt: string
  exercise: GenericExercise
}

interface StoredLearningState {
  userId: string; // PK
  state: UserLearningState;
  updatedAt: string;
  syncedAt?: string;
}

export type AnalyticsEventName =
  | "exercise_shown"
  | "exercise_answered"
  | "exercise_correct"
  | "next_clicked"
  | "retry_clicked"
  | "exercise_abandoned"
  | "auto_next_triggered"
  | "time_to_first_exercise"
  | "session_started"
  | "session_ended";

export interface AnalyticsEvent {
  id?: number;
  name: AnalyticsEventName;
  payload: Record<string, unknown>;
  timestamp: string;
  synced: 0 | 1;
}

interface LessonSessionOffset {
  lessonId: string; // PK
  offset: number;   // next starting index
}

export interface CompletedCourseLesson {
  // PK: `${courseSlug}:${lessonSlug}`
  key: string;
  courseSlug: string;
  lessonSlug: string;
  completedAt: string; // ISO
}

export interface IpaExplorationRecord {
  // PK: `${date}:${symbol}` — one row per phoneme explored per day
  key: string;
  date: string;   // YYYY-MM-DD
  symbol: string; // e.g. "/iː/"
  exploredAt: string; // ISO
}

class PronunciationDB extends Dexie {
  attempts!: Table<Attempt, number>;
  srsData!: Table<SRSData, string>;
  dailyProgress!: Table<DailyProgress, number>;
  userStats!: Table<UserStats, number>;
  favorites!: Table<FavoriteWord, number>;
  aiConversations!: Table<AIConversation, number>;
  aiWords!: Table<AISavedWord, number>;
  lessonOffsets!: Table<LessonSessionOffset, string>;
  syncOutbox!: Table<SyncOutboxEntry, number>;
  completedLessons!: Table<CompletedCourseLesson, string>;
  learningState!: Table<StoredLearningState, string>;
  analyticsEvents!: Table<AnalyticsEvent, number>;
  generatedExercises!: Table<CachedExercise, string>;
  practiceSessions!: Table<PracticeSessionRecord, string>;
  ipaExplorations!: Table<IpaExplorationRecord, string>;

  constructor() {
    super("pronunciation-journal");

    // Dexie merges schemas forward: each version() lists ONLY the stores that
    // change relative to the previous version. Read top-to-bottom for the
    // schema's history. The effective schema is the union of all blocks.

    // v1: initial schema
    this.version(1).stores({
      attempts:      "++id, word, lessonId, timestamp",
      srsData:       "wordId, word, nextReview",
      dailyProgress: "++id, date",
      userStats:     "++id",
    });

    // v2: favorite words
    this.version(2).stores({
      favorites: "++id, word, lessonId, addedAt",
    });

    // v3: AI conversations + saved words
    this.version(3).stores({
      aiConversations: "++id, templateId, createdAt, updatedAt",
      aiWords:         "++id, word, conversationId, savedAt, difficulty",
    });

    // v4: lesson session offsets
    this.version(4).stores({
      lessonOffsets: "lessonId",
    });

    // v5: offline-first sync queue (Outbox Pattern).
    // Indexed by status+createdAt to efficiently query pending entries in order
    this.version(5).stores({
      syncOutbox: "++id, status, createdAt, [status+createdAt]",
    });

    // v6: local cache mirrors for offline reads (user_sound_progress, answer_history)
    this.version(6).stores({
      // localKey = `${userId}:${soundId}` — mirrors user_sound_progress
      localSoundProgress: "localKey, userId, soundId, nextReview",
      // mirrors answer_history rows before they are confirmed by Supabase
      localAnswerHistory: "++id, userId, soundId, answeredAt, synced",
    });

    // v7: course lesson completion tracking (offline-first)
    this.version(7).stores({
      completedLessons: "key, courseSlug, completedAt",
    });

    // v8: mode index on aiConversations + learningState store
    this.version(8).stores({
      aiConversations: "++id, templateId, mode, createdAt, updatedAt",
      learningState:   "userId, updatedAt",
    });

    // v9: analytics events (local + optional Supabase batch sync)
    this.version(9).stores({
      analyticsEvents: "++id, name, timestamp, synced",
    });

    // v10: generic exercise cache (fill_blank, sentence_dictation, match_pairs, reorder_words)
    this.version(10).stores({
      generatedExercises: "id, type, source, generatedAt",
    });

    // v11: active in-progress practice sessions for resume-on-reload
    this.version(11).stores({
      practiceSessions: "id, userId, soundId, expiresAt",
    });

    // v12: per-day IPA phoneme exploration tracking
    this.version(12).stores({
      ipaExplorations: "key, date, symbol",
    });
  }
}

export const db = new PronunciationDB();

// ── Attempt Helpers ──

export async function saveAttempt(attempt: Omit<Attempt, "id">): Promise<number> {
  return db.attempts.add(attempt as Attempt);
}

export async function getRecentAttempts(limit = 50): Promise<Attempt[]> {
  return db.attempts.orderBy("timestamp").reverse().limit(limit).toArray();
}

export async function getAttemptsByLessonId(lessonId: string): Promise<Attempt[]> {
  return db.attempts.where("lessonId").equals(lessonId).toArray();
}

// ── SRS Helpers ──

export async function getSRSData(wordId: string): Promise<SRSData | undefined> {
  return db.srsData.get(wordId);
}

export async function saveSRSData(data: SRSData): Promise<void> {
  await db.srsData.put(data);
}

// ── Daily Progress Helpers ──

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export async function updateDailyProgress(
  accuracy: number,
  word: string,
  xpEarned: number
): Promise<void> {
  const today = getTodayKey();
  const existing = await db.dailyProgress.where("date").equals(today).first();

  if (existing) {
    const wordsSet = new Set(existing.wordsStudied);
    wordsSet.add(word);
    const totalAttempts = existing.totalAttempts + 1;
    const correctAttempts = existing.correctAttempts + (accuracy >= 70 ? 1 : 0);

    await db.dailyProgress.update(existing.id!, {
      totalAttempts,
      correctAttempts,
      averageAccuracy: Math.round(
        (existing.averageAccuracy * existing.totalAttempts + accuracy) / totalAttempts
      ),
      xp: existing.xp + xpEarned,
      wordsStudied: Array.from(wordsSet),
    });
  } else {
    await db.dailyProgress.add({
      date: today,
      totalAttempts: 1,
      correctAttempts: accuracy >= 70 ? 1 : 0,
      averageAccuracy: Math.round(accuracy),
      xp: xpEarned,
      wordsStudied: [word],
    });
  }
}

// ── User Stats Helpers ──

export async function getUserStats(): Promise<UserStats> {
  const stats = await db.userStats.toCollection().first();
  if (stats) return stats;

  const defaultStats: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    totalWords: 0,
    totalAttempts: 0,
    averageAccuracy: 0,
    lastStudyDate: "",
  };
  await db.userStats.add(defaultStats);
  return defaultStats;
}

export async function updateUserStats(
  accuracy: number,
  xpEarned: number
): Promise<UserStats> {
  const stats = await getUserStats();
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = stats.currentStreak;
  if (stats.lastStudyDate === today) {
    // Already studied today, keep streak
  } else if (stats.lastStudyDate === yesterday) {
    newStreak += 1;
  } else if (stats.lastStudyDate === "") {
    newStreak = 1;
  } else {
    newStreak = 1; // streak broken
  }

  const totalAttempts = stats.totalAttempts + 1;
  const updated: UserStats = {
    ...stats,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
    totalXP: stats.totalXP + xpEarned,
    totalAttempts,
    averageAccuracy: Math.round(
      (stats.averageAccuracy * stats.totalAttempts + accuracy) / totalAttempts
    ),
    lastStudyDate: today,
  };

  const existing = await db.userStats.toCollection().first();
  if (existing) {
    await db.userStats.update(existing.id!, updated);
  }

  return updated;
}

// ── Favorites Helpers ──

export async function getFavorites(): Promise<FavoriteWord[]> {
  return db.favorites.orderBy("addedAt").reverse().toArray();
}

export async function isFavorite(word: string): Promise<boolean> {
  const count = await db.favorites.where("word").equals(word.toLowerCase()).count();
  return count > 0;
}

export async function addFavorite(word: string, lessonId: string, ipa?: string): Promise<void> {
  const exists = await isFavorite(word);
  if (!exists) {
    await db.favorites.add({
      word: word.toLowerCase(),
      lessonId,
      ipa,
      addedAt: new Date().toISOString(),
    });
  }
}

export async function removeFavorite(word: string): Promise<void> {
  await db.favorites.where("word").equals(word.toLowerCase()).delete();
}

export async function toggleFavorite(word: string, lessonId: string, ipa?: string): Promise<boolean> {
  const exists = await isFavorite(word);
  if (exists) {
    await removeFavorite(word);
    return false;
  } else {
    await addFavorite(word, lessonId, ipa);
    return true;
  }
}

// ── Needs Practice Helpers ──
// Words where the user's best attempt accuracy is below 75%

export async function getNeedsPracticeWords(): Promise<{ word: string; lessonId: string; bestAccuracy: number; attempts: number }[]> {
  const allAttempts = await db.attempts.toArray();

  // Group by word
  const map = new Map<string, { lessonId: string; bestAccuracy: number; attempts: number }>();
  for (const a of allAttempts) {
    const key = a.word.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { lessonId: a.lessonId, bestAccuracy: a.accuracy, attempts: 1 });
    } else {
      existing.bestAccuracy = Math.max(existing.bestAccuracy, a.accuracy);
      existing.attempts += 1;
    }
  }

  const result: { word: string; lessonId: string; bestAccuracy: number; attempts: number }[] = [];
  for (const [word, data] of map.entries()) {
    if (data.bestAccuracy < 75) {
      result.push({ word, ...data });
    }
  }

  // Sort by worst accuracy first
  return result.sort((a, b) => a.bestAccuracy - b.bestAccuracy);
}

// ── Lesson Session Offset Helpers ──
// Tracks which chunk of words to show next for DB-generated lessons (10 words/session)

export const LESSON_SESSION_SIZE = 10

export async function getLessonOffset(lessonId: string): Promise<number> {
  const row = await db.lessonOffsets.get(lessonId)
  return row?.offset ?? 0
}

export async function advanceLessonOffset(lessonId: string, totalWords: number): Promise<number> {
  const current = await getLessonOffset(lessonId)
  const next = (current + LESSON_SESSION_SIZE) % totalWords
  await db.lessonOffsets.put({ lessonId, offset: next })
  return next
}

// ── Course Lesson Completion Helpers ──

export async function markLessonComplete(courseSlug: string, lessonSlug: string): Promise<void> {
  const key = `${courseSlug}:${lessonSlug}`;
  await db.completedLessons.put({ key, courseSlug, lessonSlug, completedAt: new Date().toISOString() });
}

export async function markLessonIncomplete(courseSlug: string, lessonSlug: string): Promise<void> {
  await db.completedLessons.delete(`${courseSlug}:${lessonSlug}`);
}

export async function isLessonComplete(courseSlug: string, lessonSlug: string): Promise<boolean> {
  const row = await db.completedLessons.get(`${courseSlug}:${lessonSlug}`);
  return !!row;
}

export async function getCompletedCountByCourse(): Promise<Record<string, number>> {
  const all = await db.completedLessons.toArray();
  const counts: Record<string, number> = {};
  for (const row of all) {
    counts[row.courseSlug] = (counts[row.courseSlug] ?? 0) + 1;
  }
  return counts;
}

// ── IPA Exploration Helpers ──

export async function markPhonemeExplored(symbol: string): Promise<void> {
  const date = getTodayKey();
  const key = `${date}:${symbol}`;
  await db.ipaExplorations.put({
    key,
    date,
    symbol,
    exploredAt: new Date().toISOString(),
  });
}

export async function getExploredSymbolsToday(): Promise<string[]> {
  const date = getTodayKey();
  const rows = await db.ipaExplorations.where("date").equals(date).toArray();
  return rows.map((row) => row.symbol);
}

export async function resetTodaysExplorations(): Promise<void> {
  const date = getTodayKey();
  await db.ipaExplorations.where("date").equals(date).delete();
}
