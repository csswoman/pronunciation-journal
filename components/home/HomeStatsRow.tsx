"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

const CEFR_WORD_TOTALS: Record<string, number> = {
  A1: 740,
  A2: 1150,
  B1: 1800,
  B2: 2400,
};

interface HomeStatsRowProps {
  profileLevel?: string | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
}

export default function HomeStatsRow({
  profileLevel = "A1",
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeStatsRowProps) {
  const levelKey = (profileLevel || "A1").toUpperCase();
  const totalLevelWords = CEFR_WORD_TOTALS[levelKey] ?? 740;

  const learnedCount =
    useLiveQuery(async () => {
      try {
        const count = await db.srsData
          .filter((item) => (item.interval ?? 0) > 0 && !item.archived)
          .count();
        return Math.max(1, count);
      } catch {
        return 1;
      }
    }, []) ?? 1;

  const totalDue = wordsDueCount + soundsDueCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Palabras esenciales */}
      <Link
        href="/practice/essential-words"
        className="focus-ring group flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-all hover:border-border-default hover:shadow-xs"
      >
        <span className="font-label text-body-xs font-medium text-fg-muted">
          Palabras esenciales · {levelKey}
        </span>
        <p className="font-sans text-heading-md font-bold tabular-nums text-fg">
          {learnedCount}{" "}
          <span className="font-body-sm font-normal text-fg-muted">
            de {totalLevelWords}
          </span>
        </p>
      </Link>

      {/* En repaso */}
      <Link
        href="/review"
        className="focus-ring group flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-all hover:border-border-default hover:shadow-xs"
      >
        <span className="font-label text-body-xs font-medium text-fg-muted">
          En repaso
        </span>
        <p className="font-sans text-heading-md font-bold tabular-nums text-fg">
          {totalDue}
        </p>
        <span className="font-body-xs text-fg-muted">
          {totalDue === 0
            ? "Empiezan tras tus primeras palabras"
            : `${totalDue} ${totalDue === 1 ? "elemento pendiente" : "elementos pendientes"}`}
        </span>
      </Link>
    </div>
  );
}
