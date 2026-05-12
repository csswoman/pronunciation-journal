import Link from "next/link";
import { Volume2 } from "lucide-react";
import Badge, { BadgeColor } from "@/components/ui/Badge";

interface ReviewWord {
  word: string;
  ipa: string;
  translation: string;
  difficulty: "easy" | "med" | "hard";
}

interface HomeWordsToReviewProps {
  dueCount?: number;
  words?: ReviewWord[];
}

const DIFFICULTY_COLOR: Record<ReviewWord["difficulty"], BadgeColor> = {
  hard: "red",
  med:  "amber",
  easy: "emerald",
};

const DIFFICULTY_LABEL: Record<ReviewWord["difficulty"], string> = {
  hard: "Hard",
  med:  "Med",
  easy: "Easy",
};

export default function HomeWordsToReview({
  dueCount = 12,
  words = [
    { word: "thorough",     ipa: "/ˈθʌrə/",          translation: "completo",        difficulty: "hard" },
    { word: "awkward",      ipa: "/ˈɔː.kwəd/",        translation: "incómodo",        difficulty: "med"  },
    { word: "particularly", ipa: "/pəˈtɪk.jə.lə.li/", translation: "particularmente", difficulty: "hard" },
  ],
}: HomeWordsToReviewProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Words to review</h2>
        <Link
          href="/review"
          className="text-sm font-medium text-[var(--primary)] hover:opacity-80 transition-opacity"
        >
          Open Word Bank →
        </Link>
      </div>

      {/* Subline */}
      <p className="text-xs text-[var(--text-tertiary)] -mt-2">
        Due today · {dueCount} words
      </p>

      {/* Word rows */}
      <div className="flex flex-col">
        {words.map((w, idx) => (
          <div
            key={w.word}
            className={[
              "flex items-center gap-3 py-3",
              idx < words.length - 1 ? "border-b border-border-subtle" : "",
            ].join(" ")}
          >
            {/* Audio icon */}
            <button
              aria-label={`Play ${w.word}`}
              className="shrink-0 w-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Volume2 size={15} />
            </button>

            {/* Word + phonetic */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{w.word}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                {w.ipa} · {w.translation}
              </p>
            </div>

            {/* Difficulty badge */}
            <Badge label={DIFFICULTY_LABEL[w.difficulty]} color={DIFFICULTY_COLOR[w.difficulty]} />
          </div>
        ))}
      </div>
    </div>
  );
}
