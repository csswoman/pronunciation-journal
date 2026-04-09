import Dexie, { type Table } from "dexie";
import type { AIConversation, AISavedWord, Attempt, DailyProgress, FavoriteWord, SRSData, UserStats } from "./types";

interface LessonSessionOffset {
  lessonId: string; // PK
  offset: number;   // next starting index
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

  constructor() {
    super("pronunciation-journal");

    this.version(1).stores({
      attempts: "++id, word, lessonId, timestamp",
      srsData: "wordId, word, nextReview",
      dailyProgress: "++id, date",
      userStats: "++id",
    });

    this.version(2).stores({
      attempts: "++id, word, lessonId, timestamp",
      srsData: "wordId, word, nextReview",
      dailyProgress: "++id, date",
      userStats: "++id",
      favorites: "++id, word, lessonId, addedAt",
    });

    this.version(3).stores({
      attempts:        "++id, word, lessonId, timestamp",
      srsData:         "wordId, word, nextReview",
      dailyProgress:   "++id, date",
      userStats:       "++id",
      favorites:       "++id, word, lessonId, addedAt",
      aiConversations: "++id, templateId, createdAt, updatedAt",
      aiWords:         "++id, word, conversationId, savedAt, difficulty",
    });

    this.version(4).stores({
      attempts:        "++id, word, lessonId, timestamp",
      srsData:         "wordId, word, nextReview",
      dailyProgress:   "++id, date",
      userStats:       "++id",
      favorites:       "++id, word, lessonId, addedAt",
      aiConversations: "++id, templateId, createdAt, updatedAt",
      aiWords:         "++id, word, conversationId, savedAt, difficulty",
      lessonOffsets:   "lessonId",
    });
  }
}

export const db = new PronunciationDB();

// ── Attempt Helpers ──

export async function saveAttempt(attempt: Omit<Attempt, "id">): Promise<number> {
  return db.attempts.add(attempt as Attempt);
}

export async function getAttemptsByWord(word: string): Promise<Attempt[]> {
  return db.attempts.where("word").equals(word.toLowerCase()).toArray();
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

export async function getDueWords(limit = 10): Promise<SRSData[]> {
  const now = new Date().toISOString();
  return db.srsData
    .where("nextReview")
    .belowOrEqual(now)
    .limit(limit)
    .toArray();
}

// ── Daily Progress Helpers ──

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayProgress(): Promise<DailyProgress | undefined> {
  const today = getTodayKey();
  return db.dailyProgress.where("date").equals(today).first();
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

export async function getProgressHistory(days = 7): Promise<DailyProgress[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  return db.dailyProgress
    .where("date")
    .aboveOrEqual(since)
    .toArray();
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

export async function resetLessonOffset(lessonId: string): Promise<void> {
  await db.lessonOffsets.delete(lessonId)
}
