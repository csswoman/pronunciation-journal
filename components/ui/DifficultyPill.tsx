import Badge from "@/components/ui/Badge";
import type { Difficulty } from "@/lib/types";

const variantMap = {
  easy:   "success",
  medium: "warning",
  hard:   "error",
} as const;

const labelMap = {
  easy:   "Easy",
  medium: "Mid",
  hard:   "Hard",
} as const;

interface DifficultyPillProps {
  difficulty: Difficulty;
  className?: string;
}

export default function DifficultyPill({ difficulty, className }: DifficultyPillProps) {
  return (
    <Badge
      label={labelMap[difficulty]}
      variant={variantMap[difficulty]}
      dot
      className={className}
    />
  );
}
