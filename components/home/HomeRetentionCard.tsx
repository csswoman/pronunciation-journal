import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface HomeRetentionCardProps {
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  if (ipa.startsWith("/")) return ipa;
  return `/${ipa}/`;
}

export default function HomeRetentionCard({
  lexicon,
  weakestPhoneme,
}: HomeRetentionCardProps) {
  const learned = lexicon?.learned ?? 0;
  const total = lexicon?.total ?? 0;
  const pct = lexicon?.percent ?? 0;

  const weakIpa = weakestPhoneme ? formatIpaDisplay(weakestPhoneme.ipa) : null;
  const weakAccuracy = weakestPhoneme?.accuracy ?? null;

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
      {weakIpa && weakAccuracy !== null ? (
        <Link href="/practice/sounds" className="group mt-3 flex items-center gap-4 focus-ring rounded-[var(--radius-md)]">
          <span
            className="font-display shrink-0 text-display-ipa font-bold leading-none text-[var(--warning)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {weakIpa}
          </span>
          <div className="min-w-0 flex-1">
            {weakestPhoneme?.label ? (
              <p className="font-body-sm text-[var(--text-secondary)]">{weakestPhoneme.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ProgressBar value={weakAccuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-[var(--warning-value)]">
                {weakAccuracy}%
              </span>
            </div>
            <p className="font-caption mt-1.5 text-[var(--primary)] group-hover:underline">
              Practice this sound →
            </p>
          </div>
        </Link>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <span
            className="font-display shrink-0 text-display-ipa font-bold leading-none text-[var(--warning)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            /ð/
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body-sm text-[var(--text-secondary)]">voiced dental fricative</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ProgressBar value={0} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-[var(--warning-value)]">
                0%
              </span>
            </div>
            <Link
              href="/practice/sounds"
              className="font-caption mt-1.5 inline-flex items-center gap-1 text-[var(--primary)] hover:underline focus-ring rounded"
            >
              Start practicing →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
