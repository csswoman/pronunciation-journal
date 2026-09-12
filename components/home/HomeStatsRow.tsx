"use client";

// Sub-components:
// <HomeStatsRow>
//   <HomeEssentialWordsCount /> (lazy — carries Dexie)
//   <HomeImmersionCard />
// </HomeStatsRow>

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import HomeEssentialWordsBody from "@/components/home/HomeEssentialWordsBody";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";

// Dexie exists here only to fill in one counter, so it loads after first paint
// instead of blocking hydration. Until it arrives the card renders the same
// body at count 0, so the swap costs no layout shift.
const HomeEssentialWordsCount = dynamic(
  () => import("@/components/home/HomeEssentialWordsCount"),
  { ssr: false },
);

const CEFR_WORD_TOTALS: Record<string, number> = {
  A1: 740,
  A2: 1150,
  B1: 1800,
  B2: 2400,
};

interface HomeStatsRowProps {
  profileLevel?: string | null;
  showImmersionCard?: boolean;
}

export default function HomeStatsRow({
  profileLevel = "A1",
  showImmersionCard = true,
}: HomeStatsRowProps) {
  const levelKey = (profileLevel || "A1").toUpperCase();
  const totalLevelWords = CEFR_WORD_TOTALS[levelKey] ?? 740;

  // Defer the Dexie chunk past the first frame; the placeholder below is
  // byte-identical in geometry, so nothing moves when the real count lands.
  const [showLiveCount, setShowLiveCount] = useState(false);
  useEffect(() => {
    setShowLiveCount(true);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Palabras esenciales */}
      <Link
        href="/practice/essential-words"
        prefetch={false}
        className="focus-ring group flex flex-col justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3.5 sm:p-4 shadow-xs transition-all hover:border-border-default hover:shadow-sm"
      >
        {showLiveCount ? (
          <HomeEssentialWordsCount
            totalLevelWords={totalLevelWords}
            levelKey={levelKey}
          />
        ) : (
          <HomeEssentialWordsBody
            learnedCount={0}
            totalLevelWords={totalLevelWords}
            levelKey={levelKey}
          />
        )}
      </Link>

      {/* Registro de inmersión: ¿Viste algo en inglés hoy? */}
      {showImmersionCard ? <HomeImmersionCard /> : null}
    </div>
  );
}
