import type { Core1000QueueItem } from "./queue";
import type { ReviewPreviewItem } from "@/lib/home/constants";

const DEFAULT_PREVIEW_LIMIT = 3;

export interface EssentialSourceData {
  count: number;
  newAvailable: number;
  previewWords: ReviewPreviewItem[];
}

/** Pure: derives the essential review source from a built session queue. */
export function deriveEssentialSource(
  queue: Core1000QueueItem[],
  previewLimit = DEFAULT_PREVIEW_LIMIT,
): EssentialSourceData {
  const dueItems = queue.filter((i) => i.kind === "review");
  const newAvailable = queue.filter((i) => i.kind === "new").length;

  const previewWords: ReviewPreviewItem[] = dueItems
    .slice(0, previewLimit)
    .map((i) => ({
      id: `core1k:${i.entry.word.toLowerCase()}`,
      text: i.entry.word,
      ipa: i.entry.ipa_strong ?? null,
      translation: null,
      sourceId: "essential" as const,
    }));

  return { count: dueItems.length, newAvailable, previewWords };
}
