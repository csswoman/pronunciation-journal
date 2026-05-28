import Link from "next/link";
import { Volume2, LibraryBig, ArrowRight } from "lucide-react";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { getWordStrength } from "@/lib/word-bank/strength";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";

interface HomeWordsToReviewProps {
  dueCount?: number;
  words?: WordBankEntry[];
}

export default function HomeWordsToReview({
  dueCount = 0,
  words = [],
}: HomeWordsToReviewProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LibraryBig size={18} className="text-[var(--primary)]" />
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Words to review</h2>
        </div>
        <Link
          href="/words?tab=my-words"
          className="text-[var(--primary)] hover:opacity-80 transition-opacity flex text-xs gap-1 font-medium items-center hover:underline"
          aria-label="Open Vocabulary"
        >
          Open Vocabulary <ArrowRight size={14} />
        </Link>
      </div>

      {/* Subline */}
      <p className="text-xs text-[var(--text-tertiary)] -mt-2">
        Due today · {dueCount} words
      </p>

      {/* Word rows */}
      <div className="flex flex-col">
        {words.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)] py-2">No words due yet — check back later.</p>
        )}
        {words.map((w, idx) => (
          <div
            key={w.id}
            className={[
              "flex items-center gap-3 py-3",
              idx < words.length - 1 ? "border-b border-border-subtle" : "",
            ].join(" ")}
          >
            {/* Audio icon */}
            <button
              aria-label={`Play ${w.text}`}
              className="shrink-0 w-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Volume2 size={15} />
            </button>

            {/* Word + phonetic */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{w.text}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                {w.ipa ? `/${w.ipa.replace(/^\/|\/$/g, "")}/` : ""}
                {w.ipa && w.translation ? " · " : ""}
                {w.translation ?? ""}
              </p>
            </div>

            {/* Strength bars */}
            <WordStrengthBars strength={getWordStrength(w)} size={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
