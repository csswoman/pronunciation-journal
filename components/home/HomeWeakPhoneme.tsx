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
    <Card variant="compact" className="gap-4 border-l-[3px]" style={{ background: "var(--surface-raised)", borderLeftColor: "var(--warning)" }}>
      <div className="flex items-center justify-between">
        <span className="text-tiny font-bold tracking-widest text-warning uppercase">Needs Practice</span>
        <span className="text-xs text-[var(--text-tertiary)]">{accuracy}% accuracy</span>
      </div>

      <p className="text-sm font-semibold text-[var(--deep-text)] -mt-1">Your weak phoneme</p>

      <div className="rounded-lg bg-surface-sunken px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-bold text-warning font-mono leading-none">{phoneme}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
        </div>
        {/* Waveform decoration */}
        <div className="flex items-center gap-[3px]">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-[3px] rounded-full opacity-80"
              style={{ height: `${h}px`, background: "var(--warning)" }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        You often pronounce <strong className="text-[var(--deep-text)]">{exampleMistake.target}</strong> as{" "}
        <em className="text-warning">"{exampleMistake.heard}"</em>. Try these:
      </p>

      <div className="flex flex-wrap gap-2">
        {PRACTICE_WORDS.map((w) => (
          <Link
            key={w}
            href="/practice"
            className="text-xs px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            {w}
          </Link>
        ))}
      </div>
    </Card>
  );
}

