"use client";

const DIFFICULTY_CONFIG = {
  again: { label: "No lo sabía", emoji: "❌", key: "1", q: 1, bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  hard:  { label: "Con dificultad", emoji: "😐", key: "2", q: 3, bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  easy:  { label: "Fácil",   emoji: "✅", key: "3", q: 5, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_CONFIG;
export type DifficultyQ = 1 | 3 | 5;
export { DIFFICULTY_CONFIG };

interface StudyDifficultyButtonsProps {
  onDifficulty: (key: DifficultyKey) => void;
  visible?: boolean;
}

export function StudyDifficultyButtons({ onDifficulty, visible = true }: StudyDifficultyButtonsProps) {
  if (!visible) {
    return (
      <div className="px-4 pb-24 lg:pb-4">
        <p className="text-center text-sm text-[var(--text-tertiary)] py-3">
          Tap the card to reveal the answer
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 lg:pb-4 grid grid-cols-3 gap-2">
      {(Object.entries(DIFFICULTY_CONFIG) as [DifficultyKey, typeof DIFFICULTY_CONFIG[DifficultyKey]][]).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onDifficulty(key)}
          className={`py-3 rounded-2xl border font-bold transition-opacity hover:opacity-90 active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          <div className="text-xl mb-0.5">{cfg.emoji}</div>
          <div className="text-sm">{cfg.label}</div>
          <div className="text-[10px] opacity-60 font-normal">press {cfg.key}</div>
        </button>
      ))}
    </div>
  );
}
