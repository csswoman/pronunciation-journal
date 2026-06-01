"use client";

import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";

interface PracticeButtonProps {
  categoryId: string;
}

export function PracticeButton({ categoryId }: PracticeButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/lexicon/${categoryId}/practice`)}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--primary)] text-[var(--on-primary)] border-none cursor-pointer transition-[filter] duration-150 hover:brightness-[1.06]"
    >
      <Dumbbell className="w-4 h-4" aria-hidden />
      Practice lesson
    </button>
  );
}
