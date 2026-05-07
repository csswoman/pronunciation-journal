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
    <Card variant="compact" className="gap-4 border-l-2" style={{ background: "var(--surface-raised)", borderLeftColor: "var(--warning)" }}>
      <div className="flex items-center justify-between">
        <span className="text-warning" style={{ font: "var(--font-tiny)", letterSpacing: "0.05em", fontWeight: 600 }}>Needs Practice</span>
        <span className="text-xs text-fg-subtle">{accuracy}% accuracy</span>
      </div>

      <h3 className="text-fg -mt-1" style={{ font: "var(--font-h3)", fontWeight: 500 }}>Recommended for you</h3>

      <div className="rounded-lg bg-surface-sunken px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-bold text-warning leading-none" style={{ font: "var(--font-mono)" }}>{phoneme}</p>
          <p className="text-xs text-fg-muted mt-1">{label}</p>
        </div>
        {/* Waveform decoration */}
        <div className="flex items-center gap-0.5">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-1 rounded-full opacity-80"
              style={{ height: `${h}px`, background: "var(--warning)" }}
            />
          ))}
        </div>
      </div>

      <p style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
        You often pronounce <strong className="text-fg">{exampleMistake.target}</strong> as{" "}
        <em className="text-warning">"{exampleMistake.heard}"</em>. Try these:
      </p>

      <div className="flex flex-wrap gap-2">
        {PRACTICE_WORDS.map((w) => (
          <Link
            key={w}
            href="/practice"
            className="cursor-pointer text-xs px-[var(--space-3)] min-h-[44px] flex items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-sunken)] text-fg-muted [transition:all_var(--transition-fast,150ms_ease)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
          >
            {w}
          </Link>
        ))}
      </div>
    </Card>
  );
}

