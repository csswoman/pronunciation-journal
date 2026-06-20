import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface ReviewProgressCardProps {
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

export default function ReviewProgressCard({ lexicon, weakestPhoneme }: ReviewProgressCardProps) {
  const learned = lexicon?.learned ?? 0;
  const total = lexicon?.total ?? 0;
  const pct = lexicon?.percent ?? 0;
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <p className="type-overline">Vocabulary</p>
      <ProgressBar value={pct} color="var(--primary)" height="sm" className="mt-3" />
      <p className="font-body-sm mt-1.5 text-[var(--text-secondary)]">
        {total > 0
          ? `${learned.toLocaleString()} / ${total.toLocaleString()} words · ${pct}%`
          : "Explore the Lexicon to start learning"}
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
