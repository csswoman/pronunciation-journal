import Link from "next/link";
import { Volume2 } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";

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
    <Card variant="compact" className="gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-success"></span>
          <h2 className="text-fg" style={{ font: "var(--font-h2)", fontWeight: 600 }}>Words to review</h2>
        </div>
        <Link href="/review" className="text-sm font-medium text-[var(--primary)] [transition:color_var(--transition-fast,150ms_ease)] hover:opacity-80">
          Open Word Bank →
        </Link>
      </div>

      <p className="-mt-1" style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
        SRS due today:{" "}
        <span className="font-semibold text-[var(--primary)]">{dueCount} cards</span>
      </p>

      <div className="flex flex-col divide-y divide-[var(--border-light)]">
        {words.map((w) => (
          <div key={w.word} className="flex items-center gap-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Play ${w.word}`}
              className="shrink-0 w-8 h-8 rounded-lg"
            >
              <Volume2 size={14} />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg leading-tight">{w.word}</p>
              <p className="text-xs text-fg-subtle font-mono truncate">
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
