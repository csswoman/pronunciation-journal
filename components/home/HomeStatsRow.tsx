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
import type { HomeImmersionSummary } from "@/lib/home/constants";

// Catalog + Dexie progress load after first paint instead of blocking hydration.
// Until they arrive, the card renders the same geometry with an unknown count.
const HomeEssentialWordsCount = dynamic(
  () => import("@/components/home/HomeEssentialWordsCount"),
  { ssr: false },
);

interface HomeStatsRowProps {
  profileLevel?: string | null;
  showImmersionCard?: boolean;
  immersionSummary?: HomeImmersionSummary | null;
}

export default function HomeStatsRow({
  profileLevel = "A1",
  showImmersionCard = true,
  immersionSummary = null,
}: HomeStatsRowProps) {
  const levelKey = (profileLevel || "A1").toUpperCase();

  // Defer the progress reader past the first frame; the placeholder below
  // preserves the card geometry without inventing a zero.
  const [showLiveCount, setShowLiveCount] = useState(false);
  useEffect(() => {
    setShowLiveCount(true);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {/* Palabras esenciales / Tu Mazo */}
      <Link
        href="/practice/essential-words"
        prefetch={false}
        data-tone="lilac"
        className="pastel-card focus-ring group flex flex-col justify-between gap-4 rounded-3xl p-4 sm:p-5 transition-transform hover:-translate-y-px"
      >
        {showLiveCount ? (
          <HomeEssentialWordsCount
            levelKey={levelKey}
          />
        ) : (
          <HomeEssentialWordsBody
            learnedCount={null}
            totalLevelWords={null}
            levelKey={levelKey}
          />
        )}
      </Link>

      {/* Registro de inmersión: ¿Viste algo en inglés hoy? */}
      {showImmersionCard ? <HomeImmersionCard summary={immersionSummary} /> : null}
    </div>
  );
}
