"use client";

// Sub-components:
// <HomeStatsRow>
//   <Link (Palabras esenciales con barra de progreso)>
//   <HomeImmersionCard (Registro de inmersión)>
// </HomeStatsRow>

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BookOpen } from "@/components/icons";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";

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

  const progressPct =
    totalLevelWords > 0
      ? Math.min(100, Math.round((learnedCount / totalLevelWords) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Palabras esenciales */}
      <Link
        href="/practice/essential-words"
        className="focus-ring group flex flex-col justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3.5 sm:p-4 shadow-xs transition-all hover:border-border-default hover:shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4.5 text-primary shrink-0" aria-hidden />
            <span className="font-label text-body-xs font-medium text-fg-muted">
              Palabras esenciales · {levelKey}
            </span>
          </div>
          <span className="font-mono text-caption font-semibold tabular-nums text-primary">
            {progressPct}%
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-sans text-heading-md font-bold tabular-nums text-fg leading-none">
              {learnedCount}{" "}
              <span className="font-body-sm font-normal text-fg-muted">
                de {totalLevelWords}
              </span>
            </p>
            <span className="text-caption text-fg-muted">
              {learnedCount === 0 ? "Comenzar" : `${totalLevelWords - learnedCount} restantes`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso de palabras esenciales nivel ${levelKey}: ${progressPct}% (${learnedCount} de ${totalLevelWords})`}
            className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken border border-border-subtle/60"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Registro de inmersión: ¿Viste algo en inglés hoy? */}
      {showImmersionCard ? <HomeImmersionCard /> : null}
    </div>
  );
}
