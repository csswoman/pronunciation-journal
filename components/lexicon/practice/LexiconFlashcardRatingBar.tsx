import type { FlashcardRating } from "@/lib/word-bank/lexicon-review-types";

// Planned structure:
// <LexiconFlashcardRatingBar>
//   {!revealed ? (
//     <Button (Mostrar respuesta + Espacio badge)>
//   ) : (
//     <div (3 Rating Buttons Grid)>
//       <button (1 Otra vez: Salmon)>
//       <button (2 Me costó: Butter)>
//       <button (3 La domino: Mint)>
//   )}
// </LexiconFlashcardRatingBar>

interface LexiconFlashcardRatingBarProps {
  revealed: boolean;
  disabled?: boolean;
  onReveal: () => void;
  onRate: (rating: FlashcardRating) => void;
}

export function LexiconFlashcardRatingBar({
  revealed,
  disabled = false,
  onReveal,
  onRate,
}: LexiconFlashcardRatingBarProps) {
  if (!revealed) {
    return (
      <div className="w-full flex justify-center pt-2">
        <button
          type="button"
          onClick={onReveal}
          disabled={disabled}
          className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-body-sm sm:text-body px-8 py-3.5 shadow-xs focus-ring transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Mostrar respuesta</span>
          <span className="font-mono text-xs bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-md">
            Espacio
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2.5 pt-1">
      <p className="text-caption font-semibold text-fg-muted text-center select-none">
        ¿Qué tal la recordaste?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Valoración de recuerdo">
        {/* 1 Otra vez (Salmon) */}
        <button
          type="button"
          onClick={() => onRate("forgot")}
          disabled={disabled}
          className="flex flex-col items-center justify-center rounded-2xl bg-[#f7b7a6] hover:brightness-95 text-stone-900 p-3.5 border border-stone-900/10 shadow-2xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs border border-stone-900/20 rounded px-1.5 py-0.2">
              1
            </span>
            <span className="text-body-sm font-bold">Otra vez</span>
          </div>
          <span className="text-xs font-normal text-stone-700 mt-0.5">
            en unos minutos
          </span>
        </button>

        {/* 2 Me costó (Butter) */}
        <button
          type="button"
          onClick={() => onRate("normal")}
          disabled={disabled}
          className="flex flex-col items-center justify-center rounded-2xl bg-[#f8e08e] hover:brightness-95 text-stone-900 p-3.5 border border-stone-900/10 shadow-2xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs border border-stone-900/20 rounded px-1.5 py-0.2">
              2
            </span>
            <span className="text-body-sm font-bold">Me costó</span>
          </div>
          <span className="text-xs font-normal text-stone-700 mt-0.5">
            en 1-2 días
          </span>
        </button>

        {/* 3 La domino (Mint) */}
        <button
          type="button"
          onClick={() => onRate("known")}
          disabled={disabled}
          className="flex flex-col items-center justify-center rounded-2xl bg-[#a8e6c9] hover:brightness-95 text-stone-900 p-3.5 border border-stone-900/10 shadow-2xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs border border-stone-900/20 rounded px-1.5 py-0.2">
              3
            </span>
            <span className="text-body-sm font-bold">La domino</span>
          </div>
          <span className="text-xs font-normal text-stone-700 mt-0.5">
            en 4-7 días
          </span>
        </button>
      </div>
    </div>
  );
}
