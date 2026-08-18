"use client";

// Planned structure:
// <LexiconQuickChips>
//   <recent chips />
//   <due chips />
// </LexiconQuickChips>

interface LexiconQuickChipsProps {
  recentWords: string[];
  dueWords: string[];
  onChipPick: (word: string) => void;
}

export function LexiconQuickChips({
  recentWords,
  dueWords,
  onChipPick,
}: LexiconQuickChipsProps) {
  if (recentWords.length === 0 && dueWords.length === 0) return null;

  return (
    <div className="words-lexicon__quick">
      {recentWords.length > 0 && (
        <>
          <span className="words-lexicon__quick-lbl">Recientes:</span>
          {recentWords.map((w) => (
            <button
              key={`recent:${w}`}
              type="button"
              className="words-lexicon__qchip"
              onClick={() => onChipPick(w)}
            >
              {w}
            </button>
          ))}
        </>
      )}
      {dueWords.length > 0 && (
        <>
          <span className="words-lexicon__quick-lbl words-lexicon__quick-lbl--spaced">
            Para repasar:
          </span>
          {dueWords.map((w) => (
            <button
              key={`due:${w}`}
              type="button"
              className="words-lexicon__qchip is-due"
              onClick={() => onChipPick(w)}
            >
              {w}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
