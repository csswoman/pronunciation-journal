import Link from "next/link";

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
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-300">Needs Practice</span>
        <span className="text-xs text-[var(--text-tertiary)]">{accuracy}% accuracy</span>
      </div>

      <p className="text-sm font-semibold text-[var(--text-primary)] -mt-1">Recommended for you</p>

      <div className="rounded-lg bg-surface-sunken px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-4xl font-bold leading-none" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--primary)" }}>
            {phoneme}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{label}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-1 rounded-full opacity-80"
              style={{ height: `${h}px`, background: "var(--primary)" }}
            />
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        You often pronounce <strong className="text-[var(--text-primary)]">{exampleMistake.target}</strong> as{" "}
        <em style={{ color: "var(--primary)" }}>"{exampleMistake.heard}"</em>. Try these:
      </p>

      <div className="flex flex-wrap gap-2">
        {PRACTICE_WORDS.map((w) => (
          <Link
            key={w}
            href="/practice"
            className="text-xs px-3 h-9 flex items-center rounded-lg border border-[var(--border-default)] bg-surface-sunken text-[var(--text-secondary)] transition-colors duration-150 hover:bg-white/8 hover:text-[var(--primary)] hover:border-[var(--primary)]"
          >
            {w}
          </Link>
        ))}
      </div>
    </div>
  );
}
