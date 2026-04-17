import type { SubLesson, LessonTopic } from "./types";

const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class NotionCache {
  private static instance: NotionCache;
  private cache: Map<string, CacheEntry<any>> = new Map();

  static getInstance(): NotionCache {
    if (!NotionCache.instance) {
      NotionCache.instance = new NotionCache();
    }
    return NotionCache.instance;
  }

  set<T>(key: string, data: T, durationMs = CACHE_DURATION_MS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + durationMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  clearKey(key: string): void {
    this.cache.delete(key);
  }
}

export const notionCache = NotionCache.getInstance();

// Key generators
export const cacheKeys = {
  subLessonsFromPage: (pageId: string) => `notion:page:${pageId}:sublessons`,
  lesson: (pageId: string) => `notion:lesson:${pageId}`,
  lessonsFromDb: (dbId: string) => `notion:db:${dbId}:lessons`,
  subLessonBySlug: (pageId: string, slug: string) =>
    `notion:sublesson:${pageId}:${slug}`,
};
