"use client";

import type { WordCardArgs } from "@/lib/ai-practice/tools/registry";

interface Props {
  args: WordCardArgs;
}

export default function WordCardWidget({ args }: Props) {
  return (
    <div
      className="rounded-xl border p-4 space-y-1.5"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-fg">
          {args.word}
        </span>
        {args.ipa && (
          <span className="text-sm font-mono text-fg-subtle">
            /{args.ipa}/
          </span>
        )}
      </div>
      <p className="text-sm text-fg-muted">
        {args.meaning}
      </p>
      {args.example && (
        <p className="text-sm italic text-fg-subtle">
          &ldquo;{args.example}&rdquo;
        </p>
      )}
    </div>
  );
}
