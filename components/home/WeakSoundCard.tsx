// Planned structure:
// <WeakSoundCard>
//   title Pronunciación
//   phoneme focus OR empty CTA → /practice/sounds
// </WeakSoundCard>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";

interface WeakSoundCardProps {
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

/** Aside card: pronunciation focus + single path into Sound Lab. */
export default function WeakSoundCard({ weakestPhoneme = null }: WeakSoundCardProps) {
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="home-sidebar-card flex flex-col gap-3">
      <span className="font-label text-fg">Pronunciación</span>
      {hasPhoneme ? (
        <Link
          href="/practice/sounds"
          className="focus-ring group flex items-center gap-3 rounded-lg transition-transform active:scale-[0.96]"
        >
          <span className="font-mono shrink-0 text-display-ipa font-bold leading-none text-warning">
            {formatIpaDisplay(weakestPhoneme!.ipa)}
          </span>
          <div className="min-w-0 flex-1">
            {weakestPhoneme!.label ? (
              <p className="font-body-sm line-clamp-1 text-fg-muted">{weakestPhoneme!.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={weakestPhoneme!.accuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-warning-value">
                {weakestPhoneme!.accuracy}%
              </span>
            </div>
            <p className="font-body-sm mt-1.5 inline-flex items-center gap-1.5 text-primary group-hover:underline">
              Practicar este sonido <ArrowRight size={16} aria-hidden />
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/practice/sounds"
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-primary bg-surface-raised px-4 font-label text-primary transition-colors hover:bg-primary-soft"
        >
          Practicar sonidos <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
