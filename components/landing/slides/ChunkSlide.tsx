// Planned structure:
// <ChunkSlide>
//   header row (overline)
//   Spanish prompt sentence ("Tengo muchas ganas de verte.")
//   Target response box (dashed border, pieces pop in sequential order)
//   Word bank below (pieces get .ej-used with matching delays)
//   SuccessToast
import { CHUNK_SLIDE_DATA } from "@/lib/landing/showcase-data";
import { SuccessToast } from "@/components/landing/SuccessToast";

export function ChunkSlide() {
  const {
    overline,
    promptSpanish,
    targetSentence,
    chunkIndices,
    bankPieces,
    toastMessage,
    toastDelaySeconds,
  } = CHUNK_SLIDE_DATA;

  const getDelayForPiece = (word: string): number => {
    const targetIndex = targetSentence.indexOf(word);
    return 0.5 + (targetIndex >= 0 ? targetIndex : 0) * 0.35;
  };

  return (
    <div className="ej-in flex h-full flex-col justify-between py-1">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-[var(--text-muted)] uppercase">
            {overline}
          </span>
        </div>

        {/* Spanish Prompt */}
        <h3 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-[30px] leading-snug">
          {promptSpanish}
        </h3>

        {/* Target Answer Zone - ample padding & gap */}
        <div className="flex min-h-[72px] flex-wrap items-center gap-2.5 rounded-[20px] border-2 border-dashed border-[var(--lilac-deep)] bg-[var(--lilac-soft)] dark:bg-[var(--surface-raised)] p-3.5 sm:p-4 transition-colors duration-200">
          {targetSentence.map((word, idx) => {
            const isChunkPart = chunkIndices.includes(idx);
            const delay = 0.5 + idx * 0.35;

            return (
              <span
                key={word}
                style={{ animationDelay: `${delay}s` }}
                className={`ej-pop inline-flex h-10 items-center justify-center rounded-full px-4 text-sm sm:text-base font-semibold shadow-2xs ${
                  isChunkPart
                    ? "bg-[var(--lilac)] text-[var(--ink)]"
                    : "bg-white dark:bg-[var(--surface)] text-[var(--ink)] dark:text-[var(--text)] border border-black/5 dark:border-[var(--border)]"
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Word Bank - spacious margin-bottom to never touch SuccessToast */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 pb-4">
          {bankPieces.map((word) => {
            const delay = getDelayForPiece(word);
            return (
              <span
                key={word}
                style={{ animationDelay: `${delay}s` }}
                className="ej-used inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-sm sm:text-base font-semibold text-[var(--text-secondary)] shadow-2xs opacity-60"
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <SuccessToast message={toastMessage} delaySeconds={toastDelaySeconds} />
    </div>
  );
}
