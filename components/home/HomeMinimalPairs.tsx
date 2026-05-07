import Link from "next/link";
import Card from "@/components/layout/Card";

interface PairItem {
  a: { word: string; ipa: string };
  b: { word: string; ipa: string };
}

interface HomeMinimalPairsProps {
  soundA?: string;
  soundB?: string;
  pairs?: PairItem[];
  quizCount?: number;
}

export default function HomeMinimalPairs({
  soundA = "/ɪ/",
  soundB = "/iː/",
  pairs = [
    { a: { word: "ship", ipa: "/ʃɪp/" }, b: { word: "sheep", ipa: "/ʃiːp/" } },
    { a: { word: "bit",  ipa: "/bɪt/" }, b: { word: "beat",  ipa: "/biːt/" } },
    { a: { word: "live", ipa: "/lɪv/" }, b: { word: "leave", ipa: "/liːv/" } },
  ],
  quizCount = 10,
}: HomeMinimalPairsProps) {
  return (
    <Card variant="compact" className="gap-4">
      <span className="text-tiny font-bold tracking-widest text-[var(--primary)] uppercase border border-[var(--primary)] rounded-full px-2 py-0.5 self-start">
        Minimal Pairs
      </span>

      <div>
        <p className="text-base font-bold text-fg leading-snug">
          Can you hear the difference?
        </p>
        <p className="text-xs text-fg-subtle mt-0.5">
          {soundA} vs {soundB} · today's pair
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {pairs.map(({ a, b }) => (
          <div key={a.word} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center text-center px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)]">
              <span className="text-sm font-bold text-fg">{a.word}</span>
              <span className="text-tiny font-mono text-fg-subtle">{a.ipa}</span>
            </div>
            <span className="text-xs text-fg-subtle">vs</span>
            <div className="flex flex-col items-center text-center px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)]">
              <span className="text-sm font-bold text-fg">{b.word}</span>
              <span className="text-tiny font-mono text-fg-subtle">{b.ipa}</span>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/practice"
        className="text-sm font-semibold text-center text-[var(--primary)] hover:underline"
      >
        Take quiz ({quizCount} pairs) →
      </Link>
    </Card>
  );
}
