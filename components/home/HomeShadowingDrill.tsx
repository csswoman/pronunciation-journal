import Link from "next/link";
import { Volume2, Mic } from "lucide-react";
import Card from "@/components/layout/Card";

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
    <Card variant="compact" className="gap-4 border-l-[3px] border-l-warning">
      <div className="flex items-center gap-2">
        <span className="text-base">🌀</span>
        <span className="text-tiny font-bold tracking-widest text-warning uppercase">
          Shadowing Drill
        </span>
      </div>

      <p className="text-sm font-semibold text-[var(--deep-text)] -mt-1">Tongue twister</p>

      <div className="rounded-lg bg-surface-sunken px-4 py-3">
        <p className="text-base font-semibold italic text-[var(--warning)] leading-relaxed">
          {text}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <span className="text-base">🎯</span>
        <span className="font-mono text-[var(--text-secondary)]">{sounds}</span>
        <span>·</span>
        <span>Speed: {speedWpm} wpm</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-fg border border-border-subtle rounded-lg py-2.5 hover:bg-surface-sunken transition-colors">
          <Volume2 size={14} />
          Listen
        </button>
        <Link
          href="/practice"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--on-primary)] bg-[var(--warning)] hover:opacity-90 rounded-lg py-2.5 transition-colors"
        >
          <Mic size={14} />
          Try
        </Link>
      </div>
    </Card>
  );
}
