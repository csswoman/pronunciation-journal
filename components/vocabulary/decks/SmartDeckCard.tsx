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
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden transition-all hover:shadow-lg"
      style={{
        border: "1.5px dashed color-mix(in oklch, var(--primary) 50%, var(--line-divider))",
        background: "color-mix(in oklch, var(--primary) 4%, var(--card-bg))",
      }}
    >
      <div className="px-4 py-[14px] flex items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: "color-mix(in oklch, var(--primary) 15%, var(--card-bg))" }}
          >
            🔥
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-base text-fg leading-tight">Difficult words</p>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: "color-mix(in oklch, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                  border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
                }}
              >
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
          className="px-[14px] py-1.5 !text-[13px] !rounded-[var(--radius-sm)]"
        >
          Study
        </Button>
        </div>
      </div>
    </div>
  );
}
