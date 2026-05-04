"use client";

import type { Difficulty } from "@/lib/ipa-data";

const dotClass: Record<Difficulty, string> = {
  easy:   "dot-success",
  medium: "dot-warning",
  hard:   "dot-danger",
};

export default function DifficultyPill({
  difficulty,
  label,
  muted,
}: {
  difficulty: Difficulty;
  label?: string;
  muted?: boolean;
}) {
  if (muted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-tiny font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--overlay-weak)", color: "var(--on-primary)" }}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass[difficulty]}`} />
        {label ?? difficulty}
      </span>
    );
  }

  return (
    <span className="badge">
      <span className={dotClass[difficulty]} />
      {label ?? difficulty}
    </span>
  );
}
