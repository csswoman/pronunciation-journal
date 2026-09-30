// Planned structure:
// <AudioSlide>
//   header row (overline + sky chip "Sonido /ə/")
//   sentence display with highlighted "of" (no word clipping)
//   IPA phonetic transcript
//   audio button + recording waveform pill with bottom margin
//   SuccessToast
import { Volume2, Mic } from "lucide-react";
import { AUDIO_SLIDE_DATA } from "@/lib/landing/showcase-data";
import { SuccessToast } from "@/components/landing/SuccessToast";

export function AudioSlide() {
  const {
    overline,
    chipLabel,
    sentence,
    highlightedWord,
    ipa,
    waveBarCount,
    toastMessage,
    toastDelaySeconds,
  } = AUDIO_SLIDE_DATA;

  return (
    <div className="ej-in flex h-full flex-col justify-between py-1">
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-[var(--text-muted)] uppercase">
            {overline}
          </span>
          <span className="rounded-full bg-[var(--sky)] dark:bg-[var(--sky-deep)] px-3 py-1 font-mono text-xs font-bold text-[var(--ink)]">
            {chipLabel}
          </span>
        </div>

        {/* Sentence display - map words by space to avoid substring splitting bugs */}
        <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-strong)] leading-snug">
          {sentence.split(" ").map((word, i) => (
            <span key={i}>
              {i > 0 && " "}
              {word === highlightedWord ? (
                <span className="underline decoration-wavy decoration-[var(--butter-deep)] dark:decoration-[var(--butter)] underline-offset-8 decoration-4 font-extrabold text-[var(--text-strong)]">
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
          ))}
        </p>

        {/* IPA Phonetic transcript */}
        <p className="font-ipa text-base sm:text-[18px] text-[var(--text-secondary)] font-normal">{ipa}</p>

        {/* Interactive row - with generous mb-4 for margin-bottom separation */}
        <div className="mt-1 mb-4 flex items-center gap-3.5">
          <button
            type="button"
            aria-label="Escuchar audio de referencia"
            className="ej-pulse flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[var(--ink)] dark:bg-white text-white dark:text-[var(--ink)] transition-transform active:scale-95 focus-ring shadow-sm"
          >
            <Volume2 className="size-5" strokeWidth={2} />
          </button>

          <div className="flex h-[52px] flex-1 items-center justify-between min-w-0 rounded-full bg-[var(--sky-soft)] dark:bg-[var(--surface-raised)] border border-[var(--sky)]/40 dark:border-[var(--border)] px-4 text-[var(--ink)] dark:text-[var(--text)] transition-colors duration-200">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Mic className="size-4 sm:size-5 shrink-0 text-[var(--ink)] dark:text-[var(--text)]" strokeWidth={2} />
              {/* Waveform 26 bars */}
              <div
                aria-hidden="true"
                className="flex items-center gap-1"
              >
                {Array.from({ length: waveBarCount }).map((_, i) => {
                  const n = i + 1;
                  const height = 9 + ((n * 7) % 17);
                  const delay = ((n * 13) % 9) / 10;
                  return (
                    <span
                      key={i}
                      style={{
                        height: `${height}px`,
                        animationDelay: `${delay}s`,
                      }}
                      className="ej-wave w-1 rounded-xs bg-[var(--ink)] dark:bg-[var(--text)]"
                    />
                  );
                })}
              </div>
            </div>

            <span className="text-xs font-semibold shrink-0 ml-2 text-[var(--ink)] dark:text-[var(--text)]">
              Grabando
            </span>
          </div>
        </div>
      </div>

      <SuccessToast message={toastMessage} delaySeconds={toastDelaySeconds} />
    </div>
  );
}
