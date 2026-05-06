import Link from "next/link";
import { Volume2, Mic } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";

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
        <Button variant="outline" icon={<Volume2 size={14} />} className="flex-1 py-2.5 rounded-lg text-sm">
          Listen
        </Button>
        <Link
          href="/practice"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--primary)] border border-[var(--primary)] rounded-lg py-2.5 hover:bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] transition-colors"
        >
          <Mic size={14} />
          Try
        </Link>
      </div>
    </Card>
  );
}
