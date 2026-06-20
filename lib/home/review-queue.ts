import {
  getWordsDueForReview,
  countWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getSoundsDueForHome } from "@/lib/home/queries";
import {
  reviewToneForCount,
  REVIEW_SOURCE_HREF,
  REVIEW_SOURCE_LABEL,
  type ReviewSource,
  type ReviewQueueSummary,
  type ReviewPreviewItem,
  type SoundDueHome,
} from "@/lib/home/constants";
import type { WordBankEntry } from "@/lib/word-bank/types";

const PREVIEW_LIMIT = 3;

interface ServerInputs {
  dueWords: WordBankEntry[];
  dueWordCount: number;
  soundsDue: SoundDueHome[];
  newWordAvailable: number;
}

/** Pure: assembles the server-known summary (vocabulary + sounds). */
export function buildServerSummary(input: ServerInputs): ReviewQueueSummary {
  const candidates: ReviewSource[] = [
    {
      id: "vocabulary",
      label: REVIEW_SOURCE_LABEL.vocabulary,
      count: input.dueWordCount,
      href: REVIEW_SOURCE_HREF.vocabulary,
      tone: reviewToneForCount(input.dueWordCount),
    },
    {
      id: "sounds",
      label: REVIEW_SOURCE_LABEL.sounds,
      count: input.soundsDue.length,
      href: REVIEW_SOURCE_HREF.sounds,
      tone: reviewToneForCount(input.soundsDue.length),
    },
  ];

  const sources = candidates
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const preview: ReviewPreviewItem[] = input.dueWords
    .slice(0, PREVIEW_LIMIT)
    .map((w) => ({
      id: w.id,
      text: w.text,
      ipa: w.ipa ?? null,
      translation: w.translation ?? null,
      sourceId: "vocabulary" as const,
    }));

  return {
    total: input.dueWordCount + input.soundsDue.length,
    newAvailable: input.newWordAvailable,
    sources,
    preview,
  };
}

/** Server entry: fetches sources and returns the server-known summary. */
export async function getReviewQueueSummary(
  userId: string | null,
): Promise<ReviewQueueSummary> {
  if (!userId) {
    return { total: 0, newAvailable: 0, sources: [], preview: [] };
  }
  const [dueWords, dueWordCount, soundsDue] = await Promise.all([
    getWordsDueForReview(userId, PREVIEW_LIMIT),
    countWordsDueForReview(),
    getSoundsDueForHome(userId),
  ]);
  return buildServerSummary({
    dueWords,
    dueWordCount,
    soundsDue,
    newWordAvailable: 0,
  });
}
