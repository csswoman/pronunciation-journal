import Link from "next/link";
import { Volume2, Mic, AudioLines } from "lucide-react";

interface HomeShadowingDrillProps {
  text?: string;
  sounds?: string[];
  speedWpm?: number;
}

export default function HomeShadowingDrill({
  text = '"She sells seashells by the seashore."',
  sounds = ["/ʃ/", "/s/"],
  speedWpm = 120,
}: HomeShadowingDrillProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <AudioLines size={14} className="text-[var(--primary)]" />
        <span className="text-xs font-medium tracking-widest uppercase text-[var(--primary)]">
          Shadowing Drill
        </span>
      </div>

      <p className="text-lg font-bold text-[var(--text-primary)] -mt-1">Tongue twister</p>

      <div className="rounded-lg bg-surface-sunken px-4 py-3 border-l-4 border-[var(--primary)]">
        <p className="text-base font-medium italic text-[var(--primary)] leading-relaxed">
          {text}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        {sounds.map((s) => (
          <span
            key={s}
            className="font-mono px-2 py-0.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            {s}
          </span>
        ))}
        <span>·</span>
        <span>Speed: {speedWpm} wpm</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 h-10 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-white/5 transition-colors">
          <Volume2 size={15} />
          Listen
        </button>
        <Link
          href="/practice/sounds"
          className="flex-1 h-10 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 bg-primary text-on-primary"
        >
          <Mic size={15} />
          Try
        </Link>
      </div>
    </div>
  );
}
