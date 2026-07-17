// Planned structure:
// <WeakSoundCard>
//   title + body + CTA → /practice/sounds
//   OR focused phoneme when data exists
// </WeakSoundCard>

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { WeakestPhonemeHome } from "@/lib/home/constants";

interface WeakSoundCardProps {
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

function accuracyLabel(accuracy: number): string {
  if (accuracy >= 85) return "Ya suena claro";
  if (accuracy >= 60) return "Vas mejorando";
  return "Conviene practicar";
}

/** Aside card: pronunciation focus + path into Sound Lab. */
export default function WeakSoundCard({ weakestPhoneme = null }: WeakSoundCardProps) {
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  if (!hasPhoneme) {
    return (
      <Link
        href="/practice/sounds"
        className="home-sidebar-card focus-ring flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-kicker text-fg-muted">Pronunciación</span>
        <span className="text-h4 text-balance text-fg">Laboratorio de sonidos</span>
        <span className="font-body-sm text-pretty text-fg-muted">
          Contrastes, pares mínimos y práctica guiada para afinar el oído.
        </span>
        <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted">
          Abrir laboratorio <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/practice/sounds"
      className="home-sidebar-card focus-ring group flex flex-col gap-3 transition-colors hover:bg-surface-sunken"
    >
      <span className="font-kicker text-fg-muted">Pronunciación</span>
      <div className="flex items-start gap-3">
        <span className="font-mono shrink-0 text-display-ipa font-bold leading-none text-warning">
          {formatIpaDisplay(weakestPhoneme!.ipa)}
        </span>
        <div className="min-w-0 flex-1">
          {weakestPhoneme!.label ? (
            <p className="font-body-sm line-clamp-2 text-fg-muted">{weakestPhoneme!.label}</p>
          ) : (
            <p className="font-body-sm text-fg-muted">Tu sonido a reforzar</p>
          )}
          <p className="font-body-sm mt-1 text-fg">
            {accuracyLabel(weakestPhoneme!.accuracy)}
          </p>
        </div>
      </div>
      <span className="inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
        Practicar este sonido <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
