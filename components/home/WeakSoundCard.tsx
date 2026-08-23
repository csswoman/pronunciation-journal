// Planned structure:
// <WeakSoundCard>
//   section title + title/body + CTA → /practice/sounds
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

/** One concrete reason to practice — never a vague label. */
function reasonParts(phoneme: WeakestPhonemeHome): {
  prefix: string;
  confusable?: string;
  suffix?: string;
} {
  const wrong = Math.max(0, phoneme.totalAttempts - phoneme.correctAnswers);
  if (phoneme.confusableIpa && wrong > 0) {
    return {
      prefix: "Lo confundes con ",
      confusable: formatIpaDisplay(phoneme.confusableIpa),
    };
  }
  if (phoneme.totalAttempts > 0 && wrong > 0) {
    return { prefix: `Lo fallaste ${wrong} de ${phoneme.totalAttempts} veces` };
  }
  if (phoneme.accuracy >= 85) return { prefix: "Ya suena claro" };
  if (phoneme.accuracy >= 60) return { prefix: "Vas mejorando" };
  return { prefix: "Este es tu sonido más débil ahora" };
}

/** Aside card: pronunciation focus + path into Sound Lab. */
export default function WeakSoundCard({ weakestPhoneme = null }: WeakSoundCardProps) {
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  if (!hasPhoneme) {
    return (
      <Link
        href="/practice/sounds"
        className="home-sidebar-card home-sidebar-card--pronunciacion focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-label text-pronunciacion">Pronunciación</span>
        <span className="font-body-sm text-pretty text-fg-muted">
          Laboratorio de sonidos
        </span>
        <span className="font-body-sm text-pretty text-fg-muted">
          Contrastes, pares mínimos y práctica guiada para afinar el oído.
        </span>
        <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
          Abrir laboratorio <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    );
  }

  const reason = reasonParts(weakestPhoneme!);

  return (
    <Link
      href="/practice/sounds"
      className="home-sidebar-card home-sidebar-card--pronunciacion focus-ring group flex flex-col gap-3 transition-colors hover:bg-surface-sunken"
    >
      <span className="text-h4 font-semibold text-pronunciacion">Pronunciación</span>
      <div className="flex items-start gap-3">
        <span className="font-ipa shrink-0 text-display-ipa font-bold leading-none text-pronunciacion">
          {formatIpaDisplay(weakestPhoneme!.ipa)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-body-sm text-fg-muted">Tu sonido a reforzar</p>
          <p className="font-body-sm mt-1 text-fg">
            {reason.prefix}
            {reason.confusable ? (
              <span className="font-ipa text-body-md">{reason.confusable}</span>
            ) : null}
            {reason.suffix ?? null}
          </p>
        </div>
      </div>
      <span className="inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
        Practica este sonido <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
