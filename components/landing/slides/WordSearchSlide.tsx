// Planned structure:
// <WordSearchSlide>
//   header row (overline + mint chip "Encuentra 3")
//   2-column content layout:
//     left: 7x7 word search grid (cells highlighted with ej-hit-butter/coral/mint)
//     right: 3-item legend list (points + text + ej-pop checkmark badge)
import { Check } from "lucide-react";
import { WORD_SEARCH_SLIDE_DATA } from "@/lib/landing/showcase-data";

export function WordSearchSlide() {
  const { overline, chipLabel, grid, targetWords, legendItems } =
    WORD_SEARCH_SLIDE_DATA;

  const getCellHit = (
    r: number,
    c: number
  ): { className: string; delay: number } | null => {
    for (const target of targetWords) {
      const idx = target.coords.findIndex((coord) => coord.r === r && coord.c === c);
      if (idx !== -1) {
        const delay = target.delayStart + idx * target.step;
        const toneClass =
          target.tone === "butter"
            ? "ej-hit-butter"
            : target.tone === "coral"
            ? "ej-hit-coral"
            : "ej-hit-mint";
        return { className: toneClass, delay };
      }
    }
    return null;
  };

  return (
    <div className="ej-in flex h-full flex-col justify-between py-1">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-[var(--text-muted)] uppercase">
            {overline}
          </span>
          <span className="rounded-full bg-[var(--mint)] px-3 py-1 font-mono text-xs font-bold text-[var(--ink)]">
            {chipLabel}
          </span>
        </div>

        {/* Word Search Grid & Legend Layout - spacious gap */}
        <div className="mt-1 flex items-start gap-5 sm:gap-6">
          {/* 7x7 Grid Container */}
          <div
            aria-label="Sopa de letras de 7 por 7"
            className="grid w-full max-w-[300px] shrink-0 grid-cols-7 gap-1.5"
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const hit = getCellHit(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    style={hit ? { animationDelay: `${hit.delay}s` } : undefined}
                    className={`flex h-[38px] sm:h-[40px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] text-sm font-bold text-[var(--text-strong)] sm:text-base transition-colors duration-200 shadow-2xs ${
                      hit ? hit.className : ""
                    }`}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Legend Items */}
          <div className="flex flex-1 flex-col gap-2.5 pt-0.5">
            {legendItems.map((item) => (
              <div
                key={item.word}
                className="flex h-[44px] items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 shadow-2xs transition-colors duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: item.color }}
                    className="size-3 rounded-full shrink-0 shadow-2xs"
                  />
                  <span className="font-display text-sm font-bold text-[var(--text-strong)]">
                    {item.word}
                  </span>
                </div>

                {/* Checked indicator badge */}
                <div
                  style={{ animationDelay: `${item.checkDelay}s` }}
                  className="ej-pop flex size-6 items-center justify-center rounded-full bg-[var(--ink)] dark:bg-white text-white dark:text-[var(--ink)] shrink-0 shadow-2xs"
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
