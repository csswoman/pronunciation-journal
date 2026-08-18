"use client";

import Link from "next/link";
import { Headphones } from "@/components/icons";
import type { LessonSection } from "./SoundLabLessonGrid";

// Planned structure:
// <SoundLabFocusBanner>
//   <status copy + IPA tokens />
//   <Abrir este sonido | Ver todos />
// </SoundLabFocusBanner>

interface SoundLabFocusBannerProps {
  focusTokens: string[];
  focusSection: LessonSection | null;
}

export function SoundLabFocusBanner({ focusTokens, focusSection }: SoundLabFocusBannerProps) {
  return (
    <div
      className="sound-lab__focus-banner flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3"
      role="status"
    >
      <Headphones size={14} className="sound-lab__focus-banner-icon shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 text-body-sm text-fg-muted">
        Enfoque:{" "}
        <span className="sound-lab__focus-tokens font-ipa">{focusTokens.join(" · ")}</span>
        {!focusSection && (
          <span className="text-fg-muted">
            . Aún no hay lecciones que coincidan.
          </span>
        )}
      </span>
      {focusSection?.lessons[0]?.href ? (
        <Link
          href={focusSection.lessons[0].href}
          className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-cta-bg px-3 text-caption font-semibold text-cta-fg"
        >
          Abrir este sonido
        </Link>
      ) : null}
      <Link
        href="/practice/sounds"
        className="sound-lab__focus-banner-link shrink-0 text-caption hover:underline"
      >
        Ver todos
      </Link>
    </div>
  );
}
