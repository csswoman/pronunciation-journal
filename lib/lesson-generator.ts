import type { Lesson } from "./types";

// Import lesson data — in a real app these would be dynamic imports
import basicsData from "@/content/lessons/basics.json";
import commonWordsData from "@/content/lessons/common-words.json";
import difficultSoundsData from "@/content/lessons/difficult-sounds.json";
import phonemePractice1Data from "@/content/lessons/phoneme-practice-1.json";

const allLessons: Lesson[] = [
  basicsData as Lesson,
  commonWordsData as Lesson,
  difficultSoundsData as Lesson,
  phonemePractice1Data as Lesson,
];

/**
 * Get all available lessons.
 */
export function getAllLessons(): Lesson[] {
  return allLessons;
}

/**
 * Get a specific lesson by ID.
 */
export function getLessonById(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
}

/**
 * Get lessons by category.
 */
export function getLessonsByCategory(category: string): Lesson[] {
  return allLessons.filter((l) => l.category === category);
}

/**
 * Get total word count across all lessons.
 */
export function getTotalWordCount(): number {
  return allLessons.reduce((sum, l) => sum + l.words.length, 0);
}
