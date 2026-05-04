"use client";

const DIFFICULTY_CONFIG = {
  again: { label: "No lo sabía", emoji: "❌", key: "1", q: 1, bg: "bg-error-soft", text: "text-error", border: "border-error-border" },
  hard:  { label: "Con dificultad", emoji: "😐", key: "2", q: 3, bg: "bg-warning-soft", text: "text-warning", border: "border-warning" },
  easy:  { label: "Fácil",   emoji: "✅", key: "3", q: 5, bg: "bg-success-soft", text: "text-success", border: "border-success" },
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
          <div className="text-tiny opacity-60 font-normal">press {cfg.key}</div>
        </button>
      ))}
    </div>
  );
}
