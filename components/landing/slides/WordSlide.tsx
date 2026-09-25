// Planned structure:
// <WordSlide>
//   header row (overline + butter chip "Contraste B1")
//   2 minimal-pair cards ("ship" /ʃɪp/ vs "sheep" /ʃiːp/) with audio buttons
//   context explanation paragraph
//   SuccessToast
import { Volume2 } from "lucide-react";
import { WORD_SLIDE_DATA } from "@/lib/landing/showcase-data";
import { SuccessToast } from "@/components/landing/SuccessToast";

export function WordSlide() {
  const {
    overline,
    chipLabel,
    pair1,
    pair2,
    explanation,
    toastMessage,
    toastDelaySeconds,
  } = WORD_SLIDE_DATA;

  return (
    <div className="ej-in flex h-full flex-col justify-between py-1">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-[var(--text-muted)] uppercase">
            {overline}
          </span>
          <span className="rounded-full bg-[var(--butter)] px-3 py-1 font-mono text-xs font-bold text-[var(--ink)]">
            {chipLabel}
          </span>
        </div>

        {/* 2 Minimal Pair Cards - Grid 2 columns */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* Pair 1: ship (short vowel) */}
          <div className="ej-pop flex flex-col justify-between rounded-[20px] border border-[var(--border-strong)] bg-[var(--surface-raised)] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[var(--text-muted)] uppercase">
                {pair1.label}
              </span>
              <button
                type="button"
                aria-label={`Escuchar ${pair1.word}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] dark:bg-white text-white dark:text-[var(--ink)] transition-transform active:scale-95 focus-ring"
              >
                <Volume2 className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-2">
              <h4 className="font-display text-3xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-4xl">
                {pair1.word}
              </h4>
              <p className="mt-1 font-ipa text-xl font-bold text-[var(--text-secondary)]">
                {pair1.ipa}
              </p>
            </div>

            <span className="mt-3 text-xs font-medium text-[var(--text-muted)]">
              {pair1.tag}
            </span>
          </div>

          {/* Pair 2: sheep (long vowel - highlighted butter card) */}
          <div
            className="ej-pop flex flex-col justify-between rounded-[20px] border border-[var(--butter-deep)] bg-[var(--butter)] p-4 sm:p-5 text-[var(--ink)] shadow-2xs [animation-delay:0.5s]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[var(--ink)] uppercase">
                {pair2.label}
              </span>
              <button
                type="button"
                aria-label={`Escuchar ${pair2.word}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white transition-transform active:scale-95 focus-ring"
              >
                <Volume2 className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-2">
              <h4 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
                {pair2.word}
              </h4>
              <p className="mt-1 font-ipa text-xl font-bold !text-[var(--ink)]">
                {pair2.ipa}
              </p>
            </div>

            <span className="mt-3 text-xs font-bold text-[var(--ink)]/80">
              {pair2.tag}
            </span>
          </div>
        </div>

        {/* Explanation text - with mb-3 for margin separation */}
        <p className="mt-0.5 mb-3 text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
          {explanation}
        </p>
      </div>

      <SuccessToast message={toastMessage} delaySeconds={toastDelaySeconds} />
    </div>
  );
}
