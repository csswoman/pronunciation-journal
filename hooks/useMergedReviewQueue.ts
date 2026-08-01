"use client";

import { useEffect, useState } from "react";
import { fetchEssentialWords } from "@/lib/essential-words/client";
import { buildSessionQueue } from "@/lib/essential-words/queue";
import { getEssentialWordsIntroducedToday } from "@/lib/db";
import { prepareEssentialWordsSrsEntries } from "@/lib/essential-words/prepare-srs";
import { deriveEssentialSource, type EssentialSourceData } from "@/lib/essential-words/essential-due";
import {
  reviewToneForCount,
  REVIEW_SOURCE_HREF,
  REVIEW_SOURCE_LABEL,
  type ReviewQueueSummary,
  type ReviewSource,
} from "@/lib/home/constants";

/** Pure: merges the essential source into the server summary. */
export function mergeEssential(
  server: ReviewQueueSummary,
  essential: EssentialSourceData,
): ReviewQueueSummary {
  const sources: ReviewSource[] = [...server.sources];
  if (essential.count > 0) {
    sources.push({
      id: "essential",
      label: REVIEW_SOURCE_LABEL.essential,
      count: essential.count,
      href: REVIEW_SOURCE_HREF.essential,
      tone: reviewToneForCount(essential.count),
    });
  }
  sources.sort((a, b) => b.count - a.count);

  return {
    total: server.total + essential.count,
    newAvailable: server.newAvailable + essential.newAvailable,
    sources,
    preview: [...server.preview, ...essential.previewWords].slice(0, 4),
  };
}

/**
 * Reads Core-1000 SRS from Dexie once and merges it into the server summary.
 * Returns the server summary unchanged until hydration completes (no layout jump).
 */
export function useMergedReviewQueue(server: ReviewQueueSummary): ReviewQueueSummary {
  const [merged, setMerged] = useState<ReviewQueueSummary>(server);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const [words, introducedToday, prepared] = await Promise.all([
          fetchEssentialWords(),
          getEssentialWordsIntroducedToday(),
          prepareEssentialWordsSrsEntries(now),
        ]);
        const queue = buildSessionQueue({ words, srsEntries: prepared.entries, introducedToday, now });
        if (cancelled) return;
        setMerged(mergeEssential(server, deriveEssentialSource(queue)));
      } catch {
        // Offline / Dexie unavailable: keep server summary as-is.
        if (!cancelled) setMerged(server);
      }
    })();
    return () => { cancelled = true; };
  }, [server]);

  return merged;
}
