import type { Difficulty } from "@/lib/types";

const pillStyle: Record<Difficulty, React.CSSProperties> = {
  easy:   { background: "var(--success-soft)",  color: "var(--success)",  border: "1px solid var(--success-border)" },
  medium: { background: "var(--warning-soft)",  color: "var(--warning)",  border: "1px solid var(--warning-border)" },
  hard:   { background: "var(--error-soft)",    color: "var(--error)",    border: "1px solid var(--error-border)" },
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
      className={className}
      style={{
        ...pillStyle[difficulty],
        borderRadius: "var(--radius-full)",
        fontSize: "11px",
        fontWeight: 500,
        padding: "2px 8px",
        display: "inline-block",
        width: "fit-content",
        lineHeight: 1.4,
      }}
    >
      {labelMap[difficulty]}
    </span>
  );
}
