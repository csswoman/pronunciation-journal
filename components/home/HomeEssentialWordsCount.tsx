"use client";

// Planned structure:
// <HomeEssentialWordsCount>  (leaf — reads canonical catalog/progress, renders HomeEssentialWordsBody)

import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import HomeEssentialWordsBody from "@/components/home/HomeEssentialWordsBody";
import { getEssentialWordsLevelCount } from "@/lib/essential-words/level-count";
import type { CefrLevel } from "@/lib/essential-words/types";

interface HomeEssentialWordsCountProps {
  levelKey: string;
}

/**
 * Isolated so Dexie (~35 KB gzip) stays out of the home's initial bundle.
 * HomeStatsRow loads this with next/dynamic and falls back to the same body at
 * an unknown count, so the card never claims zero progress while loading.
 */
export default function HomeEssentialWordsCount({
  levelKey,
}: HomeEssentialWordsCountProps) {
  const { user } = useAuth();
  const catalogLevel = (levelKey === "C2" ? "C1" : levelKey) as CefrLevel;
  const count = useLiveQuery(
    () => getEssentialWordsLevelCount([catalogLevel], user?.id),
    [catalogLevel, user?.id],
  );

  return (
    <HomeEssentialWordsBody
      learnedCount={count?.learned ?? null}
      totalLevelWords={count?.total ?? null}
      levelKey={levelKey}
    />
  );
}
