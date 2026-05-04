import type { Difficulty } from "@/lib/types";

const dotClass: Record<Difficulty, string> = {
  easy:   "dot-success",
  medium: "dot-warning",
  hard:   "dot-danger",
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
    <span className={["badge", className].filter(Boolean).join(" ")}>
      <span className={dotClass[difficulty]} />
      {labelMap[difficulty]}
    </span>
  );
}
