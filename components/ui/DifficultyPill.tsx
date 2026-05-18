import type { Difficulty } from "@/lib/types";

const pillClass: Record<Difficulty, string> = {
  easy: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]",
  medium: "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]",
  hard: "bg-[var(--error-soft)] text-[var(--error)] border-[var(--error-border)]",
};

const dotClass: Record<Difficulty, string> = {
  easy: "dot-success",
  medium: "dot-warning",
  hard: "dot-danger",
};

const defaultLabel: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Mid",
  hard: "Hard",
};

interface DifficultyPillProps {
  difficulty: Difficulty;
  /** Override the displayed label. Defaults to Easy / Mid / Hard. */
  label?: string;
  /** Badge+dot visual (used in IPA context). Defaults to border-pill. */
  variant?: "pill" | "badge";
  /** Muted dot style for selected states (badge variant only). */
  muted?: boolean;
  className?: string;
}

export default function DifficultyPill({
  difficulty,
  label,
  variant = "pill",
  muted = false,
  className = "",
}: DifficultyPillProps) {
  const text = label ?? defaultLabel[difficulty];

  if (variant === "badge") {
    if (muted) {
      return (
        <span className={`inline-flex items-center gap-1.5 text-tiny font-semibold px-2 py-0.5 rounded-full bg-overlay-weak text-on-primary ${className}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass[difficulty]}`} />
          {text}
        </span>
      );
    }
    return (
      <span className={`badge ${className}`}>
        <span className={dotClass[difficulty]} />
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-block w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[1.4] ${pillClass[difficulty]} ${className}`}
    >
      {text}
    </span>
  );
}
