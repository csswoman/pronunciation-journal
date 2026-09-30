"use client";

// Sub-components:
// <HomeStatsRow>
//   <HomeEssentialWordsCount /> (lazy — carries Dexie)
// </HomeStatsRow>

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import HomeEssentialWordsBody from "@/components/home/HomeEssentialWordsBody";
import NewChunkInvitation from "@/components/daily/NewChunkInvitation";

// Catalog + Dexie progress load after first paint instead of blocking hydration.
// Until they arrive, the card renders the same geometry with an unknown count.
const HomeEssentialWordsCount = dynamic(
  () => import("@/components/home/HomeEssentialWordsCount"),
  { ssr: false },
);

interface HomeStatsRowProps {
  profileLevel?: string | null;
  userId?: string | null;
}

export default function HomeStatsRow({
  profileLevel = "A1",
  userId = null,
}: HomeStatsRowProps) {
  const levelKey = (profileLevel || "A1").toUpperCase();

  // Defer the progress reader past the first frame; the placeholder below
  // preserves the card geometry without inventing a zero.
  const [showLiveCount, setShowLiveCount] = useState(false);
  useEffect(() => {
    setShowLiveCount(true);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 items-start">
      {/* Palabras esenciales / Tu Mazo */}
      <Link
        href="/practice/essential-words"
        prefetch={false}
        data-tone="lilac"
        className="pastel-card focus-ring group flex flex-col gap-4 rounded-3xl p-4 sm:p-5 transition-transform hover:-translate-y-px"
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

      {userId ? <NewChunkInvitation userId={userId} /> : null}

    </div>
  );
}
