// Planned structure:
// <WeakSoundCard>
//   kicker label
//   phoneme link (IPA + label + ProgressBar + CTA) | empty-state CTA
// </WeakSoundCard>

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";

interface WeakSoundCardProps {
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

export default function WeakSoundCard({ weakestPhoneme = null }: WeakSoundCardProps) {
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="home-sidebar-card flex flex-col gap-2">
      <span className="font-kicker">Sound</span>
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
              <p className="font-caption text-fg-muted line-clamp-1">{weakestPhoneme!.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={weakestPhoneme!.accuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-warning-value">
                {weakestPhoneme!.accuracy}%
              </span>
            </div>
            <p className="font-caption mt-1.5 inline-flex items-center gap-1 text-primary group-hover:underline">
              Practice this sound <ArrowRight size={12} aria-hidden />
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/practice/sounds"
          className="focus-ring inline-flex items-center gap-1.5 font-body-md text-primary hover:underline"
        >
          Find your weakest sound <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </div>
  );
}
