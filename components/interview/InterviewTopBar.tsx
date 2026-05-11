"use client";

import { RotateCcw, Square, Volume2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  title: string;
  visibleCount: number;
  totalTurns: number;
  speechSupported: boolean;
  isPlayingAll: boolean;
  onPlayAll: () => void;
  onReset: () => void;
}

export function InterviewTopBar({
  title, visibleCount, totalTurns, speechSupported, isPlayingAll, onPlayAll, onReset,
}: Props) {
  const progress = Math.round((visibleCount / totalTurns) * 100);

  return (
    <div
      className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b"
      style={{ borderColor: "var(--line-divider)", background: "var(--card-bg)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate text-fg">{title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--line-divider)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--color-accent)" }}
            />
          </div>
          <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "var(--muted-text)" }}>
            {Math.ceil(visibleCount / 2)}/{Math.ceil(totalTurns / 2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {speechSupported && (
          <Button
            variant={isPlayingAll ? "soft" : "outline"}
            size="sm"
            icon={isPlayingAll ? <Square size={11} /> : <Volume2 size={11} />}
            onClick={onPlayAll}
          >
            {isPlayingAll ? "Stop" : "Preview"}
          </Button>
        )}
        <Button variant="outline" size="sm" icon={<RotateCcw size={11} />} onClick={onReset}>
          New
        </Button>
      </div>
    </div>
  );
}
