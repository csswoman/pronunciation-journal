import type { Difficulty } from "@/lib/types";

const pillClass: Record<Difficulty, string> = {
  easy: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]",
  medium: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]",
  hard: "bg-[var(--error-soft)] text-[var(--error)] border-[var(--error-border)]",
};

const labelMap: Record<Difficulty, string> = {
  easy:   "Easy",
  medium: "Mid",
  hard:   "Hard",
};

interface DifficultyPillProps {
  difficulty: Difficulty;
  className?: string;
}

export default function DifficultyPill({ difficulty, className }: DifficultyPillProps) {
  return (
    <span
      className={`inline-block w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[1.4] ${pillClass[difficulty]} ${className ?? ""}`}
    >
      {labelMap[difficulty]}
    </span>
  );
}
