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
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-[22px]">
      <p className="text-[13px] uppercase tracking-wider text-[var(--text-tertiary)]">
        Vocabulary retention
      </p>
      <p
        className="mt-1.5 text-[2.2rem] leading-none text-[var(--primary)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {total > 0 ? `${pct}%` : "—"}
      </p>
      <p className="text-[14px] text-[var(--text-secondary)]">
        {total > 0 ? (
          <>
            <span className="font-semibold text-[var(--text-primary)]">{learned.toLocaleString()}</span>
            {" / "}
            {total.toLocaleString()} words learned
          </>
        ) : (
          "Explore the Lexicon to start learning"
        )}
      </p>

      <ProgressBar value={pct} color="var(--primary)" height="sm" className="mt-3.5 mb-1.5" />
      <div className="flex justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>Lexicon progress</span>
        <span>{total > 0 ? `${total - learned} left` : "—"}</span>
      </div>

      <div className="my-4 border-t border-border-subtle" />

      <p className="text-[13px] uppercase tracking-wider text-[var(--text-tertiary)]">Weakest sound</p>
      {weakIpa && weakAccuracy !== null ? (
        <>
          {weakestPhoneme?.label ? (
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{weakestPhoneme.label}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2.5">
            <span className="font-ipa text-[1.6rem] text-[var(--warning)]">{weakIpa}</span>
            <div className="flex-1 min-w-0">
              <ProgressBar value={weakAccuracy} color="var(--warning)" height="sm" />
            </div>
            <b
              className="shrink-0 text-[var(--warning-value)]"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {weakAccuracy}%
            </b>
          </div>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
          Practice sounds in the Sound Lab to see your weakest phoneme here.
        </p>
      )}
    </div>
  );
}
