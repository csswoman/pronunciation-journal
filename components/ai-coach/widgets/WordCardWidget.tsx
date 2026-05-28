"use client";

import type { WordCardArgs } from "@/lib/ai-practice/tools/registry";

interface Props {
  args: WordCardArgs;
}

export default function WordCardWidget({ args }: Props) {
  return (
    <div className="py-4 px-2 space-y-3">
      <div className="flex flex-col items-center gap-1 py-6 px-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <span className="text-2xl font-bold text-[var(--text-primary)]">{args.word}</span>
        {args.ipa && (
          <span className="text-sm font-mono text-[var(--text-tertiary)]">/{args.ipa}/</span>
        )}
      </div>
      <div className="px-4 py-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{args.meaning}</p>
        {args.example && (
          <p className="text-sm italic text-[var(--text-tertiary)] mt-1">&ldquo;{args.example}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
