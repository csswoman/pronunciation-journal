import Link from "next/link";
import { Volume2 } from "lucide-react";
import Card from "@/components/layout/Card";

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

const DIFFICULTY_DOT: Record<ReviewWord["difficulty"], string> = {
  easy: "dot-success",
  med: "dot-warning",
  hard: "dot-warning",
};

export default function HomeWordsToReview({
  dueCount = 12,
  words = [
    { word: "thorough", ipa: "/ˈθʌrə/", translation: "completo", difficulty: "hard" },
    { word: "awkward", ipa: "/ˈɔː.kwəd/", translation: "incómodo", difficulty: "med" },
    { word: "particularly", ipa: "/pəˈtɪk.jə.lə.li/", translation: "particularmente", difficulty: "hard" },
  ],
}: HomeWordsToReviewProps) {
  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-success"></span>
          <span className="text-sm font-semibold text-[var(--deep-text)]">Words to review</span>
        </div>
        <Link href="/review" className="text-sm font-medium text-[var(--primary)] hover:underline">
          Open Word Bank →
        </Link>
      </div>

      <p className="text-xs text-[var(--text-secondary)] -mt-1">
        SRS due today:{" "}
        <span className="font-semibold text-[var(--primary)]">{dueCount} cards</span>
      </p>

      <div className="flex flex-col divide-y divide-[var(--border-light)]">
        {words.map((w) => (
          <div key={w.word} className="flex items-center gap-3 py-2.5">
            <button
              aria-label={`Play ${w.word}`}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
            >
              <Volume2 size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--deep-text)] leading-tight">{w.word}</p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono truncate">
                {w.ipa} · {w.translation}
              </p>
            </div>
            <span className="badge">
              <span className={DIFFICULTY_DOT[w.difficulty]} />
              {w.difficulty}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
