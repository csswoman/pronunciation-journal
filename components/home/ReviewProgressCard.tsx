"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import ProgressBar from "@/components/ui/ProgressBar";
import { db } from "@/lib/db";
import { CORE1000_PREFIX } from "@/lib/core-1000/types";
import { mergeVocabularyLearned } from "@/lib/vocabulary/progress";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";

interface ReviewProgressCardProps {
  vocabulary?: VocabularyProgressSeed | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

export default function ReviewProgressCard({ vocabulary, weakestPhoneme }: ReviewProgressCardProps) {
  const essentialLearned = useLiveQuery(
    () =>
      db.srsData
        .filter((entry) => entry.wordId.startsWith(CORE1000_PREFIX))
        .count(),
    [],
    0,
  );

  const catalogTotal = vocabulary?.catalogTotal ?? 0;
  const { learned, percent } = mergeVocabularyLearned(
    vocabulary?.wordBankMastered ?? 0,
    essentialLearned,
    catalogTotal,
  );
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <p className="type-overline">Vocabulary</p>
      <ProgressBar value={percent} color="var(--primary)" height="sm" className="mt-3" />
      <p className="font-body-sm mt-1.5 text-[var(--text-secondary)]">
        {catalogTotal > 0 && learned > 0
          ? `${learned.toLocaleString()} / ~${catalogTotal.toLocaleString()} words · ${percent}%`
          : (
            <Link
              href="/practice/core-1000"
              className="focus-ring inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
            >
              Start with Essential Words <ArrowRight size={12} aria-hidden />
            </Link>
          )}
      </p>

      <div className="my-4 border-t border-border-subtle" />

      <p className="type-overline">Weakest sound</p>
      {hasPhoneme ? (
        <Link
          href="/practice/sounds"
          className="focus-ring group mt-3 flex items-center gap-4 rounded-[var(--radius-md)]"
        >
          <span className="animate-symbol-in font-display shrink-0 text-display-ipa font-bold leading-none text-[var(--warning)]">
            {formatIpaDisplay(weakestPhoneme!.ipa)}
          </span>
          <div className="min-w-0 flex-1">
            {weakestPhoneme!.label ? (
              <p className="font-body-sm text-[var(--text-secondary)]">{weakestPhoneme!.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={weakestPhoneme!.accuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-[var(--warning-value)]">
                {weakestPhoneme!.accuracy}%
              </span>
            </div>
            <p className="font-caption mt-1.5 inline-flex items-center gap-1 text-[var(--primary)] group-hover:underline">
              Practice this sound <ArrowRight size={11} aria-hidden />
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/practice/sounds"
          className="focus-ring mt-3 inline-flex items-center gap-1.5 font-body-sm text-[var(--primary)] hover:underline"
        >
          Find your weakest sound <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </div>
  );
}
