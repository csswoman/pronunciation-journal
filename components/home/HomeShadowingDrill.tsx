import Link from "next/link";
import { Volume2, Mic } from "lucide-react";

interface HomeShadowingDrillProps {
  text?: string;
  sounds?: string;
  speedWpm?: number;
}

export default function HomeShadowingDrill({
  text = '"She sells seashells by the seashore."',
  sounds = "/ʃ/ /s/",
  speedWpm = 120,
}: HomeShadowingDrillProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tracking-widest uppercase text-[var(--primary)]">
          Shadowing Drill
        </span>
      </div>

      <p className="text-sm font-semibold text-[var(--text-primary)] -mt-1">Tongue twister</p>

      <div className="rounded-lg bg-surface-sunken px-4 py-3">
        <p className="text-base font-medium italic text-[var(--text-primary)] leading-relaxed">
          {text}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <span className="font-mono">{sounds}</span>
        <span>·</span>
        <span>Speed: {speedWpm} wpm</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border border-[var(--border-default)] bg-white/5 text-[var(--text-primary)] hover:bg-white/10 transition-colors">
          <Volume2 size={14} />
          Listen
        </button>
        <Link
          href="/practice"
          className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 bg-primary text-on-primary"
        >
          <Mic size={14} />
          Try
        </Link>
      </div>
    </div>
  );
}
