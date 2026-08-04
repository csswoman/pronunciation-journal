// Time-ceiling estimation and truncation (spec §4.1). Pure — no I/O.

import type { EssentialWord } from "./types";

export const SECONDS_PER_EXPOSE = 4;
export const SECONDS_PER_EXERCISE = 12;
export const SESSION_BUDGET_MS = 8 * 60 * 1000;
export const REVIEW_CHUNK_THRESHOLD = 15;
export const REVIEW_CHUNK_SIZE = 10;

export interface DurationInput {
  exposeCount: number;
  exerciseCount: number;
}

export function estimateDurationMs({ exposeCount, exerciseCount }: DurationInput): number {
  return exposeCount * SECONDS_PER_EXPOSE * 1000 + exerciseCount * SECONDS_PER_EXERCISE * 1000;
}

function perNewWordMs(): number {
  return estimateDurationMs({ exposeCount: 1, exerciseCount: 3 });
}

function perReviewWordMs(): number {
  return estimateDurationMs({ exposeCount: 0, exerciseCount: 3 });
}

export interface TruncateInput {
  reviewWords: EssentialWord[];
  newWords: EssentialWord[];
  budgetMs: number;
}

export interface TruncateResult {
  reviewWords: EssentialWord[];
  newWords: EssentialWord[];
}

function blockSafeCount(maxCount: number): number {
  if (maxCount < 3) return 0;
  const mod = maxCount % 3;
  if (mod === 2) return maxCount - 2 >= 0 ? maxCount - 2 : 0;
  return maxCount;
}

export function truncateToTimeBudget({ reviewWords, newWords, budgetMs }: TruncateInput): TruncateResult {
  const reviewCost = reviewWords.length * perReviewWordMs();
  const remaining = Math.max(0, budgetMs - reviewCost);
  const affordableNewCount = Math.floor(remaining / perNewWordMs());
  const safeCount = blockSafeCount(Math.min(affordableNewCount, newWords.length));
  return {
    reviewWords,
    newWords: newWords.slice(0, safeCount),
  };
}

export function chunkReviews(reviews: EssentialWord[]): EssentialWord[][] {
  if (reviews.length <= REVIEW_CHUNK_THRESHOLD) return [reviews];
  const chunks: EssentialWord[][] = [];
  for (let i = 0; i < reviews.length; i += REVIEW_CHUNK_SIZE) {
    chunks.push(reviews.slice(i, i + REVIEW_CHUNK_SIZE));
  }
  return chunks;
}
