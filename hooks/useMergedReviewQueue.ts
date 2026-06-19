"use client";

import { useEffect, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue } from "@/lib/core-1000/queue";
import { getCore1000SrsEntries, getCore1000IntroducedToday } from "@/lib/db";
import { deriveEssentialSource, type EssentialSourceData } from "@/lib/core-1000/essential-due";
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
        const [words, srsEntries, introducedToday] = await Promise.all([
          fetchCoreWords(),
          getCore1000SrsEntries(),
          getCore1000IntroducedToday(),
        ]);
        const queue = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
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
