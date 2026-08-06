import { effectiveStatus } from "@/lib/srs/status";
import type { SRSData } from "@/lib/types";
import { essentialWordId } from "./types";

export interface RouteProgress {
  notStarted: number;
  inProgress: number;
}

/** Counts route words that are untouched vs actively in the learner's deck. */
export function tallyRouteProgress(
  routeWordIds: readonly string[],
  srsByWordId: ReadonlyMap<string, SRSData>,
): RouteProgress {
  let notStarted = 0;
  let inProgress = 0;

  for (const wordId of routeWordIds) {
    const entry = srsByWordId.get(wordId);
    if (!entry) {
      notStarted += 1;
      continue;
    }
    if (effectiveStatus(entry) === "active") {
      inProgress += 1;
    } else {
      notStarted += 1;
    }
  }

  return { notStarted, inProgress };
}

export function formatRouteProgressCopy(progress: RouteProgress): string {
  const parts: string[] = [];
  if (progress.notStarted > 0) {
    const noun = progress.notStarted === 1 ? "sin empezar" : "sin empezar";
    parts.push(`${progress.notStarted} ${noun}`);
  }
  if (progress.inProgress > 0) {
    const noun = progress.inProgress === 1 ? "en curso" : "en curso";
    parts.push(`${progress.inProgress} ${noun}`);
  }
  return parts.join(" · ");
}

export function routeWordIdsFromWords(
  words: readonly { word: string }[],
): string[] {
  return words.map((word) => essentialWordId(word.word));
}
