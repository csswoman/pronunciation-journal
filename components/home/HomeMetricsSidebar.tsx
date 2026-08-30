"use client";

// Planned structure:
// <HomeMetricsSidebar>
//   <EssentialWordsMetric />
//   <WeakSoundMetric />
//   <ReviewDueMetric />
// </HomeMetricsSidebar>

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { db, ensureDbReady } from "@/lib/db";
import { ESSENTIAL_WORD_PREFIX } from "@/lib/essential-words/types";
import { fetchLevelIndex } from "@/lib/essential-words/level-index-client";
import {
  frontierLevelProgress,
  tallyLevelProgress,
  type LevelTallyWord,
} from "@/lib/essential-words/level-progress";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

interface HomeMetricsSidebarProps {
  profileLevel?: string | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
}

function getPhonemeReason(phoneme: WeakestPhonemeHome): string {
  const wrong = Math.max(0, phoneme.totalAttempts - phoneme.correctAnswers);
  if (phoneme.confusableIpa && wrong > 0) {
    return `Lo confundes con ${formatIpaDisplay(phoneme.confusableIpa)}`;
  }
  if (phoneme.totalAttempts > 0 && wrong > 0) {
    return `Lo fallaste ${wrong} de ${phoneme.totalAttempts} veces`;
  }
  if (phoneme.accuracy >= 85) return "Ya suena claro";
  if (phoneme.accuracy >= 60) return "Vas mejorando";
  return "Tu sonido prioritario";
}

export default function HomeMetricsSidebar({
  profileLevel = null,
  weakestPhoneme = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeMetricsSidebarProps) {
  const { user } = useAuth();
  const [levelWords, setLevelWords] = useState<LevelTallyWord[] | null>(null);

  const learnedIds = useLiveQuery(
    async () => {
      try {
        await ensureDbReady();
        if (!user?.id) return [] as string[];
        return db.srsData
          .filter(
            (e) =>
              e.userId === user.id && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX),
          )
          .primaryKeys();
      } catch {
        return [] as string[];
      }
    },
    [user?.id],
  );

  useEffect(() => {
    let cancelled = false;
    fetchLevelIndex()
      .then((w) => {
        if (!cancelled) setLevelWords(w);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    levelWords && learnedIds
      ? tallyLevelProgress(levelWords, new Set(learnedIds as string[]))
      : null;
  const activeLevel = rows ? frontierLevelProgress(rows) : null;
  const totalDue = wordsDueCount + soundsDueCount;

  const currentLevelTag = activeLevel?.level || profileLevel || "A1";
  const learnedCount = activeLevel?.learned ?? (learnedIds?.length ?? 0);
  const totalLevelWords = activeLevel?.total ?? 740;
  const progressPercent = totalLevelWords > 0 ? Math.min(100, (learnedCount / totalLevelWords) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Métrica 1: Palabras esenciales */}
      <Link
        href="/practice/essential-words"
        className="focus-ring group flex flex-col gap-2 rounded-xl bg-surface-raised p-4 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-label text-[13px] text-fg-muted">
          Palabras esenciales · {currentLevelTag}
        </span>
        <p className="font-sans text-2xl font-bold tabular-nums text-fg">
          {learnedCount}
          <span className="text-body-sm font-normal text-fg-muted">
            /{totalLevelWords}
          </span>
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-valuenow={learnedCount}
          aria-valuemin={0}
          aria-valuemax={totalLevelWords}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.max(2, progressPercent)}%` }}
          />
        </div>
      </Link>

      {/* Métrica 2: Sonido a reforzar */}
      <Link
        href="/practice/sounds"
        className="focus-ring group flex flex-col gap-1.5 rounded-xl bg-surface-raised p-4 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-label text-[13px] text-fg-muted">
          Sonido a reforzar
        </span>
        {weakestPhoneme?.ipa ? (
          <>
            <span className="font-ipa text-3xl font-bold leading-none text-fg">
              {formatIpaDisplay(weakestPhoneme.ipa)}
            </span>
            <span className="font-body-sm text-fg-muted">
              {getPhonemeReason(weakestPhoneme)}
            </span>
          </>
        ) : (
          <>
            <span className="font-ipa text-3xl font-bold leading-none text-fg">
              /ɛ/
            </span>
            <span className="font-body-sm text-fg-muted">
              Laboratorio de pronunciación
            </span>
          </>
        )}
      </Link>

      {/* Métrica 3: En repaso */}
      <Link
        href="/review"
        className="focus-ring group flex flex-col gap-1 rounded-xl bg-surface-raised p-4 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-label text-[13px] text-fg-muted">
          En repaso
        </span>
        <p className="font-sans text-2xl font-bold tabular-nums text-fg">
          {totalDue}
        </p>
      </Link>
    </div>
  );
}
