import Link from "next/link";
import Card from "@/components/layout/Card";

const PRACTICE_WORDS = ["three", "thank", "thumb", "breath", "mouth", "teeth"];

interface HomeWeakPhonemeProps {
  phoneme?: string;
  label?: string;
  accuracy?: number;
  exampleMistake?: { target: string; heard: string };
}

export default function HomeWeakPhoneme({
  phoneme = "/θ/",
  label = "voiceless dental fricative",
  accuracy = 72,
  exampleMistake = { target: "think", heard: "sink" },
}: HomeWeakPhonemeProps) {
  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">Needs Practice</span>
        <span className="text-xs text-[var(--text-tertiary)]">{accuracy}% accuracy</span>
      </div>

      <p className="text-sm font-semibold text-[var(--deep-text)] -mt-1">Your weak phoneme</p>

      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-bold text-red-500 font-mono leading-none">{phoneme}</p>
          <p className="text-xs text-red-400 mt-1">{label}</p>
        </div>
        {/* Waveform decoration */}
        <div className="flex items-center gap-[3px]">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-[3px] rounded-full bg-red-400 opacity-80"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        You often pronounce <strong className="text-[var(--deep-text)]">{exampleMistake.target}</strong> as{" "}
        <em className="text-red-500">"{exampleMistake.heard}"</em>. Try these:
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PRACTICE_WORDS.map((w) => (
          <Link
            key={w}
            href="/practice"
            className="text-xs px-2.5 py-1 rounded-lg border border-[var(--line-divider)] bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] hover:text-[var(--deep-text)] transition-colors"
          >
            {w}
          </Link>
        ))}
      </div>
    </Card>
  );
}
