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

const DIFFICULTY_STYLES: Record<ReviewWord["difficulty"], string> = {
  easy: "text-green-600 bg-green-50 dark:bg-green-950/30",
  med: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
  hard: "text-red-500 bg-red-50 dark:bg-red-950/20",
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
          <span className="text-lg">🟩</span>
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
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[w.difficulty]}`}>
              {w.difficulty}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
