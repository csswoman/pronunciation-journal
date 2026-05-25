"use client";

import { Undo2 } from "lucide-react";

export default function IPAProgressBar({
  explored,
  total,
  onReset,
  undoAvailable = false,
  onUndo,
}: {
  explored: number;
  total: number;
  onReset: () => void;
  undoAvailable?: boolean;
  onUndo?: () => void;
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((explored / total) * 100));

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-2xl font-serif leading-none text-fg tabular-nums">
          {explored}
        </span>
        <span className="text-sm text-fg-muted tabular-nums">/{total}</span>
        <span className="text-sm text-fg-muted ml-2">
          sounds explored today
        </span>
      </div>

      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--line-divider)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--primary)",
          }}
        />
      </div>

      <span className="text-xs font-semibold text-fg-muted shrink-0 tabular-nums">
        {pct}%
      </span>

      {undoAvailable && onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70 animate-chip-appear"
          style={{ color: "var(--primary)" }}
        >
          <Undo2 size={12} />
          Undo reset
        </button>
      ) : (
        <button
          type="button"
          onClick={onReset}
          disabled={explored === 0}
          className="text-xs font-medium transition-colors hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
