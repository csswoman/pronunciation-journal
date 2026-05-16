"use client";

import { Play, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

interface SmartDeckCardProps {
  count: number;
  onStudy: () => void;
}

export function SmartDeckCard({ count, onStudy }: SmartDeckCardProps) {
  const progressPercent = count > 0 ? Math.max(8, Math.min(100, Math.round((1 / (count + 1)) * 100))) : 0;
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border-[1.5px] border-dashed border-[color-mix(in_oklch,var(--primary)_50%,var(--line-divider))] bg-[color-mix(in_oklch,var(--primary)_4%,var(--card-bg))] transition-all hover:shadow-lg">
      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--primary)_15%,var(--card-bg))] text-xl">
            🔥
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-base text-fg leading-tight">Difficult words</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--primary)_30%,transparent)] bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                <Zap size={10} strokeWidth={2.5} />
                Smart
              </span>
            </div>
            <p className="text-xs text-fg-subtle mt-0.5">Auto-generated · updates as you learn</p>
          </div>
        </div>

        <div className="w-full max-w-[320px] space-y-1.5 mx-auto">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-fg-muted">Progress</span>
            <span className="text-fg-subtle">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} color="var(--primary)" height="xs" />
        </div>

        <div className="flex items-center justify-between gap-3 min-w-fit">
        <span className="text-[12px] text-fg-subtle whitespace-nowrap">
          {count} word{count !== 1 ? "s" : ""} marked difficult
        </span>
        <Button
          variant="primary"
          onClick={onStudy}
          icon={<Play size={15} className="fill-current" />}
          className="px-3 py-1.5 !text-[13px] !rounded-[var(--radius-sm)]"
        >
          Study
        </Button>
        </div>
      </div>
    </div>
  );
}
