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
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
        Vocabulary retention
      </p>
      <ProgressBar value={pct} color="var(--primary)" height="sm" className="mt-3" />
      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
        {total > 0
          ? `${learned.toLocaleString()} / ${total.toLocaleString()} words · ${pct}%`
          : "Explore the Lexicon to start learning"}
      </p>

      <div className="my-4 border-t border-border-subtle" />

      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Weakest sound</p>
      {weakIpa && weakAccuracy !== null ? (
        <>
          {weakestPhoneme?.label ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{weakestPhoneme.label}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2.5">
            <span className="font-ipa text-xl text-[var(--warning)]">{weakIpa}</span>
            <div className="flex-1 min-w-0">
              <ProgressBar value={weakAccuracy} color="var(--warning)" height="sm" />
            </div>
            <b
              className="text-lg font-semibold shrink-0 text-[var(--warning-value)]"
            >
              {weakAccuracy}%
            </b>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Practice sounds in the Sound Lab to see your weakest phoneme here.
        </p>
      )}
    </div>
  );
}
