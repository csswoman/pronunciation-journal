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
    <Card variant="compact" className="gap-4 border-l-4 border-l-orange-400">
      <div className="flex items-center gap-2">
        <span className="text-base">🌀</span>
        <span className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">
          Shadowing Drill
        </span>
      </div>

      <p className="text-sm font-semibold text-[var(--deep-text)] -mt-1">Tongue twister</p>

      <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 px-4 py-3">
        <p className="text-base font-semibold italic text-orange-500 leading-relaxed">
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
        <button className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--deep-text)] border border-[var(--line-divider)] rounded-xl py-2.5 hover:bg-[var(--btn-regular-bg)] transition-colors">
          <Volume2 size={14} />
          Listen
        </button>
        <Link
          href="/practice"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 rounded-xl py-2.5 transition-colors"
        >
          <Mic size={14} />
          Try
        </Link>
      </div>
    </Card>
  );
}
