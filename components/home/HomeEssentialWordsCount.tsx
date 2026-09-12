"use client";

// Planned structure:
// <HomeEssentialWordsCount>  (leaf — reads Dexie, renders HomeEssentialWordsBody)

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import HomeEssentialWordsBody from "@/components/home/HomeEssentialWordsBody";

interface HomeEssentialWordsCountProps {
  totalLevelWords: number;
  levelKey: string;
}

/**
 * Isolated so Dexie (~35 KB gzip) stays out of the home's initial bundle.
 * HomeStatsRow loads this with next/dynamic and falls back to the same body at
 * count 0, so the swap never changes the card's height.
 */
export default function HomeEssentialWordsCount({
  totalLevelWords,
  levelKey,
}: HomeEssentialWordsCountProps) {
  const learnedCount =
    useLiveQuery(async () => {
      try {
        return await db.srsData
          .filter((item) => (item.interval ?? 0) > 0 && !item.archived)
          .count();
      } catch {
        return 0;
      }
    }, []) ?? 0;

  return (
    <HomeEssentialWordsBody
      learnedCount={learnedCount}
      totalLevelWords={totalLevelWords}
      levelKey={levelKey}
    />
  );
}
